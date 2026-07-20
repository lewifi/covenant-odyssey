# Covenant Odyssey Architecture Document (v1.6)

## Project Overview

Immersive generative interactive branching narrative experience based on covenant narratives. Mature themes included. Short sessions with dynamic branching, save points, and multiple endings.

Platforms: Expo (iOS/Android/Tablet), Web (desktop + mobile).

## Tech Stack

- Frontend: React + Expo + Zustand

- Backend: Cloudflare Workers + D1 + R2

- AI: Google Gemini (primary generation), Claude (architecture & quality oversight)

- Audio: Gemini TTS + Howler.js

- Monetization: AdMob rewarded ads + IAP

## Story Engine

- Hybrid: JSON skeleton + real-time generative scenes

- Modular arcs (Kingdoms & Prophets starting, Genesis, Fulfillment, etc.)

- Alignment tracking and convergence for pacing

### Convergent Branching ("String of Pearls")

Authored chapters are NOT open-ended trees. They are convergent: fixed anchor beats (pearls) with predetermined dramatic function and outcome, connected by LLM-generated scenes (the string) that fan out for a beat then funnel back to the next shared node. A small fixed set of endings is selected at the final node by alignment thresholds.

- **The LLM is free to vary**: prose, tone, mood tags, situation framing, choice wording, which alignment a choice rewards, character-summary flavour.
- **The skeleton pins (must never drift)**: the beat sequence and its key events, the node each branch converges back to, and the alignment-keyed ending set.

This is the mechanism that lets generation "go wild" on texture while the conclusions stay fixed. The current generation prompt does NOT yet inject a skeleton (see [Phase 3 in TASKS.md]); building that skeleton and passing the current beat + required anchor into the prompt is the core Phase 3 task.

## Monetization & Content Model (Islands & Sea)

Covenant Odyssey alternates authored, cinematic chapters (paid) with a free generative sandbox ("Go Wild") between them.

```
Chapter 1 (authored) -> Go Wild (free) -> Chapter 2 (paid) -> Go Wild (free) -> Chapter 3 ...
convergent, cached art/TTS   desert backdrop   convergent...      backdrop
```

- **Authored chapters (islands)**: finite convergent arcs on a JSON skeleton. Unique art and TTS cached in R2. Real endings keyed to alignment. Sold as add-on packs ($1.99 - $3.99) or the Premium bundle.
- **Go Wild sandbox (sea)**: unbounded generative text between chapters. Free, capped, text-driven. Seeded from the player's carried alignment scores and history so it feels personal. Buying the next chapter re-canonizes the player's story from where their sandbox drifted.

### Free / Paid Split
- **Chapter 1 is fully free - all 20 authored scenes AND its Go Wild sandbox.** No mid-chapter gate (the old scene-4 ad gate is removed). The complete first island is the demo: players experience the full production value, then pay for Chapter 2 onward.
- Premium sells craft and production value (authored beats, unique art, TTS narration, real endings), not merely access to more scenes.
- Paywall UI stays wired in the client for the Chapter 2 boundary; it never fires inside Chapter 1.

### Cost Discipline
- Text is cheap and per-scene, so wild branching is affordable. Images and TTS are expensive **per unique scene**, so they are pinned to the finite anchor set only. R2 caching only pays off when scenes recur, which open branching never does.
- Each chapter's Go Wild mode uses a **single generic backdrop image**, generated once and cached. Chapter 1's Go Wild backdrop is **the desert**. No per-scene art generation in wild mode. The lone backdrop also signals "you are in sandbox mode" versus a cinematic authored scene.
- TTS is off by default in wild mode (or reuses spine clips).

### Wild Tier Guardrails
- **Soft cap**: limit free wild scenes per session/day; past the cap, ad gate or premium prompt bounds text-token cost across a viral free audience.
- **Safety pass**: unbounded mature content needs an output safety filter in the prompt that authored beats (author-controlled) do not require.

