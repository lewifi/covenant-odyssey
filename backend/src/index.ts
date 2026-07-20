import { stripMoodTags, buildStylePrompt } from "./moodTags";
import { beatContext } from "./skeleton";
import lamejs from "@breezystack/lamejs";

export interface Env {
	GEMINI_STORY_API_KEY: string;
	GEMINI_TTS_API_KEY: string;
	GEMINI_IMAGE_API_KEY: string;
	OPENAI_API_KEY?: string;
	ASSETS: Fetcher;
	DB: D1Database;
}

const SYSTEM_PROMPT = `
You are the narrator and game master for Covenant Odyssey - Divergent Prophecies, an adult-oriented biblical interactive branching narrative.
You tell the stories of the Bible with raw humanity, capturing themes of faith, doubt, duty, war, betrayal, passion, and redemption.
The current player is Eliab, the eldest brother of David, in the starting "Kingdoms & Prophets" story arc.

Based on the player's history of decisions and their alignment scores (Righteous, Pragmatic, and Rebel), generate the next scene.
You must output a JSON object containing:
1. "sceneTitle": A short, dramatic title for the scene.
2. "sceneText": The narrative text describing the outcome of the player's last choice and setting up the next situation. Limit this to 2-3 paragraphs. Do not use em dashes (use a standard hyphen-dash or comma instead). Each sentence that begins a new emotional beat should be prefixed with a mood tag in square brackets.
3. "choices": An array of exactly 3 choices. Each choice must have:
   - "id": A unique string slug (e.g. 'counsel_patience').
   - "text": A description of the action. Maximum 12 words. No em dashes. Short, punchy, decisive - written as a first-person action or brief direct quote.
   - "alignmentEffect": An object showing how much the choice modifies the alignments (e.g. {"righteous": 5} or {"pragmatic": 5} or {"rebel": 5}). Each choice must primary map to one alignment metric:
     - Righteous: Reflects absolute faith, adherence to the covenant, or selfless sacrifice.
     - Pragmatic: Reflects compromise, safety, politics, strategy, or tribal security.
     - Rebel: Reflects defiance, direct confrontation, passion, raw self-interest, or challenging the establishment.

TTS MOOD TAGS: Prefix sentences in sceneText with a mood tag when the emotional register shifts. Tags are stripped from displayed text and used only for TTS delivery. Derive tags organically from what is happening in the scene. Lean on the preferred palette but use extended tags when the scene genuinely calls for it.

Preferred: [aggression], [tension], [agitation], [determination]
Extended (use when scene demands it): [grief], [reverence], [seduction], [despair], [elation], [menace], [confusion]

Not every sentence needs a tag. Tag only when the emotional register meaningfully shifts.
`;


const RESPONSE_SCHEMA = {
	type: "OBJECT",
	properties: {
		sceneTitle: { type: "STRING" },
		sceneText: { type: "STRING" },
		choices: {
			type: "ARRAY",
			items: {
				type: "OBJECT",
				properties: {
					id: { type: "STRING" },
					text: { type: "STRING" },
					alignmentEffect: {
						type: "OBJECT",
						properties: {
							righteous: { type: "INTEGER" },
							pragmatic: { type: "INTEGER" },
							rebel: { type: "INTEGER" }
						}
					}
				},
				required: ["id", "text", "alignmentEffect"]
			}
		}
	},
	required: ["sceneTitle", "sceneText", "choices"]
};

