/**
 * bot-squash - a free-tier bot detection + mitigation Worker.
 *
 * Works WITHOUT Cloudflare Bot Management or Zone Pro. It scores each request
 * from signals available on every plan (User-Agent, request headers, and the
 * `request.cf` object: ASN, org, HTTP protocol, TLS version) and takes an
 * action: allow, challenge (lightweight JS-cookie), or block.
 *
 * Two ways to use it:
 *   1. Standalone: deploy on a route in front of a site. Allowed traffic is
 *      proxied to origin via `fetch(request)`.
 *   2. Middleware: `import { evaluate } from '.../bot-squash'` inside an
 *      existing Worker and branch on the verdict before your own logic.
 *
 * Optional: bind a Durable Object (RATE_LIMITER) for per-IP rate limiting.
 * The core heuristics need zero storage and run on the free plan.
 */

export interface Env {
	/** Secret used to sign the challenge-pass cookie. Set via `wrangler secret put BOT_SQUASH_SECRET`. */
	BOT_SQUASH_SECRET: string;
	/** Optional per-IP rate limiter. If unbound, rate limiting is skipped. */
	RATE_LIMITER?: DurableObjectNamespace;
	/** Requests per minute per IP before a request is flagged. Default 120. */
	BOT_SQUASH_RPM?: string;
}

type Action = 'allow' | 'challenge' | 'block';

interface Verdict {
	action: Action;
	score: number;
	reasons: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Config - tune these per your risk tolerance.
// ─────────────────────────────────────────────────────────────────────────────

const CONFIG = {
	// Score thresholds.
	blockAt: 100,
	challengeAt: 45,

	// Paths that are NEVER guarded (health checks, webhooks, etc.).
	bypassPaths: /^\/(health|robots\.txt|favicon\.ico|\.well-known\/)/i,

	// Good bots we WANT through: search crawlers + social unfurlers (so shared
	// links still generate OG previews). Matched on UA and allowed immediately.
	// NOTE: UA is spoofable. For hard guarantees on Googlebot you would reverse-
	// verify by PTR/ASN; that residual risk is accepted here for simplicity.
	goodBotUA:
		/(googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|applebot|petalbot|facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|whatsapp|pinterest|redditbot|google-inspectiontool)/i,

	// Obvious automation / scraping tools and empty-ish agents -> hard block.
	badBotUA:
		/(curl|wget|python-requests|python-urllib|go-http-client|libwww-perl|okhttp|java\/|node-fetch|axios\/|scrapy|httpclient|aiohttp|phantomjs|headlesschrome|puppeteer|playwright|selenium|masscan|zgrab|nmap|nikto|sqlmap|semrushbot|ahrefsbot|mj12bot|dotbot|dataforseo|bytespider)/i,

	// Datacenter / hosting ASNs. Real consumer users are on residential/mobile
	// ISPs; traffic from these is usually automation. Good bots are allow-listed
	// by UA BEFORE this check, so their ASNs here only affect non-bot scrapers.
	datacenterASNs: new Set<number>([
		16509, 14618, // Amazon AWS
		15169, 396982, 19527, // Google / GCP
		8075, // Microsoft / Azure
		14061, // DigitalOcean
		16276, // OVH
		24940, // Hetzner
		20473, // Vultr / Choopa
		63949, // Linode / Akamai
		45102, 37963, // Alibaba
		132203, // Tencent
		51167, // Contabo
		9009, // M247
		60781, // LeaseWeb
		12876, // Scaleway / Online SAS
		31898, // Oracle Cloud
	]),
	datacenterOrgHint:
		/(amazon|aws|google cloud|gcp|microsoft|azure|digitalocean|ovh|hetzner|vultr|linode|alibaba|tencent|contabo|m247|leaseweb|scaleway|oracle|colocrossing|choopa|datacamp|hostwinds)/i,

	// Challenge cookie lifetime.
	passTtlSeconds: 60 * 60 * 12, // 12h
};

// ─────────────────────────────────────────────────────────────────────────────
// Scoring
// ─────────────────────────────────────────────────────────────────────────────

/** Evaluate a request and return a verdict. Pure/synchronous - safe to import. */
export function evaluate(request: Request): Verdict {
	const reasons: string[] = [];
	let score = 0;

	const ua = request.headers.get('user-agent') || '';
	const cf = (request as any).cf || {};

	// Good bots bypass everything.
	if (ua && CONFIG.goodBotUA.test(ua)) {
		return { action: 'allow', score: 0, reasons: ['good-bot'] };
	}

	// Empty or trivially short UA.
	if (!ua || ua.length < 10) {
		score += 100;
		reasons.push('empty-or-tiny-ua');
	}

	// Known automation tools.
	if (ua && CONFIG.badBotUA.test(ua)) {
		score += 100;
		reasons.push('tool-ua');
	}

	// Browsers send Accept and Accept-Language on document navigations.
	const accept = request.headers.get('accept') || '';
	const acceptLang = request.headers.get('accept-language');
	const dest = request.headers.get('sec-fetch-dest');
	const isDocNav = dest === 'document' || accept.includes('text/html');
	if (isDocNav) {
		if (!acceptLang) {
			score += 30;
			reasons.push('no-accept-language');
		}
		if (!accept) {
			score += 25;
			reasons.push('no-accept');
		}
	}

	// Modern browsers negotiate HTTP/2 or /3 and TLS >= 1.2.
	const proto = String(cf.httpProtocol || '');
	if (proto === 'HTTP/1.0' || proto === 'HTTP/1.1') {
		score += 10;
		reasons.push('legacy-http');
	}
	const tls = String(cf.tlsVersion || '');
	if (tls && /TLSv1(\.[01])?$/.test(tls)) {
		score += 40;
		reasons.push('old-tls');
	}

	// Datacenter origin.
	const asn = Number(cf.asn) || 0;
	const org = String(cf.asOrganization || '');
	if (CONFIG.datacenterASNs.has(asn) || (org && CONFIG.datacenterOrgHint.test(org))) {
		score += 40;
		reasons.push('datacenter-asn');
	}

	const action: Action = score >= CONFIG.blockAt ? 'block' : score >= CONFIG.challengeAt ? 'challenge' : 'allow';
	return { action, score, reasons };
}

// ─────────────────────────────────────────────────────────────────────────────
// Challenge cookie (signed, JS-set). Bots that don't run JS never get it.
// A headless browser WILL pass this - upgrade the challenge to Cloudflare
// Turnstile (free) if you need to stop headless automation. See README.
// ─────────────────────────────────────────────────────────────────────────────

const PASS_COOKIE = 'bs_pass';
const enc = new TextEncoder();

async function hmac(secret: string, data: string): Promise<string> {
	const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
		'sign',
	]);
	const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
	return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/[+/=]/g, (c) => ({ '+': '-', '/': '_', '=': '' }[c]!));
}

