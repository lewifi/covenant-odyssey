# Session Handoff

_Written mid-session in case the weekly limit hits. Snapshot of state across **PasteDrops** (the focus) and **Covenant Odyssey**. Absolute date context: session around 2026-07-17._

---

## UPDATE (2026-07-18)

- **PasteDrops TTS rate-limit bug FIXED + deployed**: the worker's per-IP limiter was 429ing `/speak` before its Gemini->OpenAI->Melo fallback chain could run, so voice broke instead of degrading. `/speak` is now excluded from the limiter (naturally bounded by `/cool`, which stays limited). Live on worker.pastedrops.com - server-side, no OTA needed.
- **Covenant generator LIVE**: secrets bulk-uploaded (`wrangler secret bulk .dev.vars`), worker deployed, `node backend/test-scene.mjs` returns real scenes.
- **Phase 3 skeleton BUILT + VERIFIED** (`backend/src/skeleton.ts`): 10 beats (fields -> prophet-comes -> lineup -> house-divided -> sauls-court -> war-camp -> giants-shadow -> brothers-brink -> valley-decides -> reckoning), canon pins, 4 alignment-keyed endings (Brother's Keeper / King's Man / Unbowed / Wanderer), epilogue mode past scene 20. Anchor art served from `/scenes/` (19 jpgs copied to backend/public). Wired into the prompt + response (sceneImage/beatId/beatTitle); frontend store + GameScreen now consume sceneImage. **Verified live**: scene 6 with full-rebel history still anoints David on-page; first attempt dodged the anchor, fixed by hardening the anchor wording ("HAPPENS ON THE PAGE... A scene without this event is invalid").
- **UI BUILT + RUNNING (2026-07-18, later)**: full GameScreen rebuilt around the temp-web aesthetic per Lewi's direction - locked 50/50 desktop layout + mobile stacking branch, left-border-only buttons everywhere, quote sentences (italic + gold left border), ampersand pipeline on headings, dust motes (cross-platform Animated), stats bottom-right, settings overlay with Tablet.png (the tablet's ONE sanctioned home), no alignment telegraph. Template tab bar stripped (`_layout.tsx` now bare Stack; explore.tsx deleted). Store points at the PRODUCTION worker (localhost refs replaced).
- **VERIFIED IN BROWSER end-to-end**: scene 1 renders, burn-in reveal plays, choice click -> live skeleton generation -> beat 1 anchor lands on-page ("Samuel the seer approaches Bethlehem") -> RGT 0->5 -> anchor art `ch1-jesse-fields.jpg` crossfades in. THE CORE GAME LOOP WORKS.
- **Bugs fixed while verifying**: (a) corrupted `expo-modules-core` in node_modules (missing src/ - rm + reinstall), (b) reveal-engine stall: sentence anims lived in a ref populated by an effect with rendering gated on an animation callback - restructured to render-time useMemo anims + deterministic timer for the reveal (never gate rendering on an Animated completion callback).
- Known small stuff: INITIAL_SCENE in the store is legacy content (valley of Elah) mismatched with skeleton beat 1 (Jesse's fields) - replace with a fields opener; settings overlay + motes built but not visually inspected (screenshots time out due to constant animation); `.claude/launch.json` added (covenant-web on port 8083).
- **DEPLOYED TO PRODUCTION (2026-07-19)**: the Expo web build now LIVE at https://covenantodyssey.lewihirvela.com (replaced the old static prototype; `expo export -p web` -> `backend/public/` -> `wrangler deploy` - same worker serves UI + /api + /scenes). Also: per-scene anchor art (all 19 frames mapped, [build-up, anchor] per beat), choice-time camera with 3.6s adaptive gate, `+html.tsx` shell (title + OG tags) + route-level Head title, app.json renamed covenant-odyssey.
- Next: replace INITIAL_SCENE to match beat 1, play scenes 1-20 (esp. the sc.6 anointing + sc.20 ending in-UI), history summarization for token control, Go Wild desert backdrop, TTS live pass.

## TL;DR / where we are

- **PasteDrops**: in test mode with 85+ testers. All of today's polish is **shipped** (native OTA to production + web deploy to app.pastedrops.com). It's in "bake and watch" mode.
- **Covenant Odyssey**: getting off the ground. Just **de-risked the core premise** (Gemini writes prestige mature-but-not-explicit biblical drama cleanly) and **fixed the backend worker**. Next real work is the Phase 3 story skeleton.

---

## Covenant Odyssey

### DONE this session
- **Maturity de-risk PASSED.** Test script (`scratchpad/covenant-maturity-test.mjs`) proved `gemini-3.1-flash-lite` writes the darkest intended beat (court violence aftermath + political seduction-as-trap) at prestige quality, non-explicit, `finishReason: STOP`, **zero safety flags**. Even the cheap lite model gives prestige prose. Premise is green-lit.
- **Backend worker fixed** (`backend/src/index.ts`), typechecks clean:
  - Model `gemini-2.5-flash` (retired for new accounts, was 404ing) -> `gemini-3.1-flash-lite` (via new `STORY_MODEL` const).
  - Added `SAFETY_SETTINGS` (all 4 categories `BLOCK_NONE`) to the generate-scene call, so mature beats are not filtered in production. **This was required** - without it, mature content gets refused.
- **TTS endpoint** (`POST /api/tts`) + shared mood-tag pipeline (`backend/src/moodTags.ts`) already built earlier this session (untested end-to-end; needs a live token pass). Note: it still references `gemini-2.5-flash-preview-tts` - verify that model id is current for the account too.
- **Expo GameScreen rebuilt** (`frontend/src/app/index.tsx`): flat brutalist cage (no stone tablet), fire burn-in text, Ken Burns + intro pull-back camera, word logo 54px, Ionicons (emojis removed), alignment telegraph hidden, prefers-reduced-motion. **Typechecks clean but NEVER RUN.** Dust motes + true latency-gated camera deferred.

### IMMEDIATE next steps (in order)
1. **Deploy the worker** so generation actually works: `cd backend && npx wrangler deploy` (or test locally with `wrangler dev`). The `.dev.vars` keys were just updated to real values.
2. **Run the rebuilt GameScreen** (like we did for PasteDrops offline) to verify the cinematic layer actually plays - it's unrun.
3. **Build the Phase 3 skeleton** - THE foundational piece. JSON convergent-branching skeleton (anchor beats + convergence nodes + alignment-keyed endings) injected into the Gemini prompt. Everything (art, TTS, wild tier) hangs off it. The 20 pre-drawn Ch1 backgrounds in `Assets/backgrounds/` (jesse-fields -> samuel-arrives -> the-lineup -> valley-of-elah -> the-giant-falls, etc.) are the anchor art, already drawn.

### Cost levers (Covenant is token-heavy; these keep it sane)
- Free-gate couples heavy spend to paying users (biggest hedge).
- **Summarize history** instead of sending a growing choice log every call (caps input tokens flat).
- **Semi-author + cache anchor-beat prose**; let the model generate only connective tissue.
- Cheap model (flash-lite) for free/wild, better model for paid beats.

### Content stance (locked)
Prestige, mature-by-implication, **never explicit** (Lewi's firm line). Bounded-generative within the skeleton rails. Wild/sandbox tier needs the strongest output safety pass.

---

## PasteDrops (the focus - but currently "watch, don't build")

### DONE + SHIPPED this session (native OTA to production + web deploy live)
- Settings nudge bubble ("change who I am"), one-time, tap-to-Settings.
- Cyclops nudges the box + squeaks while TTS synthesizes.
- Small-device tightening (Cyclops 140->120, quip/type sizes down, paddings trimmed).
- Result box split: fixed-size input (no resize-while-typing) + unclamped growing cooled-response text; type down to 14; verdict 18->16.
- Tap-to-copy confirmation (haptic thud + "Copied" + pulse).
- Offline screen now ALIVE: Cyclops quips about no connection, still tickleable, dozes with snore+Zzz, auto-recovers. **Verified end-to-end on web.**
- `MAX_CHARS` 160->170 to match STT.

### PARKED PasteDrops threads (pick up anytime)
1. **Cron cleanup edited but NOT deployed.** `quip-cron-worker/src/index.js` got a new `cleanupMeta()` that purges `quip:YYYYMMDD-sN` KV metadata older than ~2 days (audio already auto-cleans at 5 days). Needs `cd quip-cron-worker && npx wrangler deploy` to go live. First run purges the whole backlog.
2. **whoami.mp3 is a silent placeholder.** `assets/whoami.mp3` is 0 bytes, gated off via `WHO_AM_I_READY=false` in `tts.js`. Plan: **stream it, don't bundle** (rework `playWhoAmI()` to fetch from a URL so it ships via OTA with no build). Only bundle things the OFFLINE path needs.
3. **Monetization system: SPEC'D, not built.** Build at launch, NOT during test mode. Design below.

### Monetization design (banked for launch)
- **"Always free vs full flair"**, never "free vs locked". The TTS fallback chain (Gemini -> OpenAI -> Melo/device) means the free floor costs ~nothing and never breaks, so "free" is a keepable promise. Premium = the good Cyclops voice + all accents/moods.
- **Cyclops makes the pitch** (self-deprecating, joke lands on him: "one eye, real rent"). Never a faceless paywall.
- **Milestone ladder with DECAYING frequency** (never begging): ~day 2-3 soft seed -> ~week 1 what-Premium-is -> ~month 1 the full ask -> then quiet. Each fires once, only after a successful cool; a dismissal pushes the next further out; after month-1, stop. Tracked client-side (no accounts, no data).
- **Avoid absolute "forever/ever"** in copy (Lewi's discipline) - present-tense character traits instead ("I don't run ads at you").
- Privacy trio (no accounts / no data / no ads) = one marketable stance, not three constraints. Accounts optional, value-add only (sync settings/history), never a gate.
- Copy lines are drafted in chat (no-ads / privacy / pitch / soft nudge) - rewrite them flair-framed when building the Premium screen.

### PasteDrops deploy commands (for reference)
- Native OTA: `cd Paste\ Drops/pastedrops-app/pastedrops-mobile && EAS_NO_VCS=1 npx eas update --branch production --environment production --message "..." --non-interactive`
- Web: `npm run deploy` (expo export web -> wrangler -> app.pastedrops.com). Web is demo/portfolio only.

---

## Environment / loose ends
- A local Expo **web dev server is still running** on `localhost:8081` (background task) - Lewi can Ctrl+C it.
- Scratchpad has the Covenant maturity test script if you want to re-run it.
- Memory files updated this session: `about-lewi`, `cloudflare-exit-plan`, `shipping-discipline`, `concurrent-antigravity-edits` (Antigravity edits the same repos concurrently - re-read files before editing).

## Priority framing (Lewi's call)
**Monetization later, Covenant now, PasteDrops on watch.** ~2 weeks of test runway left. PasteDrops needs eyes (retention/feedback), Covenant needs hands - so they don't compete. A PasteDrops tester flag jumps the queue.
