# Covenant Odyssey Architecture Document (v1.5)

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

## Monetization

- Free: First 4 scenes

- Ad gate after Scene 4

- Premium: $5.99–$7.99 one-time for unlimited access

## Key Flows

- Scene generation via Gemini with strong prompts

- Responsive full-screen image + side text layout

- Save system via D1

## Development Notes

Use Claude for critical code and story coherence. Use Gemini for cost-effective generation in production.

API keys are separated between the Story generation engine (`GEMINI_STORY_API_KEY`), the Audio TTS generation engine (`GEMINI_TTS_API_KEY`), and the Image generation engine (`GEMINI_IMAGE_API_KEY`) for granular usage tracking.

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


## TTS Voice Model — Kingdoms & Prophets

> **Development note**: TTS is disabled during development to preserve API tokens. Controlled via the `ttsEnabled` Zustand toggle — when off, all synthesis calls are skipped immediately and persistently. Enable only in production or for deliberate audio testing.

### Model Configuration
- **Gemini TTS speech model**: `Zubenelgenubi`
- **Pitch**: Lower middle
- **Audio profile**: A stern and weary gatekeeper
- **Scene awareness**: Context-aware narration — tone and pacing shift with scene mood
- **Genre context**: Fantasy RPG style

### Narration Style
- **Default pacing**: Measured, deliberate
- **Urgency snap**: Pacing accelerates at dramatic peaks (e.g., divine commands, reveals)
- **Tone baseline**: Tense and cautious — carries the weight of covenant consequences

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

### Reference Script — Scene 1: The Burning Bush
```
[aggression] The golden dawn light cuts through the dust of the wadi.
Your sheep bleat nervously.
[tension] Before you, the bush burns fiercely — tongues of flame wrapping the branches without consuming them.
[agitation] Heat radiates against your skin, carrying the scent of scorched earth and something sacred.
The voice rolls over you like thunder wrapped in mercy, echoing covenants made with flawed men before you.
[determination] "Eliab, son of Jesse. The kingdoms fracture. Blood will stain the throne before the anointed rises. Choose how you will walk this path of fire and flesh."
```

### Integration Points (Phase 3)
- Worker endpoint: `POST /api/tts` — accepts script + mood-tagged text, returns audio stream
- Frontend: HTML5 `Audio` element (web) / `expo-av` (native), triggered after scene text loads
- Mute toggle: `setTtsEnabled(false)` in Zustand immediately halts any pending or queued synthesis calls
- Sentence shimmer sync: TTS word timing data (if available from API) drives the gold shimmer to the currently spoken sentence

## Design Guidelines & Styling Constants (Brutalist Pivot)

- **Visual Theme**: Menacing, unfriendly, and raw brutalist style.
- **Typography & Font Pairings**:
  - **Headings / Logos / Titles / Wordmarks**: `'Playfair Display', serif` — the game wordmark "COVENANT ODYSSEY" in headers, scene titles, and all prominent headings. Heavy, monolithic, classic serif.
  - **Subheadings / Body / Buttons / Badges**: `'Outfit', sans-serif` — stark, clean. Used for choice buttons, paragraph text, nav labels.
  - **Status / Labels / Technical readouts**: `'Courier New', monospace` — for alignment stats, chapter badges, system-level labels only. Never for logos or headings.
  - Subheadings format: Bold, all caps (`text-transform: uppercase`), slightly larger than body.
- **UI Shape Constraints**:
  - **Zero Rounded Corners**: Absolutely no rounded corners are allowed anywhere (`border-radius: 0;` / `borderRadius: 0` strictly enforced).
  - **Square Elements**: All buttons, alignment cards, and containers must use absolute sharp square/rectangular shapes.
