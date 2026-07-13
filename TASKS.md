# Tasks - Covenant Odyssey Setup

- [x] Create `CHANGELOG.md` and document the project kickoff
- [x] Initialize Cloudflare Workers backend project in `backend/`
- [x] Initialize Expo frontend project in `frontend/`
- [x] Configure Zustand store and boilerplate files
  - [x] Install Zustand & Expo Linear Gradient packages
  - [x] Create the game state store `useGameStore.ts`
  - [x] Implement game UI dashboard in `frontend/src/app/index.tsx`
- [x] Verify local execution of the projects
- [x] Create walkthrough of the changes
- [x] Set up Git & push to GitHub

## Phase 1: Gemini AI Story Generation Engine
- [x] Bind `GEMINI_API_KEY` (and optional fallback keys) to the Worker backend locally
- [x] Implement Worker endpoint `/api/generate-scene` to handle structured prompts and return JSON scenes
- [x] Connect Zustand frontend store to fetch real scenes dynamically from backend Worker

## Phase 2: Save System & State Persistence (Cloudflare D1)
- [x] Design migration schemas for saving/loading states in D1 database
- [x] Create `/api/save` and `/api/load` routes in backend Worker
- [x] Implement game save state syncing in frontend application

## Design Pivot: Menacing Brutalism
- [x] Zero rounded corners enforced across all UI components
- [x] Heavy solid borders (2px/3px) with charcoal frames (`#3F3F54`)
- [x] Custom typography pairings (Playfair Display, Outfit, Courier New)
- [x] No solid red — replaced with dirt/charcoal brown (`#544338`)
- [x] No white borders — replaced with charcoal
- [x] 75% opacity backgrounds on cards, buttons, and panels
- [x] Animated golden pulse hovers (`goldGlowPulse`) on interactive elements
- [x] Updated ARCHITECTURE.md with full design guidelines

## Phase 3: Text-to-Speech (Gemini TTS) & SFX
- [ ] Implement Worker routing for speech synthesis via Gemini TTS
- [ ] Integrate HTML5 / Native sound playback in frontend using Zustand triggers

## Phase 4: Image Generation & Scene Art
- [ ] Implement Worker endpoint for AI scene art generation (Gemini/DALL-E)
- [ ] Display generated artwork in the art card panel
- [ ] Cache generated images in Cloudflare R2

## Phase 5: Authentication & Multi-device Sync
- [ ] Implement user authentication (email/OAuth)
- [ ] Link save states to authenticated user accounts
- [ ] Enable cross-device progress syncing
