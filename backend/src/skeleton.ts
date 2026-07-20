/**
 * Chapter 1 story skeleton - "Kingdoms & Prophets: The Story of Eliab".
 *
 * Convergent branching ("string of pearls", see ARCHITECTURE.md): fixed anchor
 * beats with predetermined outcomes, connected by LLM-generated scenes that fan
 * out and funnel back. The LLM varies prose, tone and choice texture; this file
 * pins the beat sequence, the canon events, and the alignment-keyed endings -
 * so every playthrough diverges in feel but reaches the same conclusions.
 *
 * Each beat maps to a pre-drawn background in /public/scenes (cached anchor
 * art - zero image-generation cost, per the Islands & Sea cost model).
 */

export interface Beat {
	id: string;
	title: string;
	/** First and last sceneId (1-based, inclusive) this beat covers. */
	scenes: [number, number];
	/** Dramatic function - what this stretch of story is FOR. */
	goal: string;
	/** The fixed event that MUST have occurred by the final scene of the beat. */
	anchor: string;
	/** Background asset per scene of the beat [build-up scene, anchor scene]. */
	images: [string, string];
}

export const CHAPTER_END = 20; // final authored scene; beyond this is epilogue / Go Wild

export const BEATS: Beat[] = [
	{
		id: "fields",
		title: "The Fields of Jesse",
		scenes: [1, 2],
		goal: "Establish Eliab's ordinary world: eldest son of Jesse in Bethlehem, proud, capable, certain he is the future of the house. Sheep, harvest, brothers, the weight of primogeniture.",
		anchor: "Word reaches the family that the prophet Samuel is approaching Bethlehem, and the town is afraid.",
		images: ["ch1-jesse-fields.jpg", "ch1-jesse-fields.jpg"],
	},
	{
		id: "prophet-comes",
		title: "The Prophet Comes",
		scenes: [3, 4],
		goal: "Dread and awe as Samuel arrives. The elders tremble; a sacrifice is called. Eliab senses this visit concerns the house of Jesse and lets himself hope it concerns HIM.",
		anchor: "Jesse's sons are summoned to stand before Samuel at the sacrifice.",
		images: ["ch1-samuel-approaches.jpg", "ch1-samuel-arrives.jpg"],
	},
	{
		id: "lineup",
		title: "The Lineup",
		scenes: [5, 6],
		goal: "The anointing. Samuel sees Eliab first and is moved - then hears the LORD: 'Look not on his countenance, nor the height of his stature.' Each brother is passed over. The youngest is fetched from the sheep.",
		anchor: "David is anointed by Samuel before his brothers. Eliab is passed over. This is Eliab's defining wound.",
		images: ["ch1-covenant-tent.jpg", "ch1-the-lineup.jpg"],
	},
	{
		id: "house-divided",
		title: "A House Divided",
		scenes: [7, 8],
		goal: "The fallout inside the family. Eliab's shame, pride and grief war with each other. David is changed; the household orbit shifts around the youngest. Eliab must decide who he is now that he is not chosen.",
		anchor: "Eliab leaves the house of Jesse to serve in King Saul's army.",
		images: ["ch1-brothers-fire.jpg", "ch1-brothers-fire.jpg"],
	},
	{
		id: "sauls-court",
		title: "The Court of Saul",
		scenes: [9, 10],
		goal: "Saul's darkened court: a king abandoned by God, fits of torment, whispering factions. Eliab navigates ambition and danger - and endures David being sent for, to soothe the king with the harp.",
		anchor: "War with the Philistines is declared and the army marches to the Valley of Elah.",
		images: ["ch1-sauls-court.jpg", "ch1-sauls-court.jpg"],
	},
	{
		id: "war-camp",
		title: "The War Camp",
		scenes: [11, 12],
		goal: "The camp at Elah: two armies on facing ridges, fear in the tents, Eliab among the fighting men at last - somewhere his strength should count.",
		anchor: "Goliath of Gath steps out and issues his challenge of single combat.",
		images: ["ch1-military-camp.jpg", "ch1-goliath-triumphant.jpg"],
	},
	{
		id: "giants-shadow",
		title: "The Giant's Shadow",
		scenes: [13, 14],
		goal: "Forty days of taunts. Israel paralysed, Saul offering riches and a daughter to any champion. Eliab confronts his own fear - the chosen-looking man who does not step forward.",
		anchor: "David arrives at the camp with provisions and hears Goliath's challenge.",
		images: ["ch1-the-negotiation.jpg", "ch1-the-negotiation.jpg"],
	},
	{
		id: "brothers-brink",
		title: "Brothers at the Brink",
		scenes: [15, 16],
		goal: "The rebuke (1 Samuel 17:28): Eliab's anger burns against David - 'Why camest thou down hither? ... I know thy pride, and the naughtiness of thine heart.' The old wound speaks. David answers, 'Is there not a cause?'",
		anchor: "David goes before Saul and is granted leave to face Goliath.",
		images: ["ch1-brothers-quarrel.jpg", "ch1-brothers-quarrel.jpg"],
	},
	{
		id: "valley-decides",
		title: "The Valley Decides",
		scenes: [17, 18],
		goal: "The duel in the valley. Eliab watches his dismissed younger brother walk toward the giant with a sling and five stones. Eliab's stance in this moment - faith, calculation, or fury - is his to choose; the outcome is not.",
		anchor: "Goliath falls to David's sling and the Philistines break and flee.",
		images: ["ch1-valley-of-elah.jpg", "ch1-the-giant-falls.jpg"],
	},
	{
		id: "reckoning",
		title: "The Reckoning",
		scenes: [19, 20],
		goal: "After the giant: the women sing 'Saul has slain his thousands, and David his ten thousands.' Saul's jealousy kindles. Every allegiance in Israel is about to be tested - and Eliab must finally choose where he stands.",
		anchor: "Eliab commits to his path - the chapter resolves into his ending.",
		images: ["ch1-betrayal-unravels.jpg", "ch1-the-reckoning.jpg"],
	},
];