### Roadmap Dependency
Gameplay/skeleton (Phase 3) must land before TTS (Phase 4) and Image Gen (Phase 5), because the finite anchor-node set is what those expensive layers cache against. Building them before the skeleton would mean caching against nothing.

## Key Flows

- Scene generation via Gemini with strong prompts

- Responsive full-screen image + side text layout

- Save system via D1

## Development Notes

- **Claude & Gemini Roles**: Use Claude for critical code and story coherence. Use Gemini for cost-effective generation in production.
- **API Keys**: API keys are separated between the Story generation engine (`GEMINI_STORY_API_KEY`), the Audio TTS generation engine (`GEMINI_TTS_API_KEY`), and the Image generation engine (`GEMINI_IMAGE_API_KEY`) for granular usage tracking.
- **Roadmap Scope**: Text-to-Speech (TTS) and Image Generation are down-the-track features. Image generation is not required for the first release at all; we will focus on core branching logic and static imagery first.

## Character Archetype System

The player's Righteous / Pragmatic / Rebel scores form a triangular alignment space. Two outputs are derived from this:

1. **Static archetype label** - computed instantly from score ratios, no API call, always visible
2. **Gemini character summary** - richer narrative portrait generated at milestone events

### Hybrid Approach (Option 3)
- Footer stat tooltips always show the static label (instant, zero cost)
- A persistent character card badge in the header shows the current archetype title
- Full Gemini character summary (title + one-line read + flaw warning) is triggered at:
  - Every 5 choices made
  - Chapter transitions
  - Major alignment swings (any axis shifts by 15+ in a single scene)

### Static Archetype Lookup Table

| Dominant alignment | Secondary | Archetype title | Character read |
|---|---|---|---|
| Righteous (clear) | - | The Prophet | Unwavering covenant keeper. Certainty is his strength and his blindness. |
| Pragmatic (clear) | - | The Strategist | Survival above faith. Effective, cold, never fully committed. |
| Rebel (clear) | - | The Zealot of Flesh | Driven by passion and defiance. Magnetic. Destructive. |
| R + P, low E | - | The Covenant Diplomat | Balances divine will with earthly reality. Samuel-like. |
| R + E, low P | - | The Burning Righteous | Zealous faith meets raw passion. Thinks God sanctions his fire. |
| P + E, low R | - | The Warlord | Cunning and appetitive. No divine anchor. Hungers for power. |
| All balanced | - | The Wanderer | Torn between all paths. No clean allegiance. The most human type. |
| All low | - | The Hollow Man | Adrift. Makes no mark. Story will force a crisis. |

**Threshold rules**: "clear dominant" = that axis is 15+ points ahead of both others. "balanced" = no axis leads by more than 10 points.

### Gemini Character Summary Schema
Generated at milestones, passed as part of the scene response:
```json
{
  "archetypeTitle": "The Burning Righteous",
  "archetypeRead": "Faith and passion war in you - God's fire burns, but so does your own desire.",
  "archetypeFlaw": "Your certainty is becoming blindness. You hear what you want from the divine."
}
```
`archetypeFlaw` is optional - only included when a genuine flaw pattern is apparent from choice history.

### D1 Storage
- **Static label**: Not stored. Computed in-memory from `righteous_score`, `pragmatic_score`, `rebel_score` which are already in the saves table.
- **Gemini character summary**: Stored as `character_summary TEXT` (JSON blob) in the saves table. Written only at milestone triggers. Read back on load and displayed immediately without regenerating.

### Display
- **Header**: Small archetype title badge beside the chapter marker (Courier New, gold, uppercase) - updates after each milestone
- **Footer**: Static label visible in alignment stat tooltips (already in place)
- **Character card** (future): Expandable panel triggered from the header badge showing full title, read, and flaw warning with the mark.em shimmer on key phrases


## TTS Voice Model - Kingdoms & Prophets

> **Development note**: TTS and Image Generation are down-the-track features. TTS is disabled during development to preserve API tokens (controlled via the `ttsEnabled` Zustand toggle - when off, all synthesis calls are skipped immediately and persistently). Enable only in production or for deliberate audio testing.

