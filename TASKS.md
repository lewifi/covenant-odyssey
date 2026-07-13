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

## Phase 3: Text-to-Speech (Gemini TTS) & SFX
- [ ] Implement Worker routing for speech synthesis via Gemini TTS
- [ ] Integrate HTML5 / Native sound playback in frontend using Zustand triggers

