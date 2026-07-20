# bot-squash

A free-tier bot detection + mitigation Worker for Cloudflare. No Bot Management,
no Zone Pro. One Worker protects every domain on your account.

## Why a Worker (cost)

| Option | Cost | Notes |
|---|---|---|
| Zone Pro | $20/mo **per domain** | What you're avoiding. |
| Bot Management | Enterprise add-on | The real `cf.botManagement` score. Not in Pro either. |
| **Workers Paid** | **$5/mo, account-wide** | Covers ALL domains + unlocks Durable Objects. |

At ~4M req/month you already exceed the Workers **free** 100k/day cap, so Workers
Paid is the right tier regardless - and that one $5 covers every site.

## How it decides

Scores each request from signals available on every plan, then acts:

- **allow** - proxied to origin.
- **challenge** - lightweight signed-cookie JS interstitial (blocks non-JS bots).
- **block** - 403.

Signals: User-Agent (good-bot allowlist for search + social unfurlers, bad-tool
blocklist), missing `Accept` / `Accept-Language` on document navigations, legacy
HTTP / old TLS, and datacenter ASN/org (real users are on residential/mobile
ISPs). Good bots are allow-listed *before* the datacenter check so SEO and OG
previews survive. See `CONFIG` in `src/index.ts` to tune thresholds and lists.

## Deploy

```bash
npm install
npx wrangler secret put BOT_SQUASH_SECRET   # any long random string
# add your domain routes in wrangler.jsonc, then:
npm run deploy
```

Per additional domain, add its `routes` entry (same Worker) and redeploy.

## Two ways to use it

1. **Standalone** (default): on a zone route in front of a site. Allowed traffic
   is proxied to origin via `fetch(request)`.
2. **Middleware**: import into a Worker you already run and branch yourself:

   ```ts
   import { evaluate } from "../bot-squash/src/index";
   const v = evaluate(request);
   if (v.action === "block") return new Response("no", { status: 403 });
   ```

## Rate limiting (optional)

The `RATE_LIMITER` Durable Object does per-IP fixed-window limiting
(`BOT_SQUASH_RPM`, default 120/min). SQLite-backed DO runs on the free plan.
Remove the `durable_objects` / `migrations` blocks from `wrangler.jsonc` to
disable - the core heuristics need zero storage.

## Known limitations (be honest about these)

- **UA is spoofable.** A scraper can claim to be Googlebot to hit the allowlist.
  Full mitigation is PTR/ASN reverse-verification; accepted as residual risk here.
- **The JS-cookie challenge does NOT stop headless browsers** (Puppeteer/
  Playwright run JS and will set the cookie). To stop headless automation,
  upgrade the challenge action to **Cloudflare Turnstile** (free) - swap
  `challengeResponse()` for a Turnstile widget page + `/siteverify` gate.
- Heuristics can false-positive on VPN/corporate-proxy users on datacenter IPs.
  That's why datacenter traffic is *challenged*, not hard-blocked, by default.
