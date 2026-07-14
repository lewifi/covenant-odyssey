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

## Design Guidelines & Styling Constants (Brutalist Pivot)

- **Visual Theme**: Menacing, unfriendly, and raw brutalist style.
- **Typography & Font Pairings**:
  - Headings / Logos / Titles: `'Playfair Display', serif` (monolithic, heavy classic serif)
  - Subheadings / Paragraphs / Body Text / Buttons: `'Outfit', sans-serif` (stark, clean sans)
  - Status Indicators / Labels: `'Courier New', monospace` (raw technical/terminal styling)
  - Subheadings format: Slightly larger, bold, and in all caps (`text-transform: uppercase`).
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
- Left: "COVENANT ODYSSEY" logo text (Courier New monospace, gold)
- Right: Icon buttons — 💾 Save, 📂 Load, 🔊/🔇 TTS Mute Toggle, ⚙ Settings, ⛪ Chapter badge
- TTS toggle is an immediate persistent mute — instantly stops all TTS API calls when off

### Art Composition Rules
AI-generated scene images must always be prompted with:
- **Left ~40%**: Text-safe space (sky, landscape, muted tones, negative space) for text overlay
- **Right ~60%**: Action-focus art (burning bush, battle, dramatic figure) as visual centerpiece

### Footer Bar (Z-Layer 4)
- Choice buttons stacked vertically with 75% opacity brown backgrounds and golden hover pulse
- Compact alignment stats row (🕊️ Righteous, 🛡️ Pragmatic, ⚔️ Rebel) beneath choices

### Loading Screen
- Moses burning bush image as full-bleed background
- Centered Kingdoms & Prophets shield logo (400×342 PNG with transparency)
- Gold activity spinner below logo

## Asset Size Rules
- **Backgrounds**: Always JPG (quality 85) — never PNG for photographic backgrounds
- **Logos/Icons**: PNG only when transparency is needed, resized to 2x display resolution max
- **Target height**: Background images capped at 1200px height, width scaled proportionally

Last Updated: July 14, 2026