# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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