// Story model + relaxed safety so mature (non-explicit) biblical drama is not
// filtered. gemini-2.5-flash is retired for new accounts; 3.1-flash-lite is proven
// to deliver prestige-maturity content cleanly (STOP, no safety flags).
const STORY_MODEL = "gemini-3.1-flash-lite";
const SAFETY_SETTINGS = [
	{ category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
	{ category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
	{ category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
	{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
];

// ─── TTS (Gemini) ───
// Voice + model per ARCHITECTURE.md. Disabled on the client by default during
// dev to preserve tokens; this endpoint only runs when explicitly called.
// gemini-2.5-*-tts is retired for new accounts; 3.1 is current. Fallback kept
// for reference - 2.5 has a separate rate cap if 3.1 is ever unavailable.
const TTS_MODEL = "gemini-3.1-flash-tts-preview";
const TTS_MODEL_FALLBACK = "gemini-2.5-flash-preview-tts";
const TTS_VOICE = "Zubenelgenubi";

/** Decode a base64 string to raw bytes (atob is available in Workers). */
function base64ToBytes(b64: string): Uint8Array {
	const bin = atob(b64);
	const bytes = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
	return bytes;
}

/**
 * Wrap raw PCM (signed 16-bit little-endian) in a minimal WAV container so the
 * browser <audio> element / expo-av can play it directly. Gemini TTS returns
 * headerless PCM, typically mono 24kHz.
 */
function pcmToWav(pcm: Uint8Array, sampleRate = 24000, channels = 1, bitsPerSample = 16): Uint8Array {
	const blockAlign = (channels * bitsPerSample) / 8;
	const byteRate = sampleRate * blockAlign;
	const dataSize = pcm.length;
	const buffer = new ArrayBuffer(44 + dataSize);
	const view = new DataView(buffer);
	const writeStr = (off: number, s: string) => {
		for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
	};
	writeStr(0, "RIFF");
	view.setUint32(4, 36 + dataSize, true);
	writeStr(8, "WAVE");
	writeStr(12, "fmt ");
	view.setUint32(16, 16, true); // PCM chunk size
	view.setUint16(20, 1, true); // audio format = PCM
	view.setUint16(22, channels, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, byteRate, true);
	view.setUint16(32, blockAlign, true);
	view.setUint16(34, bitsPerSample, true);
	writeStr(36, "data");
	view.setUint32(40, dataSize, true);
	new Uint8Array(buffer, 44).set(pcm);
	return new Uint8Array(buffer);
}

/**
 * Convert raw PCM (signed 16-bit little-endian) to MP3 using lamejs.
 * Gemini TTS returns headerless PCM, typically mono 24kHz.
 */
function pcmToMp3(pcm: Uint8Array, sampleRate = 24000, bitrate = 64): Uint8Array {
	const samples = new Int16Array(pcm.buffer, pcm.byteOffset, pcm.byteLength / 2);
	const encoder = new lamejs.Mp3Encoder(1, sampleRate, bitrate);
	const mp3Chunks: Uint8Array[] = [];
	const chunkSize = 1152;

	for (let i = 0; i < samples.length; i += chunkSize) {
		const chunk = samples.subarray(i, i + chunkSize);
		const mp3buf = encoder.encodeBuffer(chunk);
		if (mp3buf.length > 0) {
			mp3Chunks.push(new Uint8Array(mp3buf));
		}
	}

	const mp3buf = encoder.flush();
	if (mp3buf.length > 0) {
		mp3Chunks.push(new Uint8Array(mp3buf));
	}

	const totalLength = mp3Chunks.reduce((acc, c) => acc + c.length, 0);
	const result = new Uint8Array(totalLength);
	let offset = 0;
	for (const chunk of mp3Chunks) {
		result.set(chunk, offset);
		offset += chunk.length;
	}
	return result;
}

// Helper for CORS headers
function corsHeaders(origin: string | null) {
	return {
		"Access-Control-Allow-Origin": origin || "*",
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
		"Access-Control-Max-Age": "86400",
	};
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const origin = request.headers.get("Origin");

		// Handle CORS preflight
		if (request.method === "OPTIONS") {
			return new Response(null, {
				headers: corsHeaders(origin),
			});
		}

		const url = new URL(request.url);

		if (url.pathname === "/api/generate-scene" && request.method === "POST") {
			try {
				const body = await request.json() as {
					history: string[];
					righteous: number;
					pragmatic: number;
					rebel: number;
					sceneId: string;
				};

				const userPrompt = `
Current state:
- Scene ID: ${body.sceneId}
- Choices made so far (History): ${body.history.join(", ") || "None (Start)"}
- Righteous Score: ${body.righteous}
- Pragmatic Score: ${body.pragmatic}
- Rebel Score: ${body.rebel}

Please generate the next scene continuing the narrative from the last action in history.
`;

				// Skeleton injection: pin the current beat, its anchor event, canon,
				// and (on the finale) the alignment-keyed ending. The LLM varies the
				// road; the skeleton owns the destination.
				const beat = beatContext(
					parseInt(body.sceneId, 10) || 1,
					body.righteous || 0,
					body.pragmatic || 0,
					body.rebel || 0
				);
				const fullPrompt = `${userPrompt}\n${beat.promptBlock}`;

				// Try Gemini Story Key first
				try {
					const geminiResponse = await fetch(
						`https://generativelanguage.googleapis.com/v1beta/models/${STORY_MODEL}:generateContent?key=${env.GEMINI_STORY_API_KEY}`,
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json"
							},
							body: JSON.stringify({
								contents: [
									{
										role: "user",
										parts: [{ text: `${SYSTEM_PROMPT}\n\n${fullPrompt}` }]
									}
								],
								safetySettings: SAFETY_SETTINGS,
								generationConfig: {
									responseMimeType: "application/json",
									responseSchema: RESPONSE_SCHEMA
								}
							})
						}
					);

					if (!geminiResponse.ok) {
						throw new Error(`Gemini API returned status ${geminiResponse.status}: ${await geminiResponse.text()}`);
					}

					const data = await geminiResponse.json() as any;
					const contentText = data.candidates?.[0]?.content?.parts?.[0]?.text;

					if (!contentText) {
						throw new Error("Empty content returned from Gemini");
					}

					// Parse, then enrich with the skeleton's anchor art + beat metadata.
					const scene = JSON.parse(contentText);
					scene.sceneImage = beat.sceneImage;
					scene.beatId = beat.beatId;
					scene.beatTitle = beat.beatTitle;

					return new Response(JSON.stringify(scene), {
						headers: {
							"Content-Type": "application/json",
							...corsHeaders(origin)
						}
					});
				} catch (geminiError) {
					console.error("Gemini failed, trying OpenAI fallback:", geminiError);

					if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY === "your_openai_api_key_here") {
						throw new Error(`Gemini failed and no OpenAI fallback key is configured. Original error: ${geminiError}`);
					}

					// OpenAI Fallback Route
					const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"Authorization": `Bearer ${env.OPENAI_API_KEY}`
						},
						body: JSON.stringify({
							model: "gpt-4o-mini",
							messages: [
								{ role: "system", content: SYSTEM_PROMPT },
								{ role: "user", content: fullPrompt }
							],
							response_format: {
								type: "json_object"
							}
						})
					});

					if (!openaiResponse.ok) {
						throw new Error(`OpenAI API fallback also failed: ${await openaiResponse.text()}`);
					}

					const data = await openaiResponse.json() as any;
					const contentText = data.choices?.[0]?.message?.content;

					if (!contentText) {
						throw new Error("Empty content returned from OpenAI");
					}

					// Parse, then enrich with the skeleton's anchor art + beat metadata.
					const fallbackScene = JSON.parse(contentText);
					fallbackScene.sceneImage = beat.sceneImage;
					fallbackScene.beatId = beat.beatId;
					fallbackScene.beatTitle = beat.beatTitle;

					return new Response(JSON.stringify(fallbackScene), {
						headers: {
							"Content-Type": "application/json",
							...corsHeaders(origin)
						}
					});
				}

			} catch (error: any) {
				return new Response(
					JSON.stringify({ error: error.message || "An unexpected error occurred" }),
					{
						status: 500,
						headers: {
							"Content-Type": "application/json",
							...corsHeaders(origin)
						}
					}
				);
			}
		}

		if (url.pathname === "/api/tts" && request.method === "POST") {
			try {
				const body = await request.json() as { text?: string };
				if (!body.text || !body.text.trim()) {
					return new Response(JSON.stringify({ error: "Missing 'text' in request body" }), {
						status: 400,
						headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
					});
				}

				// Mood tags drive delivery style but must not be spoken aloud.
				const spoken = stripMoodTags(body.text);
				const stylePrompt = buildStylePrompt(body.text);
				const ttsPrompt = `${stylePrompt}\n\nNarrate exactly the following text. Do not read any bracketed tags or stage directions aloud:\n\n${spoken}`;

				const ttsBody = JSON.stringify({
					contents: [{ parts: [{ text: ttsPrompt }] }],
					generationConfig: {
						responseModalities: ["AUDIO"],
						speechConfig: {
							voiceConfig: {
								prebuiltVoiceConfig: { voiceName: TTS_VOICE },
							},
						},
					},
				});

				let ttsResponse: Response | null = null;
				let lastErr = "";
				for (const model of [TTS_MODEL, TTS_MODEL_FALLBACK]) {
					console.log(`[TTS] Trying model: ${model}`);
					const r = await fetch(
						`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_TTS_API_KEY}`,
						{ method: "POST", headers: { "Content-Type": "application/json" }, body: ttsBody }
					);
					if (r.ok) {
						console.log(`[TTS] Success with model: ${model}`);
						ttsResponse = r;
						break;
					}
					const errText = await r.text();
					console.error(`[TTS] Failed for model ${model}: status ${r.status}, response: ${errText}`);
					lastErr = `${model} -> ${r.status} ${errText}`;
				}
				if (!ttsResponse) {
					throw new Error(`Gemini TTS failed on all models: ${lastErr}`);
				}

				const data = await ttsResponse.json() as any;
				const part = data.candidates?.[0]?.content?.parts?.[0];
				const audioB64 = part?.inlineData?.data;
				if (!audioB64) {
					throw new Error("No audio returned from Gemini TTS");
				}

				// Gemini returns headerless PCM; sample rate is carried in the mimeType (e.g. audio/L16;rate=24000).
				const mime: string = part?.inlineData?.mimeType || "";
				const rateMatch = mime.match(/rate=(\d+)/);
				const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;

				const mp3 = pcmToMp3(base64ToBytes(audioB64), sampleRate, 64);

				return new Response(mp3, {
					headers: {
						"Content-Type": "audio/mpeg",
						"Cache-Control": "no-store",
						...corsHeaders(origin),
					},
				});
			} catch (error: any) {
				return new Response(
					JSON.stringify({ error: error.message || "Failed to synthesize speech" }),
					{
						status: 500,
						headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
					}
				);
			}
		}

		if (url.pathname === "/api/save" && request.method === "POST") {
			try {
				const body = await request.json() as {
					userId: string;
					sceneId: string;
					history: string[];
					righteous: number;
					pragmatic: number;
					rebel: number;
				};

				await env.DB.prepare(
					"INSERT OR REPLACE INTO saves (user_id, scene_id, history, righteous_score, pragmatic_score, rebel_score, last_updated) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)"
				)
				.bind(body.userId, body.sceneId, JSON.stringify(body.history), body.righteous, body.pragmatic, body.rebel)
				.run();

				return new Response(JSON.stringify({ success: true }), {
					headers: {
						"Content-Type": "application/json",
						...corsHeaders(origin)
					}
				});
			} catch (error: any) {
				return new Response(
					JSON.stringify({ error: error.message || "Failed to save progress" }),
					{
						status: 500,
						headers: {
							"Content-Type": "application/json",
							...corsHeaders(origin)
						}
					}
				);
			}
		}

		if (url.pathname === "/api/load" && request.method === "GET") {
			try {
				const userId = url.searchParams.get("userId");
				if (!userId) {
					return new Response(JSON.stringify({ error: "Missing userId parameter" }), {
						status: 400,
						headers: {
							"Content-Type": "application/json",
							...corsHeaders(origin)
						}
					});
				}

				const saveState = await env.DB.prepare(
					"SELECT * FROM saves WHERE user_id = ?"
				)
				.bind(userId)
				.first();

				if (!saveState) {
					return new Response(JSON.stringify({ error: "No save state found for this user" }), {
						status: 404,
						headers: {
							"Content-Type": "application/json",
							...corsHeaders(origin)
						}
					});
				}

				return new Response(
					JSON.stringify({
						userId: saveState.user_id,
						sceneId: saveState.scene_id,
						history: JSON.parse(saveState.history as string),
						righteous: saveState.righteous_score,
						pragmatic: saveState.pragmatic_score,
						rebel: saveState.rebel_score,
						lastUpdated: saveState.last_updated
					}),
					{
						headers: {
							"Content-Type": "application/json",
							...corsHeaders(origin)
						}
					}
				);
			} catch (error: any) {
				return new Response(
					JSON.stringify({ error: error.message || "Failed to load progress" }),
					{
						status: 500,
						headers: {
							"Content-Type": "application/json",
							...corsHeaders(origin)
						}
					}
				);
			}
		}

		// Fallback to static assets handler
		return env.ASSETS.fetch(request);
	},
};
