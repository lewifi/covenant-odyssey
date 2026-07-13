# Covenant Odyssey Architecture Document (v1.5)

## Project Overview

Immersive generative choose-your-own-adventure experience based on covenant narratives. Mature themes included. Short sessions with dynamic branching, save points, and multiple endings.

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
- **Frame & Borders**:
  - Heavy solid framing: Use thick solid borders (e.g., `2px` or `3px` solid borders) on cards and buttons.
  - High contrast color palette: Raw charcoal background (`#0A0A0C`), solid fills (`#171721`), stark white text, and menacing accents (deep crimson `#C53030`, heavy gold `#856A1E`). No soft drop shadows or ambient glows.

Last Updated: July 14, 2026