### Model Configuration
- **Gemini TTS speech model**: `Zubenelgenubi`
- **Pitch**: Lower middle
- **Audio profile**: A stern and weary gatekeeper
- **Scene awareness**: Context-aware narration - tone and pacing shift with scene mood
- **Genre context**: Fantasy RPG style

### Narration Style
- **Default pacing**: Measured, deliberate
- **Urgency snap**: Pacing accelerates at dramatic peaks (e.g., divine commands, reveals)
- **Tone baseline**: Tense and cautious - carries the weight of covenant consequences

### Mood Tag System
Scene narration scripts include inline mood tags that shape the TTS delivery. Tags are stripped from display text before rendering.

**Approach**: The AI narrator should derive mood tags organically from scene context - what is happening emotionally and dramatically drives the tag choice. The preferred palette below covers most scenes in the Kingdoms & Prophets arc, but the AI may use others where the scene genuinely calls for it (e.g., `[grief]`, `[reverence]`, `[seduction]`, `[despair]`, `[elation]`). Prefer specificity over falling back to a generic tag.

**Preferred palette for Kingdoms & Prophets:**

| Tag | Delivery instruction |
|-----|---------------------|
| `[aggression]` | Forceful, clipped - opens hard |
| `[tension]` | Slower, breathier - builds dread |
| `[agitation]` | Unsettled, slightly rushed |
| `[determination]` | Firm, measured, inevitable |

**Extended tags (use when scene context demands it):**

| Tag | Delivery instruction |
|-----|---------------------|
| `[grief]` | Heavy, slowed - weight of loss |
| `[reverence]` | Hushed, awed - sacred or divine encounter |
| `[seduction]` | Low, drawn-out - warmth beneath danger |
| `[despair]` | Flat, hollow - all hope gone |
| `[elation]` | Lifted, bright - victory or divine favour |
| `[menace]` | Cold, deliberate - threat beneath calm |
| `[confusion]` | Fragmented, uncertain pacing |

### Reference Script - Scene 1: The Burning Bush
```
[aggression] The golden dawn light cuts through the dust of the wadi.
Your sheep bleat nervously.
[tension] Before you, the bush burns fiercely - tongues of flame wrapping the branches without consuming them.
[agitation] Heat radiates against your skin, carrying the scent of scorched earth and something sacred.
The voice rolls over you like thunder wrapped in mercy, echoing covenants made with flawed men before you.
[determination] "Eliab, son of Jesse. The kingdoms fracture. Blood will stain the throne before the anointed rises. Choose how you will walk this path of fire and flesh."
```

### Integration Points (Phase 3)
- Worker endpoint: `POST /api/tts` - accepts script + mood-tagged text, returns audio stream
- Frontend: HTML5 `Audio` element (web) / `expo-av` (native), triggered after scene text loads
- Mute toggle: `setTtsEnabled(false)` in Zustand immediately halts any pending or queued synthesis calls
- Sentence shimmer sync: TTS word timing data (if available from API) drives the gold shimmer to the currently spoken sentence

## Design Guidelines & Styling Constants (Brutalist Pivot)

