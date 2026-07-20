# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2026-07-15

### Design
- Adopted the "Islands & Sea" content model: authored cinematic chapters (paid, convergent, cached art/TTS) alternating with a free "Go Wild" generative sandbox between chapters. Wild mode is text-driven, capped, seeded from the player's carried alignment, and uses a single cached backdrop per chapter (Chapter 1 = the desert) to hold image/TTS cost to a fixed floor.
- Documented the convergent branching ("string of pearls") arc model: the LLM varies prose and texture while a JSON skeleton pins the fixed anchor beats and alignment-keyed endings, so playthroughs diverge in feel but reach the same conclusions.
- Reprioritized the roadmap: inserted Phase 3 (Core Gameplay Loop) as current focus and shifted TTS, Image Generation, and Auth to Phases 4/5/6. Gameplay/skeleton must land first because the finite anchor set is what the expensive TTS and image layers cache against.

### Added
- Rebuilt the Expo `GameScreen` (`frontend/src/app/index.tsx`) as the canonical cross-platform UI (Expo was chosen over the HTML prototype because it ships app + web from one codebase). Flat brutalist cage (stone tablet removed from the game loop, retained for settings only), fire burn-in text reveal, Ken Burns background, and a new Scene Intro Camera establishing pull-back (punch-in on the right action zone then slow zoom-out) that replaces the loading spinner. Removed all banned emojis (now `@expo/vector-icons` Ionicons), switched the header to the word-only logo at 54px with the full shield+text logo on the paywall, dropped the alignment telegraph from choice buttons to preserve roleplay, fixed the chapter badge and stat labels (RGT/PRG/RBL), and added `prefers-reduced-motion` support. Typechecks clean; not yet run in-browser/on-device. Dust motes and true latency-gated camera timing deferred.
- Added `@expo/vector-icons` and repaired the frontend `node_modules` (the install was incomplete - `@expo/cli` was missing). Copied the word-only and shield logo assets into `frontend/assets/images/`.
- Implemented the Gemini TTS Worker endpoint (`POST /api/tts`): strips inline mood tags from the spoken text, translates them into a natural-language delivery-style prompt, synthesizes with the `Zubenelgenubi` voice, and wraps the returned PCM in a WAV container for direct browser/native playback. Plumbing only - not yet wired to the frontend and untested end-to-end (deferred to a live token pass per the dev-token conservation note).
- Added the shared mood-tag pipeline (`backend/src/moodTags.ts`): `stripMoodTags` for display text, `extractMoodTags`, and `buildStylePrompt` mapping the ARCHITECTURE.md mood palette to TTS delivery instructions. Shared seam between text generation and TTS.
- Created the full-screen Settings Menu Overlay using the static stone tablet background asset (`Tablet.png`) for mockup configuration. Snap transition on trigger with zero lag or blur.
- Implemented settings controls for Save, Load, Voice Narration (TTS) toggle, Restart, and Resume inside the Settings Overlay.
- Implemented the ampersand Typography RegEx Pipeline (`text.replace(/\band\b/gi, '&')`) for headings and subheadings.
- Documented that Text-to-Speech (TTS) and Image Generation are down-the-track features, with image generation not required for the first release at all.

### Changed
- Removed the stone tablet motif from the primary narrative game loop to implement the flat digital brutalist cage.
- Refined the desktop layout to use a rigid 50/50 horizontal split with a fixed shared vertical window (`top: 132px`, `bottom: 60px`) and vertical centering on story text.
- Refined the mobile collapsing stacking layout, centering the background image focus region (1/3 from the right) using `object-position: 66.6% center`.
- Banned and replaced all em dashes (`—` and `--`) globally with standard space-padded hyphens (` - `) or commas in UI text, code, templates, and documentation.
- Updated `ARCHITECTURE.md` to Version 1.6 and `IDEA.md` to document settings overlay, ampersand pipeline, mobile background image alignment, and clean up em dashes.

## [Unreleased] - 2026-07-14

