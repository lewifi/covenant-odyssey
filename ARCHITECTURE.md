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

Last Updated: July 14, 2026