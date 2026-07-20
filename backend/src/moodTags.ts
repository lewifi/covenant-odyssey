/**
 * Mood-tag pipeline shared by text generation and TTS.
 *
 * Scene text from /api/generate-scene embeds inline mood tags like `[tension]`
 * at the start of sentences (see ARCHITECTURE.md "Mood Tag System"). These tags:
 *   - MUST be stripped before the text is displayed to the player, and
 *   - drive the TTS delivery style (they are NOT read aloud).
 */

// Delivery instructions per the ARCHITECTURE.md TTS mood-tag table.
export const MOOD_DELIVERY: Record<string, string> = {
	// Preferred palette (Kingdoms & Prophets)
	aggression: "forceful and clipped, opening hard",
	tension: "slower and breathier, building dread",
	agitation: "unsettled and slightly rushed",
	determination: "firm, measured, and inevitable",
	// Extended palette
	grief: "heavy and slowed, carrying the weight of loss",
	reverence: "hushed and awed, as before something sacred",
	seduction: "low and drawn out, warmth beneath danger",
	despair: "flat and hollow, all hope gone",
	elation: "lifted and bright, touched by victory or divine favour",
	menace: "cold and deliberate, threat beneath calm",
	confusion: "fragmented, with uncertain pacing",
};

const TAG_RE = /\[([a-z]+)\]/gi;

/** Remove all `[mood]` tags and collapse the whitespace they leave behind. */
export function stripMoodTags(text: string): string {
	return text
		.replace(TAG_RE, "")
		.replace(/[ \t]{2,}/g, " ")
		.replace(/ +\n/g, "\n")
		.trim();
}

/** Return the ordered list of mood tags found in the text (lowercased). */
export function extractMoodTags(text: string): string[] {
	const tags: string[] = [];
	const re = new RegExp(TAG_RE);
	let m: RegExpExecArray | null;
	while ((m = re.exec(text)) !== null) {
		tags.push(m[1].toLowerCase());
	}
	return tags;
}

// Base voice profile: Zubenelgenubi - a stern and weary gatekeeper (ARCHITECTURE.md).
const BASE_PROFILE =
	"You are a stern and weary gatekeeper narrating a dark biblical epic. " +
	"Baseline tone is tense and cautious, measured and deliberate, carrying the weight of covenant consequences.";

/**
 * Build a natural-language style instruction for the TTS model from the mood
 * tags present in the scene. Gemini TTS does not parse inline `[tags]`, so we
 * translate them into a spoken-style prompt using MOOD_DELIVERY.
 */
export function buildStylePrompt(text: string): string {
	const unique = [...new Set(extractMoodTags(text))].filter((t) => MOOD_DELIVERY[t]);
	if (unique.length === 0) return BASE_PROFILE;
	const deliveries = unique.map((t) => MOOD_DELIVERY[t]).join("; then shift to ");
	return `${BASE_PROFILE} As the scene moves, deliver it ${deliveries}.`;
}
