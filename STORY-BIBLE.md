# Covenant Odyssey - Story Bible (Chapters Plan)

## Franchise thesis: The Unchosen

Every Covenant Odyssey protagonist is someone scripture passed over. Eliab is the
prototype: the eldest, the obvious one, standing in the lineup while the oil goes
to his little brother. Future arc packs keep the signature: the Bible told from
the shadows of its heroes.

- Kingdoms & Prophets -> **Eliab** (passed over for David)
- Genesis Cycle -> candidate POV: **Esau** (passed over for Jacob)
- Exodus & Conquest -> candidate POV: **Aaron or Miriam** (in Moses' shadow)
- Exile & Return / Fulfillment -> POVs TBD, same rule: the unchosen witness

## Kingdoms & Prophets - a trilogy (Eliab POV throughout)

### Chapter 1: The Story of Eliab (SHIPPED)
Anointing -> Goliath. 10 beats, endings: Brother's Keeper / King's Man /
Unbowed / Wanderer. See `backend/src/skeleton.ts`.

### Chapter 2: The Hunted
**Span:** Saul's spear-throws at David -> the cave of Adullam -> sparing Saul at En-gedi.

**The load-bearing verse - 1 Samuel 22:1:** when David flees to Adullam, "his
brethren and all his father's house went down thither to him." Eliab CANONICALLY
returns to David's side. This is the chapter's central convergence anchor: all
four Ch1 endings are four different roads into the same cave.

- Brother's Keeper arrives as protector (kept his vow)
- King's Man arrives compromised - he served the hunter, now flees him
- Unbowed arrives last and proudest, dragged by family, not faith
- Wanderer stumbles in, still unresolved

**Draft beat spine (10 beats, ~20 scenes):**
1. Aftermath of the songs - Saul's jealousy becomes policy (entry flavored by carried ending)
2. The spear in the wall - David flees the court; Michal's deception
3. The house of Jesse under suspicion - Saul's eye turns on Bethlehem
4. Jonathan's covenant - word reaches Eliab of the prince's choice
5. **Nob** - the massacre of the priests (the chapter's darkest beat; Doeg)
6. **Adullam** - ANCHOR: the house of Jesse goes down to the cave (the reunion)
7. Captain of the discontented - David's 400; Eliab's place in his brother's army
8. Keilah / betrayals - the hunted life; Saul closes in
9. **En-gedi** - ANCHOR: David spares Saul in the cave, cuts the robe
10. The reckoning of mercy - Eliab commits: what does HE do with a king spared?

**Endings keyed to alignment (what Eliab does with mercy):**
- Righteous: **The Sworn Shield** - fully David's man, keeper of the covenant of mercy
- Pragmatic: **The Quartermaster** - runs the outlaw camp's survival; loyalty as logistics
- Rebel: **The Knife in the Dark** - argued for killing Saul in the cave; overruled, unrepentant
- Balanced: **The Divided House** - torn between the cave and Bethlehem, serving both badly

**Canon pins:** David never harms Saul; Jonathan's covenant stands; the priests of
Nob die (Abiathar escapes); Eliab cannot die; the family reaches Adullam.

### Chapter 3: The Broken Crown
**Span:** Abigail -> Ziklag -> the witch of Endor -> Gilboa -> David crowned at Hebron.

**Draft beat spine:**
1. The wilderness years bite - entry flavored by Ch2 ending
2. Abigail and Nabal - wisdom disarms a massacre
3. Exile among enemies - Ziklag, serving Achish, the double life
4. The Amalekite raid - Ziklag burns; families taken; near-mutiny
5. Pursuit and recovery - "David encouraged himself in the LORD"
6. **Endor** - ANCHOR: Saul consults the witch; Samuel's ghost pronounces doom
7. The eve of Gilboa - two armies; Eliab sees both sides of the field
8. **Gilboa** - ANCHOR: Saul and Jonathan fall; the crown is broken
9. The lament - "how are the mighty fallen"; the Amalekite messenger's fate
10. **Hebron** - ANCHOR: David crowned king of Judah; Eliab's final allegiance

**Endings keyed to alignment (who Eliab kneels to):**
- Righteous: **The Elder at the Coronation** - first of the house to kneel; the wound healed
- Pragmatic: **The King's Steward** - power beside the throne he once wanted
- Rebel: **The Empty Chair** - absent from Hebron by choice; free and outside history
- Balanced: **The Witness** - present, silent, unresolved to the last

**Canon pins:** Saul and Jonathan die at Gilboa; David does not fight against
Israel; David is crowned at Hebron; Eliab survives.

## Chapter-chaining mechanics

- Carried state: `{ endingId, righteous, pragmatic, rebel }` from the previous
  chapter, persisted in the save and passed to generation.
- Beats 1-2 of each chapter are FLAVORED by the carried ending (the prompt block
  gains an `ENTRY STATE` line); the convergence machinery then takes over as usual.
- Alignment scores continue accumulating across chapters (archetype thresholds
  keep working on the running totals).
- **Go Wild sandbox between chapters** (the sea between islands), seeded from the
  carried state; buying the next chapter re-canonizes.
- Monetization: Chapter 1 + its sandbox fully free; Chapter 2 onward paid
  ($1.99-3.99 per chapter or bundle). The chapter-transition screen (ending card
  -> next-chapter tease) is the paywall's one true home.

## Production recipe per chapter (repeatable)

1. Pick the span + write the 10-beat spine (goals, anchors, canon pins, 4 endings)
2. Author `backend/src/chapters/chN.ts` (same shape as ch1 skeleton)
3. Generate ~19-20 background frames - prompt ONLY "action on the right" (see
   Art Composition Rules), 1920px, JPG q85, [build-up, anchor] pair per beat +
   4 ending frames
4. Reuse the mood-tag audio palette (loops are chapter-agnostic)
5. Playtest the two hostile paths: full-rebel through every anchor, full-righteous
   through every anchor - anchors must land regardless

## Tech prerequisites before Chapter 2 (small)

- [ ] Chapter registry: refactor `skeleton.ts` -> `chapters/` with `{ chapterId }`
      routing; request/save gain `chapterId`
- [ ] Carry `endingId` into save state + the generation prompt (ENTRY STATE line)
- [ ] Chapter-transition screen (ending card, alignment summary, next-chapter tease,
      paywall hook)
- [ ] D1 migration: `chapter_id`, `ending_id` columns on saves
- [ ] Per-IP rate limit (already in TASKS - required before any paid chapter ships)
