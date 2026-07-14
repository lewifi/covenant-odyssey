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
   - "text": A description of the action. No em dashes.
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

				// Try Gemini Story Key first
				try {
					const geminiResponse = await fetch(
						`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_STORY_API_KEY}`,
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json"
							},
							body: JSON.stringify({
								contents: [
									{
										role: "user",
										parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }]
									}
								],
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

					// Verify it parses as valid JSON
					JSON.parse(contentText);

					return new Response(contentText, {
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
								{ role: "user", content: userPrompt }
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

					// Verify it parses
					JSON.parse(contentText);

					return new Response(contentText, {
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
