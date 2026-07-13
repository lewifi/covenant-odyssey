# Covenant Odyssey

**Covenant Odyssey** is an immersive, mature, choose-your-own-adventure (CYOA) experience that brings the depth and raw humanity of biblical narratives to life using generative AI. 

Players make meaningful choices mirroring the full spectrum of scripture—faith, doubt, war, betrayal, passion, and redemption—shaping their path toward multiple unique endings.

---

## 🌟 Core Features

- **Generative & Replayable**: Powered by Gemini AI, every playthrough is unique while remaining faithful to scriptural contexts.
- **Mature & Honest Storytelling**: Explores the raw, un-sanitized humanity of the source material.
- **Morality & Alignment Tracking**: Your choices shift your character's alignment across three paths:
  - 🕊️ **Righteous**
  - 🛡️ **Pragmatic**
  - ⚔️ **Rebel**
- **Immersive Presentation**: Premium screen layout, generative art mockups, text-to-speech (TTS) audio narration, and mood-based sound effects.
- **Modular Story Arcs (DLC / In-App Purchases)**:
  - **Kingdoms & Prophets** (Starting Arc – The Eliab Story)
  - **Genesis Cycle** (Add-on)
  - **Exodus & Conquest** (Add-on)
  - **Exile & Return** (Add-on)
  - **Fulfillment Arc** (Add-on)

---

## 🛠️ Project Structure

This repository is organized as a monorepo containing both the frontend app and backend services:

- **`/frontend`**: React Native + Expo mobile & web app using Zustand for gameplay state management.
- **`/backend`**: Cloudflare Workers API utilizing D1 databases and R2 storage for game state and asset pipelines.

---

## 🚀 Getting Started

To run, develop, or test the project locally, please refer to the step-by-step commands in **[INSTRUCTIONS.md](INSTRUCTIONS.md)**.

For details on the technical design and tools used, see **[ARCHITECTURE.md](ARCHITECTURE.md)**.