async function issuePass(secret: string): Promise<string> {
	const exp = String(Math.floor(Date.now() / 1000) + CONFIG.passTtlSeconds);
	return `${exp}.${await hmac(secret, exp)}`;
}

async function validPass(secret: string, token: string | null): Promise<boolean> {
	if (!token) return false;
	const [exp, sig] = token.split('.');
	if (!exp || !sig) return false;
	if (Number(exp) < Math.floor(Date.now() / 1000)) return false;
	return (await hmac(secret, exp)) === sig;
}

function getCookie(request: Request, name: string): string | null {
	const header = request.headers.get('cookie');
	if (!header) return null;
	for (const part of header.split(';')) {
		const [k, ...v] = part.trim().split('=');
		if (k === name) return v.join('=');
	}
	return null;
}

function blockResponse(): Response {
	return new Response('Access denied.', {
		status: 403,
		headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
	});
}

async function challengeResponse(secret: string): Promise<Response> {
	const token = await issuePass(secret);
	// Minimal interstitial: sets the signed cookie via JS, then reloads.
	const html = `<!doctype html><meta charset="utf-8"><title>Checking your browser</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<body style="background:#0A0A0C;color:#E2E2E9;font-family:system-ui,sans-serif;display:grid;place-items:center;height:100vh;margin:0">
<div style="text-align:center"><div style="font-size:14px;letter-spacing:2px;text-transform:uppercase;color:#D4AF37">Verifying your connection</div>
<div style="margin-top:12px;font-size:13px;color:#8A8A9E">One moment...</div></div>
<script>
document.cookie=${JSON.stringify(`${PASS_COOKIE}=`)}+${JSON.stringify(token)}+";path=/;max-age=${CONFIG.passTtlSeconds};samesite=Lax";
location.reload();
</script></body>`;
	return new Response(html, {
		status: 503,
		headers: {
			'content-type': 'text/html; charset=utf-8',
			'cache-control': 'no-store',
			'retry-after': '2',
		},
	});
}

// ─────────────────────────────────────────────────────────────────────────────
// Optional Durable Object rate limiter (fixed 60s window per IP).
// ─────────────────────────────────────────────────────────────────────────────

export class RateLimiter {
	state: DurableObjectState;
	constructor(state: DurableObjectState) {
		this.state = state;
	}
	async fetch(request: Request): Promise<Response> {
		const limit = Number(new URL(request.url).searchParams.get('limit')) || 120;
		const now = Date.now();
		const windowStart = (await this.state.storage.get<number>('ws')) || 0;
		let count = (await this.state.storage.get<number>('c')) || 0;
		if (now - windowStart > 60_000) {
			await this.state.storage.put('ws', now);
			count = 0;
		}
		count++;
		await this.state.storage.put('c', count);
		return new Response(null, { status: count > limit ? 429 : 204 });
	}
}

async function overRateLimit(env: Env, ip: string): Promise<boolean> {
	if (!env.RATE_LIMITER || !ip) return false;
	const rpm = env.BOT_SQUASH_RPM || '120';
	const id = env.RATE_LIMITER.idFromName(ip);
	const res = await env.RATE_LIMITER.get(id).fetch(`https://rl/?limit=${rpm}`);
	return res.status === 429;
}

// ─────────────────────────────────────────────────────────────────────────────
// Standalone Worker entrypoint.
// ─────────────────────────────────────────────────────────────────────────────

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		// Never guard bypass paths.
		if (CONFIG.bypassPaths.test(url.pathname)) return fetch(request);

		// Already-verified browsers skip scoring.
		if (await validPass(env.BOT_SQUASH_SECRET, getCookie(request, PASS_COOKIE))) {
			return fetch(request);
		}

		const verdict = evaluate(request);

		// Rate limit pushes borderline traffic over the edge.
		const ip = request.headers.get('cf-connecting-ip') || '';
		if (verdict.action !== 'block' && (await overRateLimit(env, ip))) {
			verdict.action = 'block';
			verdict.reasons.push('rate-limit');
		}

		// Surface the decision for debugging/log analysis.
		const debug = { 'x-bs-action': verdict.action, 'x-bs-score': String(verdict.score) };

		if (verdict.action === 'block') return withHeaders(blockResponse(), debug);
		if (verdict.action === 'challenge') return withHeaders(await challengeResponse(env.BOT_SQUASH_SECRET), debug);

		// Allowed - proxy to origin.
		return fetch(request);
	},
};

function withHeaders(res: Response, headers: Record<string, string>): Response {
	const r = new Response(res.body, res);
	for (const [k, v] of Object.entries(headers)) r.headers.set(k, v);
	return r;
}