- **Visual Theme**: Menacing, unfriendly, and raw brutalist style.
- **Typography & Font Pairings**:
  - **Headings / Logos / Titles / Wordmarks**: `'Playfair Display', serif` - the game wordmark "COVENANT ODYSSEY" in headers, scene titles, and all prominent headings. Heavy, monolithic, classic serif.
  - **Subheadings / Body / Buttons / Badges**: `'Outfit', sans-serif` - stark, clean. Used for choice buttons, paragraph text, nav labels.
  - **Status / Labels / Technical readouts**: `'Courier New', monospace` - for alignment stats, chapter badges, system-level labels only. Never for logos or headings.
  - Subheadings format: Bold, all caps (`text-transform: uppercase`), slightly larger than body.
  - **Typography RegEx Pipeline**: A presentation-layer text replacement filter (`text.replace(/\band\b/gi, '&')`) must be applied exclusively to headings and subheadings (utilizing Playfair Display's custom ampersand ligature). This filter must not run on body text or narrative paragraphs so as not to break TTS processing or paragraph legibility.
- **UI Shape Constraints**:
  - **Zero Rounded Corners**: Absolutely no rounded corners are allowed anywhere (`border-radius: 0;` / `borderRadius: 0` strictly enforced).
  - **Square Elements**: All buttons, alignment cards, and containers must use absolute sharp square/rectangular shapes.
  - **The Stone Tablet Motif**: The stone tablet graphic (`Tablet.png`) is completely removed from the primary game loop to preserve the flat, digital brutalist grid. It is reserved exclusively as a static, full-screen background asset for settings and configuration overlays.
- **Frame, Borders & Colors**:
  - Heavy solid framing: Use thick solid borders (e.g., `2px` or `3px` solid borders) on cards and buttons.
  - Color Palette: Raw charcoal background (`#0A0A0C`), stark white text, dirt/charcoal brown accents (`#4E3F35`), and heavy gold highlights (`#856A1E` / `#D4AF37`) for attention.
  - **No Solid Red**: Red is banned as it looks cheap.
  - **Background Opacity**: Layered background cards, boxes, and buttons may use `75%` opacity (e.g., `rgba(23, 23, 33, 0.75)` or charcoal brown with opacity) to add premium visual depth.
- **Interactive Micro-animations**:
  - **Golden Pulse Hovers**: All interactive choice buttons, selectable options, and key hovered artwork cards must animate with a smooth, pulsing golden glow (`@keyframes goldGlowPulse`) to guide player focus and look highly premium.
- **Icons - No Emojis**:
  - **BANNED**: Emojis are absolutely banned everywhere - UI, code, comments, documentation, prompts, and git commit messages. They render inconsistently across platforms and break the brutalist aesthetic.
  - **Web**: Use **Remix Icons** via CDN (`https://cdn.jsdelivr.net/npm/remixicon@4.3.0/fonts/remixicon.css`) - line style only (`ri-*-line` suffix, never `-fill`).
  - **React Native / Expo**: Use **`@expo/vector-icons`** Ionicons outline variants - `import { Ionicons } from '@expo/vector-icons'`.
  - **Icon Map**: Save=`ri-save-line`, Load=`ri-folder-open-line`, TTS On=`ri-volume-up-line`, TTS Off=`ri-volume-mute-line`, Settings=`ri-settings-3-line`, Chapter=`ri-bookmark-line`, Righteous=`ri-scales-3-line`, Pragmatic=`ri-shield-line`, Rebel=`ri-sword-line`.
- **Prose Punctuation**:
  - **BANNED**: Em dashes (--) are banned from all UI text, story prose, documentation, and code strings. They are a typographic affectation that reads poorly in TTS and looks inconsistent.
  - **Replacements**: Use a standard hyphen-dash ( - ) for asides, or a comma for natural pauses. Reserve the hyphen-dash for genuine breaks only.
  - **Emphasis alternative**: For words or phrases that need visual weight beyond punctuation, wrap them in `<mark class="em">` (web) or a styled `<Text>` component (native). This applies a persistent gold shimmer that remains visible even during the TTS read-along shimmer pass.
  - **Emphasis shimmer spec**: The `.em` class uses a static bright gold-to-white gradient with a slow `4s` sweep. It must not be overridden by the sentence `.current` TTS class. Implemented as a child `<mark>` so it sits above the sentence-level background-clip gradient.

## Branding & Legal Constraints

### Brand Hierarchy
- **The Universe / Platform**: Covenant Odyssey
- **The Main Mechanics / Theme / Tagline**: Divergent Prophecies
- **Chapter 1 (Addon Pack)**: Kingdoms & Prophets — The Story of Eliab

Future addon packs follow the same pattern under the Covenant Odyssey universe (e.g., Genesis Cycle, Exodus & Conquest, Exile & Return, Fulfillment Arc).

### Legal
- **BANNED PHRASE**: "Choose Your Own Adventure" (and the acronym CYOA) is a registered trademark and must NEVER appear anywhere in code, prompts, UI text, documentation, marketing, or metadata. Use "interactive branching narrative" or "divergent prophecies" instead.

## UI Layout Architecture (Cinematic Full-Bleed) - LOCKED RULES

> **These are inviolable constraints, not guidelines. Any deviation is a regression and must be reverted.**

The game screen uses a z-stacked layer system where AI-generated scene art fills the entire viewport and all UI floats above it. The screen is divided into a strict left/right split with a shared vertical window.

---

### Z-Layer Stack

| Z | Layer | Content | Background |
|---|-------|---------|------------|
| 0 | Art | Full-bleed AI scene image, 100vw x 100vh | Solid image, `object-fit: cover` |
| 1 | Gradient overlay | Left 50% dark-to-transparent gradient for text legibility | `rgba(10,10,12,0.75)` left to transparent right |
| 2 | Header | Logo image + tagline (left), icon actions (right) | Transparent - buttons only have backgrounds |
| 3 | Story zone | Scene title + narration sentences (left 50%) | Transparent - text shadows only |
| 4 | Choices | 3 choice buttons floating over right 50% | Transparent - buttons at 75% opacity |
| 4 | Stats footer | Alignment stat row (bottom right) | Transparent |
| 100 | Settings overlay | Full-screen stone tablet settings dashboard | Dark tint background + centered stone tablet |

---

### Shared Vertical Window - NEVER BREAK THIS

The story zone (left) and choices zone (right) **must share identical top and bottom bounds** at all times. This creates a single visual frame that spans the full screen height between the header and the stats row.

```
top:    [header height]px   - currently 132px
bottom: 60px
```

- **Story zone**: `position: fixed; top: 132px; bottom: 60px; left: 0; width: 50%`
- **Choices zone**: `position: fixed; top: 132px; bottom: 60px; left: 52%; right: 2%`
- If the header height changes, **both** values must update together.

---

### Vertical Centering - NEVER BREAK THIS

All content in both zones must be vertically centred within the shared window - equal space at top and bottom regardless of content length.

- **Story zone**: `display: flex; flex-direction: column; justify-content: center` on the zone. Content wrapped in `#story-inner` (natural height, no `flex: 1`). `#scene-body` has `overflow-y: auto` with no flex growth.
- **Choices zone**: `display: flex; flex-direction: column; justify-content: space-around; align-items: flex-start`. Three choices distribute evenly across the full shared window height.
- **Forbidden**: `flex: 1` on any content child inside these zones - it destroys centering by expanding to fill all space.

---

### Left/Right Horizontal Split - NEVER BREAK THIS

- **Left 50%**: Story text zone exclusively. Padding: `0 40px 0 48px` (right clearance, left matches header brand alignment).
- **Right 50%** (`left: 52%`): Choices zone exclusively. 2% right margin from edge.
- The 2% gap between left and right zones is intentional - it prevents the zones from bleeding into each other.

---

### Header Bar (Z-Layer 2)

- **Left padding**: `48px` - matches the story text left padding. Logo brand and story text share the same left edge.
- **Brand**: Logo image (`logo.png` = `Covenant-Odyssey-Words.png`, height `108px`) + tagline text ("DIVERGENT PROPHECIES") beside it. Never plain text for the logo. Never a smaller logo height.
- **Tagline**: Outfit, 12px, `rgba(212,175,55,0.7)`, `letter-spacing: 3px`, uppercase.
- **Right**: Remix Icons line buttons - Save, Load, TTS toggle, Settings, Chapter badge. Courier New for badge label text only.
- **Header height**: Currently `132px` (logo 108px + 12px top/bottom padding). If logo height changes, recalculate and update both zone `top` values.
- **Shield asset** (`Covenant-Odyssey-Shield.png`): Reserved. Use for loading screens, splash cards, character card headers, or OG share images - not the game header.

---

### Choices Zone (Z-Layer 4)

- Choices are **not** in the footer. They are a separate `<div id="choices">` sibling element.
- Three choice buttons, `justify-content: space-around` - evenly spread across the full shared vertical window.
- Each button: `display: inline-flex; width: fit-content` - width is determined by text content only, never stretched to fill the container.
- Stagger indent: `nth-child(1)` no indent, `nth-child(2)` 24px, `nth-child(3)` 12px.
- Reveal animation: `translateX(20px)` -> `translateX(0)` (slides in from right, not from below).
- Pointer events: `#choices` has `pointer-events: none`; each `.choice-btn` restores `pointer-events: all`.

---

### Stats Footer (Z-Layer 4)

- `position: fixed; bottom: 0; left: 0; right: 0` - row centred at the bottom of the screen. NOT bottom-right: a cornered row clips its stat tooltips off-screen.
- Contains the alignment stat row only. No choice buttons.
- Stats: Courier New, 11px. Tooltip on hover via `::after` pseudo-element with `data-tooltip` attribute.

---

### Settings Menu Overlay (Z-Layer 100)

- Triggered by clicking the settings icon (`ri-settings-3-line`).
- Layout snaps instantly onto the settings overlay view (zero blur, zero delay, hard snap).
- Uses the stone tablet texture (`Tablet.png`) as a static, full-screen background asset centered on the screen.
- Houses controls for: Save Progress, Load Progress, voice toggle (TTS), Restart Odyssey, and Close Menu (Resume).
- All interactive options styled under the brutalist left-border-only system.

---

### Art Composition Rules
Target composition: left ~50% text-safe negative space (sky, landscape, muted tones), right ~50% action-focus centrepiece.

**Prompting rule (learned the hard way): ask ONLY for "the action on the right." Never instruct the model to "leave empty space on the left"** - explicit negative-space instructions make image models split the canvas or generate two disjoint images. Specifying only the action placement forces natural asymmetric composition: the model fills the rest with organic environment (wadi, hills, camps) that reads as intentional text-safe space.

### Scene Intro Camera (Establishing Pull-Back)

On every new scene the camera performs a slow establishing move that doubles as the loading state and gives the player time to take in the art while text and TTS generate. This replaces the old draggable stone tablet, whose only real value was letting players see the scene behind the text.

- **Phase A - Intake / pull-back**: The frame starts punched in (approx scale 1.25) anchored on the right-hand action zone (`object-position` approx 70% center, where the subject sits per the Art Composition Rules). It zooms out and pans toward centre, opening up the left text-safe negative space as it widens - the pull-back creates the room the text burns into.
- **Trigger at CHOICE TIME, not content arrival**: the instant a choice is tapped, the camera punches back in (approx scale 1.25) on the CURRENT art and starts a slow drift while generation runs in the background. The tap gets an immediate cinematic response instead of a wait.
- **Duration - gated, not fixed**: `minIntake` is 3.5-4s (10s was an eternity on a mobile screen; higher API tiers raise rate limits, not latency). Text burns in at `max(minIntake, contentReady)`, counted from the TAP: snappy when the API is fast, seamlessly masked when it lags.
- **Loading spinner is a strict fallback only**: shown only if generation/TTS overruns the whole transition window. The primary interface never shows a spinner.
- **Phase B - Ambient handoff**: When text is ready and intake has elapsed, the narration burns in (left zone now clear), TTS begins, and the camera dissolves into the ongoing Ken Burns slow loop plus the atmospheric dust motes.
- **No spinner**: Chapter 1 anchor backgrounds are local pre-drawn assets, so the next scene's real art loads instantly. The pull-back plays over that real art and replaces the full-screen loading spinner. Only text and TTS are in flight during Phase A.
- **Reduced motion**: When `prefers-reduced-motion` is set, skip the pull-back and start at the wide ambient frame.

### Scene Audio (Cinematic Layer - pre-rendered, never generative)

Runtime-generated music/soundscapes are ruled out: waiting on generative audio on top of text + TTS wrecks latency. Instead:

- **Pre-generated thematic tracks or curated/own music**, mapped to the existing **mood-tag palette** (`[tension]` -> low drone/swelling strings, `[aggression]` -> war drums, `[reverence]` -> hushed airy pad, etc.). The scene payload already carries mood tags in `sceneText` - the frontend reads the scene's leading tag as the audio key. Zero new backend work, zero generation latency.
- **Instant cue on choice tap**: an atmospheric hit (thunder, fire crackle, distant clash) fires the moment a choice is tapped, alongside the camera punch-in - sound is the immediate confirmation the game is reacting, and it changes the psychological math of the wait entirely.
- **Crossfade on scene change**: fade the current loop, mix in the new tag's loop as the pull-back begins.
- **Every scene gets its own feel** (one global track was considered and rejected) - the audio signature shifts with the backgrounds.
- Delivery: small core set of loops bundled for instant tap response; chapter sets can stream/cache from R2 (online-only content may stream; offline-path assets must bundle).

### Loading Screen
- Moses burning bush image as full-bleed background
- Centered Covenant Odyssey Divergent Prophecies shield logo (400×342 PNG with transparency)
- Gold activity spinner below logo

## Asset Size Rules
- **Backgrounds**: Always JPG (quality 85) — never PNG for photographic backgrounds
- **Logos/Icons**: PNG only when transparency is needed, resized to 2x display resolution max
- **Target height**: Background images capped at 1200px height, width scaled proportionally

---

## Mobile Layout (max-width: 768px) - STACKING RULES

On mobile, the left/right split collapses into a vertical stack. These rules are locked.

- **Story zone**: Full width (`left: 0; width: 100%`). Text anchors to the **top** of its zone (`justify-content: flex-start; padding-top: 16px`). Bottom clearance is `230px` - enough to guarantee 3 stacked choice buttons + the stats row never overlap.
- **Choices zone**: Stacked vertically at the bottom (`flex-direction: column; justify-content: flex-end; bottom: 48px`). Left-aligned. No stagger indent on mobile.
- **Header**: Logo shrinks to `56px`. Tagline uses `clamp(7px, 1.8vw, 11px)`. Inline action buttons hidden, replaced by the seal-mark toggle.
- **Gradient**: Switches from left-fade to top+bottom fade (`to bottom`, dark at both ends, lighter in the middle).
- **Background Image Positioning**: The background image focus (where key actions occur, targeted in the second third or 1/3 from the right of a 1920px image) is centered horizontally using `object-position: 66.6% center`.
- **NEVER use `justify-content: center` on the story zone on mobile** - it floats text into the center of the zone and overlaps the fixed choices below.

---

## Button Design System - LOCKED

All interactive buttons across the UI use the same left-border-only style:

- `border: none; border-left: 3px solid [color]`
- `border-radius: 0` (zero rounded corners, always)
- Hover: `border-left-color: #D4AF37` (gold pulse) + amber background + gold glow `box-shadow`
- No border on top, right, or bottom on any button

| Button type | Resting left border | Hover/active |
|---|---|---|
| Choice buttons | `#6A6A7A` grey | `#D4AF37` gold |
| Header icon buttons | `#544338` dark amber | `#D4AF37` gold |
| Chapter badge | `#D4AF37` gold (always) | - |
| Quote blockquote | `#D4AF37` gold (always) | - |

---

## Choice Text Length - ENFORCED AT TWO LAYERS

Choice button text must never be so long it breaks the layout or wraps beyond 2 lines.

**Layer 1 - System prompt**: The Gemini system prompt mandates `"Maximum 12 words. Short, punchy, decisive - written as a first-person action or brief direct quote."`

**Layer 2 - CSS safety net** (applied on `.choice-btn span:first-child`):
```css
display: -webkit-box;
-webkit-line-clamp: 2;
-webkit-box-orient: vertical;
overflow: hidden;
```

Both layers must remain in sync. If the system prompt changes, verify the CSS cap is still appropriate.

Last Updated: July 15, 2026