/** Events the LLM may never contradict, in any branch. */
export const CANON_PINS = [
	"David, not Eliab, is anointed by Samuel - this cannot be undone or reversed.",
	"Goliath falls to David's sling; no one else lands the killing blow.",
	"Eliab never becomes king and is never anointed.",
	"Samuel, Saul, David, Jesse and Goliath cannot die in this chapter.",
];

export interface Ending {
	id: string;
	title: string;
	image: string;
	directive: string;
}

export const ENDINGS: Record<string, Ending> = {
	righteous: {
		id: "brothers-keeper",
		title: "The Brother's Keeper",
		image: "ch1-moment-of-faith.jpg",
		directive:
			"Eliab bends his pride to God's choice: he accepts David's anointing as the LORD's will and pledges himself as his brother's shield against the storm he senses coming from Saul. Bittersweet: he surrenders the future he believed was his, and in surrender finds standing.",
	},
	pragmatic: {
		id: "kings-man",
		title: "The King's Man",
		image: "ch1-the-occupation.jpg",
		directive:
			"Eliab chooses survival and station: he binds himself to Saul's court and the machinery of the kingdom as it is, not the kingdom to come. Effective, respected, and quietly hollow - he has chosen the throne that is dying.",
	},
	rebel: {
		id: "unbowed",
		title: "The Unbowed",
		image: "ch1-the-exile.jpg",
		directive:
			"Eliab refuses both prophet and king: unwilling to kneel to a brother or serve a fading throne, he walks out of the story Israel is telling and into his own. Defiant, magnetic, alone - the door slams on his house behind him.",
	},
	wanderer: {
		id: "wanderer",
		title: "The Wanderer",
		image: "ch1-wilderness-night.jpg",
		directive:
			"Eliab cannot choose: faith, ambition and fury pull with equal force, and he walks into the wilderness night unresolved - the most human ending. The chapter closes on the question rather than an answer.",
	},
};

