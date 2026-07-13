# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2026-07-14

### Added
- Created project vision in `IDEA.md` outlining the choose-your-own-adventure style game, mature biblical themes, and visual goals.
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





