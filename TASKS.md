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
- [x] No solid red - replaced with dirt/charcoal brown (`#544338`)
- [x] No white borders - replaced with charcoal
- [x] 75% opacity backgrounds on cards, buttons, and panels
- [x] Animated golden pulse hovers (`goldGlowPulse`) on interactive elements
- [x] Updated ARCHITECTURE.md with full design guidelines
- [x] Removed stone tablet from primary narrative game loop, replacing with a flat, rigid layout
- [x] Created full-screen Settings Snap Overlay using the stone tablet background asset
- [x] Implemented ampersand Typography RegEx pipeline for headings and subheadings
- [x] Cleaned up banned em dashes globally across codebase and documentation

## Phase 3: Core Gameplay Loop (Current Focus)
- [x] Build the story skeleton for Chapter 1 (`backend/src/skeleton.ts`: 10 anchor beats mapped to pre-drawn `/scenes/` art, canon pins, alignment-keyed endings incl. Wanderer) and inject the current beat + required anchor into the generation prompt. Deployed and verified live: scene 6 with a full-rebel history still lands the anointing on-page ("the oil pours over the boy"), choices become reactions to the anchor
- [ ] Wire the multi-scene branching loop: selecting a choice advances state and generates the next scene
- [ ] Apply alignment score updates (Righteous / Pragmatic / Rebel) from each choice
- [ ] Implement the static archetype label lookup from live alignment scores
- [ ] Trigger Gemini character summaries at milestones (every 5 choices, chapter transitions, 15+ swings)
- [ ] Persist and restore gameplay state through the existing D1 save/load flow
- [ ] Implement monetization gate: free first 4 scenes, ad gate after Scene 4
- [ ] Implement "Go Wild" free sandbox between chapters (unbounded text, single cached backdrop per chapter, soft cap, safety pass, seeded from carried alignment)
- [ ] Generate and cache the Chapter 1 Go Wild desert backdrop

### Phase 3 UI (Expo is the canonical target - app + web from one codebase)
- [x] Rebuild the Expo GameScreen to the cinematic spec: flat brutalist cage (NO stone tablet - tablet stays in settings only), fire burn-in text reveal, Ken Burns. Typechecks clean; not yet run/verified in the browser or on device
- [x] Scene Intro Camera: establishing pull-back (punch-in on right action zone -> slow zoom-out) then hand off to Ken Burns. (v1 is timing-based ~5s; true content-ready gating + starting the pull-back at choice-time to mask gen latency still TODO)
- [x] Logo usage: word-only logo in the story header at 54px (header/zone tops recalculated); full shield+text logo on the paywall
- [x] Copy word-only and shield logo assets into `frontend/assets/images/`
- [x] Remove banned emojis from GameScreen; fix chapter badge (now "Ch. I", no longer sceneId) and stat labels (now RGT/PRG/RBL)
- [x] Hide the alignment telegraph on choice buttons (effects no longer shown on the button face)
- [x] Respect `prefers-reduced-motion` (skips pull-back + burn-in timing)
- [ ] Scene audio layer: pre-rendered ambient loops mapped to mood tags (read the scene's leading tag), instant cue on choice tap, crossfade on scene change. Curate/pre-gen the tracks (no runtime generative audio)
- [ ] Loading spinner as strict fallback only (show only when generation/TTS overruns the transition window)
- [ ] BEFORE ANY PUBLIC SHARE: per-IP rate limit on the worker (Chapter 1 is fully free with no gate, so every scene is an uncapped Gemini call - port the PasteDrops limiter pattern, ~40 scenes/day/IP, plus the Go Wild epilogue soft-cap)
- [ ] Run the rebuilt GameScreen in the browser + on device to tune camera timing and burn-in feel
- [ ] Wire the settings overlay (settings icon is present but inert) with the stone tablet background
- [ ] Add the header archetype badge beside the chapter marker (data + render)

## Phase 4: Text-to-Speech (Gemini TTS) & SFX (Down-the-Track Feature)
- [x] Implement Worker routing for speech synthesis via Gemini TTS (`/api/tts`: mood-tag -> style prompt, PCM-to-WAV. Untested end-to-end - needs a live token pass)
- [x] Build shared mood-tag pipeline (`backend/src/moodTags.ts`: strip tags for display, translate tags to TTS delivery style)
- [ ] Strip mood tags from displayed scene text on the frontend (consume the shared pipeline)
- [ ] Integrate HTML5 / Native sound playback in frontend using Zustand triggers

## Phase 5: Image Generation & Scene Art (Down-the-Track Feature - Not Required for First Release)
- [ ] Implement Worker endpoint for AI scene art generation (Gemini/DALL-E)
- [ ] Display generated artwork in the art card panel
- [ ] Cache generated images in Cloudflare R2

## Phase 6: Authentication & Multi-device Sync
- [ ] Implement user authentication (email/OAuth)
- [ ] Link save states to authenticated user accounts
- [ ] Enable cross-device progress syncing