/** Alignment-keyed ending selection, per ARCHITECTURE.md threshold rules. */
export function selectEnding(righteous: number, pragmatic: number, rebel: number): Ending {
	const entries: [string, number][] = [
		["righteous", righteous],
		["pragmatic", pragmatic],
		["rebel", rebel],
	];
	entries.sort((a, b) => b[1] - a[1]);
	const [first, second, third] = entries;
	// Clear dominant: 15+ ahead of both others.
	if (first[1] - second[1] >= 15 && first[1] - third[1] >= 15) return ENDINGS[first[0]];
	// Balanced: no axis leads by more than 10 -> the Wanderer.
	if (first[1] - third[1] <= 10) return ENDINGS.wanderer;
	// Soft dominant: highest wins.
	return ENDINGS[first[0]];
}

export function beatForScene(sceneId: number): Beat | null {
	for (const b of BEATS) {
		if (sceneId >= b.scenes[0] && sceneId <= b.scenes[1]) return b;
	}
	return null; // beyond the chapter: epilogue / Go Wild
}

const IMAGE_BASE = "https://covenantodyssey.lewihirvela.com/scenes/";

export interface BeatContext {
	promptBlock: string;
	beatId: string;
	beatTitle: string;
	sceneImage: string;
}

/**
 * Build the skeleton block injected into the generation prompt for a scene,
 * plus the metadata (anchor art URL, beat title) merged into the response.
 */
export function beatContext(
	sceneId: number,
	righteous: number,
	pragmatic: number,
	rebel: number
): BeatContext {
	const beat = beatForScene(sceneId);

	// Epilogue / Go Wild sandbox: past the authored chapter, generation is free
	// within the canon pins. (Desert backdrop is the eventual wild asset; the
	// wilderness night stands in until it is generated.)
	if (!beat) {
		const ending = selectEnding(righteous, pragmatic, rebel);
		return {
			promptBlock: `
STORY CONTEXT: The authored chapter is complete - Eliab's ending was "${ending.title}". This scene is free-roaming epilogue: continue Eliab's story in that ending's spirit, inventing freely.
CANON (never contradict): ${CANON_PINS.join(" ")}`,
			beatId: "epilogue",
			beatTitle: "Epilogue",
			sceneImage: IMAGE_BASE + "ch1-wilderness-night.jpg",
		};
	}

	const isAnchorScene = sceneId === beat.scenes[1];
	const isFinale = sceneId === CHAPTER_END;
	const next = BEATS[BEATS.indexOf(beat) + 1] || null;

	let block = `
STORY SKELETON - Chapter 1 "Kingdoms & Prophets: The Story of Eliab" (scene ${sceneId} of ${CHAPTER_END}).
CURRENT BEAT: "${beat.title}" - ${beat.goal}
${
	isAnchorScene
		? `REQUIRED ANCHOR EVENT - NON-NEGOTIABLE: the following event HAPPENS ON THE PAGE in this scene's sceneText, depicted explicitly in the narration before the scene ends (not implied, not deferred, regardless of the player's past choices): ${beat.anchor} The player's choices may colour Eliab's REACTION to it, never prevent it. A scene without this event is invalid.`
		: `BUILD TOWARD (do NOT trigger yet - it belongs to the end of this beat): ${beat.anchor}`
}
${next && !isFinale ? `DO NOT reach ahead into the next beat ("${next.title}"). Its events are off-limits this scene.` : ""}
CANON (never contradict, in any branch): ${CANON_PINS.join(" ")}
The player's choices shape HOW Eliab walks this path - his stance, words, loyalties and inner state - never WHETHER the anchor events occur.`;

	if (isFinale) {
		const ending = selectEnding(righteous, pragmatic, rebel);
		block += `
THIS IS THE FINAL SCENE OF THE CHAPTER. Resolve it into this ending, earned by the player's alignment:
ENDING "${ending.title}": ${ending.directive}
The three choices should be closing reflections in the spirit of this ending (not new plot branches).`;
	}

	return {
		promptBlock: block,
		beatId: beat.id,
		beatTitle: beat.title,
		sceneImage:
			IMAGE_BASE +
			(isFinale
				? selectEnding(righteous, pragmatic, rebel).image
				: beat.images[Math.min(sceneId - beat.scenes[0], beat.images.length - 1)]),
	};
}