- **Frame, Borders & Colors**:
  - Heavy solid framing: Use thick solid borders (e.g., `2px` or `3px` solid borders) on cards and buttons.
  - Color Palette: Raw charcoal background (`#0A0A0C`), stark white text, dirt/charcoal brown accents (`#4E3F35`), and heavy gold highlights (`#856A1E` / `#D4AF37`) for attention.
  - **No Solid Red**: Red is banned as it looks cheap.
  - **Background Opacity**: Layered background cards, boxes, and buttons may use `75%` opacity (e.g., `rgba(23, 23, 33, 0.75)` or charcoal brown with opacity) to add premium visual depth.
- **Interactive Micro-animations**:
  - **Golden Pulse Hovers**: All interactive choice buttons, selectable options, and key hovered artwork cards must animate with a smooth, pulsing golden glow (`@keyframes goldGlowPulse`) to guide player focus and look highly premium.
- **Icons — No Emojis**:
  - **BANNED**: Emojis are absolutely banned everywhere — UI, code, comments, documentation, prompts, and git commit messages. They render inconsistently across platforms and break the brutalist aesthetic.
  - **Web**: Use **Remix Icons** via CDN (`https://cdn.jsdelivr.net/npm/remixicon@4.3.0/fonts/remixicon.css`) — line style only (`ri-*-line` suffix, never `-fill`).
  - **React Native / Expo**: Use **`@expo/vector-icons`** Ionicons outline variants — `import { Ionicons } from '@expo/vector-icons'`.
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

## UI Layout Architecture (Cinematic Full-Bleed)

The game screen uses a **z-stacked layer system** where AI-generated scene art fills the entire viewport, and all UI elements float on top:

| Z-Layer | Content | Background |
|---------|---------|------------|
| 0 (Base) | Full-bleed AI scene art (`<ImageBackground>`) | Solid image |
| 1 | Left 50% gradient overlay for text readability | `rgba(10,10,12,0.75)` → transparent |
| 2 | Header bar — logo text + action buttons | Transparent (buttons only have bg) |
| 3 | Story text zone (left 40%) — title + narration | Transparent (text shadows only) |
| 4 | Footer bar — choice buttons + alignment stats | Transparent (buttons at 75% opacity) |
| 5 | Paywall / Ad gate overlay (when triggered) | Full dark overlay |

### Header Bar (Z-Layer 2)
- Left: "COVENANT ODYSSEY" logo wordmark — **Playfair Display, serif, gold (`#D4AF37`), uppercase**. Never Courier New.
- Right: Icon buttons (Remix Icons line set) — Save (`ri-save-line`), Load (`ri-folder-open-line`), TTS toggle (`ri-volume-up-line` / `ri-volume-mute-line`), Settings (`ri-settings-3-line`), Chapter badge (`ri-bookmark-line`)
- Chapter badge text label: Courier New monospace (system/status label only)
- TTS toggle is an immediate persistent mute — instantly stops all TTS API calls when off

### Art Composition Rules
AI-generated scene images must always be prompted with:
- **Left ~40%**: Text-safe space (sky, landscape, muted tones, negative space) for text overlay
- **Right ~60%**: Action-focus art (burning bush, battle, dramatic figure) as visual centerpiece

### Footer Bar (Z-Layer 4)
- Choice buttons: **Outfit, sans-serif** — stark, clean, easy to read under action pressure. Stacked vertically with 75% opacity brown backgrounds and golden hover pulse.
- Choice alignment badge labels: Courier New monospace (system label)
- Alignment stats row: Courier New monospace with Remix Icons — Righteous (`ri-scales-3-line`), Pragmatic (`ri-shield-line`), Rebel (`ri-sword-line`) beneath choices.

### Loading Screen
- Moses burning bush image as full-bleed background
- Centered Covenant Odyssey Divergent Prophecies shield logo (400×342 PNG with transparency)
- Gold activity spinner below logo

## Asset Size Rules
- **Backgrounds**: Always JPG (quality 85) — never PNG for photographic backgrounds
- **Logos/Icons**: PNG only when transparency is needed, resized to 2x display resolution max
- **Target height**: Background images capped at 1200px height, width scaled proportionally

Last Updated: July 14, 2026