### Added
- Created project vision in `IDEA.md` outlining the interactive branching narrative game, mature biblical themes, and visual goals.
- Established primary tech stack in `ARCHITECTURE.md` including React, Expo, Zustand, Cloudflare Workers, D1 database, R2 storage, Claude (for architecture/oversight), and Gemini TTS.
- Created `CHANGELOG.md` to track repository progression.
- Configured repository setup to ignore iOS builds and tests for now.
- Updated `IDEA.md` with detailed Add-on Story Arcs (Genesis, Exodus & Conquest, Kingdoms & Prophets, Exile & Return, Fulfillment).
- Configured git to ignore the `Assets` folder and untracked it from the repository.
- Documented visual assets and styling themes inside `IDEA.md` for project alignment.
- Updated root `.gitignore` to ignore personal editor settings, test outputs, and secrets, and untracked `.vscode/` directories.
- Created root `README.md` introducing the project vision, features, and setup references.
- Documented API key separation (Story, TTS, and Image generation) in `ARCHITECTURE.md` and local `.dev.vars` configurations.
- Implemented the Gemini AI Story Generation Engine (Phase 1): created `/api/generate-scene` endpoint with OpenAI fallback inside backend Worker, and connected it to the frontend Zustand store with local mock fallbacks.
- Created a temporary web preview workspace in `temp-web/` containing static page preview for Kingdoms & Prophets theme, and added it to root `.gitignore`.
- Configured Cloudflare Worker static assets and custom domain routing for `covenantodyssey.lewihirvela.com`, copied Kingdoms & Prophets theme page to public assets, and successfully deployed to Cloudflare.
- Implemented the Cloudflare D1 database save persistence (Phase 2): created database schema migrations, added `/api/save` and `/api/load` routes in the backend Worker, and added save/load state syncing in the frontend Zustand store.
- Implemented menacing, unfriendly brutalist design guidelines: flattened all border-radius styles to 0 (no rounded corners), removed white borders, added heavy 2px/4px border stylings, set custom typography pairings (Playfair Display, Outfit, Courier New monospace), and integrated custom golden hover animations on choice options.

### Branding
- Established canonical brand hierarchy: Universe = Covenant Odyssey, Theme/Tagline = Divergent Prophecies, Chapter 1 = Kingdoms & Prophets — The Story of Eliab.
- Banned "Choose Your Own Adventure" and the acronym CYOA from all code, UI, documentation, and prompts (registered trademark). Replaced with "interactive branching narrative" and "Divergent Prophecies".
- Renamed internal `CYOAScreen` component to `GameScreen`.
- Updated backend AI system prompt to use full new brand name.

### UI Architecture — Cinematic Full-Bleed Layout
- Rewrote `frontend/src/app/index.tsx` from card-based layout to Z-stacked cinematic full-bleed layout.
- Z-Layer system: art background (Z=0), left gradient overlay (Z=1), floating header (Z=2), story text zone left 40% (Z=3), footer choices (Z=4), paywall overlay (Z=50).
- Loading screen: Moses burning bush JPG background, centered Covenant Odyssey Divergent Prophecies logo, gold activity spinner.
- Sentence-by-sentence animated story reveal: each sentence fades in and slides up staggered on scene load.
- Lumo Dreams-style gold shimmer on active sentence: sweeping `background-size: 200% auto` gradient animation matching word-glow technique from Lumo Dreams narration engine.
- Art composition rule enforced: left 40% text-safe space (sky/landscape), right 60% action-focus subject.

### Assets
- Moved logo and background images to `frontend/assets/images/` and `Assets/`.
- Resized Moses burning bush background to 2423x1200 (1200px height cap).
- Converted Moses burning bush from PNG (3.7 MB) to JPG quality 85 (197 KB) — 95% reduction.
- Resized Kingdoms & Prophets logo PNG from 1500x1281 (2.3 MB) to 400x342 (234 KB).
- Added new Covenant Odyssey Divergent Prophecies logo PNG (500x427 original, resized to 400x342, 239 KB) — used as loading screen wordmark.
- Added Covenant Odyssey Divergent Prophecies JPG as OG social share card.
- Documented asset size rules: backgrounds always JPG quality 85, logos PNG only when transparency required, max 1200px height.

### Icons
- Banned emojis from all UI, code, documentation, and commit messages — inconsistent across platforms, breaks brutalist aesthetic.
- Web: Remix Icons CDN (`remixicon@4.3.0`) — line style only (`ri-*-line`).
- React Native: `@expo/vector-icons` Ionicons outline set (pending full wiring).
- Documented full icon map in `ARCHITECTURE.md`.

### Typography Fixes
- Corrected header wordmark "COVENANT ODYSSEY" from Courier New back to Playfair Display, serif.
- Documented strict font role separation in `ARCHITECTURE.md`: Playfair Display for logos/headings, Outfit for body/buttons, Courier New for status labels only.

### Demo Scene
- Built cinematic demo in `temp-web/index.html`: Scene 1 — The Burning Bush.
- Full-bleed Moses fire background, left gradient overlay, floating header/footer, sentence-reveal animation, Lumo shimmer, 3-choice footer with alignment tracking (Righteous / Pragmatic / Rebel).
- Deployed to `covenantodyssey.lewihirvela.com` via Cloudflare Workers static assets.
- Added `.gitignore` to `backend/public/` to prevent `node_modules` and build artifacts from being committed.



