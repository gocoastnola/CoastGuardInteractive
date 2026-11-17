# CoastGuard Interactive — current handoff (2026-11-17)

Current work is [docs/GLOBE-AUDIO-REVISION.md](docs/GLOBE-AUDIO-REVISION.md): the owner-requested native globe, compact destination dock/explicit gallery, and licensed recorded primary soundtrack with authored fallback/cues. Earlier repair/visual documents and the appendices below are historical source-state evidence, not certification of this revision.

## Locked project and story

- Repository: `gocoastnola/CoastGuardInteractive`. Retain Vite, React, TypeScript, MapLibre, GSAP and plain CSS.
- Opening remains the four-corner mission-photo **“Enter your ZIP code and start your journey”** screen with its familiar controls and no pre-orders assignment/destination spoiler.
- Hometown → Cape May travel → eight training weeks → graduation → illustrative Polar Star reveal → Seattle/ship introduction → full patrol → homecoming/exploration.
- All nine arrivals remain Honolulu, Hobart, Wellington, **McMurdo before Punta Arenas/Patagonia**, Cape Horn, Rio, Panama and Seattle. Approved training/graduation/exterior/research/penguin imagery, source credits and every destination’s context remain.
- Preserve independent-demo, unverified-content and illustrative-assignment language. No accounts, applicant forms, backend, keys or paid services are introduced.

## Current implementation and recovery

The current branch is `codex/globe-and-adventure-audio-20261117-162137Z`, based on fresh main `481c4c98b31451541c6ceae26158b9f08f122571`. Remotely verified annotated tag `pre-codex-baseline-20261117-162137Z` preserves that pre-globe baseline. Original tag `pre-codex-redesign-2026-11-16` still preserves `013fff722014729f4e044b0ce4060dbdfc3bbd57`. A complete-history bundle is outside Git at `/workspace/coastguard-globe-evidence/pre-globe-recovery.bundle`. Do not move tags or edit the separately hosted benchmark.

The globe uses MapLibre’s native vertical-perspective projection. It stays broad and turns toward each voyage leg; far-hemisphere route portions are naturally hidden, while full route data and the visited rail remain. Stylized procedural clouds/ocean highlights are not live weather or satellite imagery. Automatic photography is a compact thumbnail dock; Details pauses travel and opens full text/credits/gallery, then restores focus and resumes.

Primary music is **Vanguard — Scott Buckley**, bundled under verified CC BY 4.0 terms with attribution in the native information control and `public/media/music/ATTRIBUTION.txt`. One streaming HTML audio element feeds the existing single AudioContext; it cues/restarts at 45 seconds, uses 0.4 recorded gain and gates audibility on playback/seek readiness. The authored 124–132 BPM training/orders/patrol score is the fallback, not Vanguard’s tempo. Arrival impact and the 4.6-second orders rise/reveal remain authored, without per-row clicks. No subjective listening claim is made; the actual recorded excerpt and fallback WAVs are distinct evidence.

Current measured results under Node 22.23.5/npm 11.9.0 are locked install, 79 unit tests in 13 files, 18 valid/unverified records and the production-subpath build **PASS**. Final 17-case development, seven-case production and seven-case WebKit results remain pending. WebKit engine startup now passes after bounded user-space setup; older host-library BLOCKED notes are historical, not the current availability status. This remains desktop-engine testing, not physical iPhone Safari.

The portrait stage is now 372/664 pixels (56.0%) because 56 pixels are reserved for provider/music attribution. Earlier integrated scene captures predate that frame. Actual listening, real-device checks and final current live-journey/CI/publication evidence are not yet recorded. Baseline CI #21/component frames do not certify this candidate. The owner has authorized publication of this concrete revision; complete checks and verify the deployed state, without another approval question for the same scope.

## Local workflow

Use Node.js 22 and the existing `package-lock.json`: `npm ci`, `npm run build`, `npm test`, `npm run validate:data`, `npm run test:e2e`. Dev uses `127.0.0.1:5174`; production preview uses `5175`. Never use or stop port 4173. Do not touch the owner’s Mac or other projects.

No money, accounts, keys or paid services. Nothing secret in client source. `VITE_*` values must be public. GitHub Pages project-subpath assets need production verification, not just a development-server pass.

## Source guide

- `src/App.tsx`: flow and transitions. The historical `dateEntry` identifier renders `Adventure/ZipEntry.tsx`.
- `src/journey/machine.ts`: reducer, including separate `travel` before `act1`.
- `JourneyOverlay.tsx`: hometown and Seattle travel; `TrainingAct.tsx` / `DaysCounter.tsx`: training and graduation.
- `SlotMachine.tsx`, `ShipIntro.tsx`, `PatrolOverlay.tsx`: assignment, ship, full patrol.
- `src/journey/patrol.ts`: ordered stops and antimeridian-safe route math.
- `src/lib/audio.ts` / `recordedScore.ts` / `audioScore.ts`: the streaming licensed primary recording, authored cue/fallback scheduler and shared fallback-preview builders. Gesture unlock and the owner-directed no-mute policy remain; narration’s separate gate is not a global mute.
- `src/lib/globe.ts` / `globe-atmosphere.ts`: native-globe framing math and authored procedural atmosphere; not live weather.
- `src/styles/voyage-stage.css`: globe-led stage, compact dock, reduced-motion itinerary and explicit Details drawer.
- `src/data/units.json`: unit data; only owner can mark records verified.
- `public/data/zips.json`: live lazy-loaded Census ZIP centroid table.
- `public/media/` and `ASSET_LICENSES.md`: bundled media and source records. Current training/ports also use remote Commons/DVIDS images; network failures must be distinguished from code defects.

## Coordination and limits

Fetch before work; use an isolated branch/worktree and do not overwrite another assistant’s changes. Keep browser fixtures separate from live external-media checks. Mobile viewports and desktop WebKit are emulation, not real iPhone Safari. Do not claim actual listening without listening. Required-check enforcement is an owner-controlled branch rule; CI alone does not block merging.

## Historical appendices (not current instructions)

---
# Appendix A — PROGRESS.md
# PROGRESS.md

_Last updated: 2026-10-18 (Phase 1 complete)_

## What works

| Area | Status | How verified |
| --- | --- | --- |
| Dev server `http://127.0.0.1:5174` | ✅ running | `curl` → HTTP 200 |
| Landing hero, Explore CTA, disclaimer | ✅ | Playwright smoke + `docs/screenshots/01-landing.png` |
| MapLibre dark map (OpenFreeMap), national framing | ✅ | `02-national-map.png`; style loads without worker errors |
| CARTO fallback on style failure / 9 s timeout | ✅ code path | Exercised during dev when the worker was broken (fallback fired); not re-tested since — **manual check**: block `tiles.openfreemap.org` and reload |
| Custom DOM markers (glow/ring/pulse, type colours), hover tooltip | ✅ | Smoke test asserts tooltip text |
| Click marker → flyTo (zoom 10.6, pitch 52, bearing, drift) + selected marker state | ✅ | Smoke test asserts `.is-selected`; `03-station-panel.png` |
| Station panel: header art, badge, tabs, Back to map, Esc closes | ✅ | Smoke test (title text + Esc hides panel) |
| Narration UI: Play/Pause/Replay/volume/mute, captions, audio gate, no autoplay | ✅ UI | Vitest + smoke (disabled until "Enable audio"); **manual check**: actual speech output in Safari/Chrome |
| Directory: search + type filters, select == marker click | ✅ | Vitest (4 tests) + smoke (`05-directory-and-panel.png`) |
| Region quick-jump chips (National / Gulf / Alaska / PR / Guam) | ✅ | Smoke uses Gulf jump; others **manual check** |
| Responsive: bottom sheet < 861 px | ✅ | Mobile smoke test + `06-mobile-sheet.png` |
| Keyboard: markers/list focusable, Esc closes | ✅ | Markers are `<button>`s; Esc asserted in smoke; full tab-order **manual check** |
| `prefers-reduced-motion` → `jumpTo`, no GSAP tweens | ✅ code path | **manual check** (enable OS setting, reload) |
| Data validation (`npm run validate:data`) | ✅ | 17/17 valid, 0 issues |
| Unit tests (`npm test`) | ✅ 13 passed | Vitest 5 |
| E2E (`npm run test:e2e`) | ✅ 2 passed | Playwright 1.64, Chromium headless |
| Production build (`npm run build`) | ✅ | see build log in final report |

## Stubbed / placeholder

- Narration = browser `speechSynthesis` (temporary; labelled in UI).
- Header images and gallery = procedural SVG / gradient tiles.
- All unit facts, coordinates, history = demo-unverified.

## Fixed during Phase 1 (lessons)

1. MapLibre 6 worker failed under Vite dev (`Worker failed to load`): solved with `setWorkerUrl(import 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url')`.
2. `maplibre-gl.css` (`.maplibregl-map{position:relative}`) overrode the container's absolute positioning → 0-height map. Solved with a higher-specificity selector.
3. GSAP `from()` + React StrictMode double effects left the panel invisible. Solved with `timeline.revert()` on cleanup and completion-based mount tracking.

## Next actions

1. Phase 2 kickoff — see PLANS.md: marker declutter for the New Orleans cluster, intro camera choreography, panel micro-interactions.
2. Owner: start verifying records (SOURCES.md workflow); confirm unit names/cities.
3. Manual checks listed above (fallback style, reduced motion, real TTS voice, Safari).

## Phase 1.5 — Adventure mode (2026-10-18) ✅
| Area | Status | How verified |
| --- | --- | --- |
| "Start Your Adventure" landing with 5-digit ZIP entry (+ "or explore the map") | ✅ | `07-start-adventure.png`; e2e `adventure.spec.ts` |
| Offline ZIP → coords (Census 2020 ZCTA Gazetteer, public domain, `public/data/zips.json`, lazy-loaded) + prefix→state label | ✅ | Vitest `zips.test.ts` (7) |
| Act 1: hometown marker → great-circle arc to Training Center Cape May, live miles counter, 5 GSAP text beats, Skip/Esc | ✅ | `08-journey-arc.png` (superseded by `08-training-countdown.png`); e2e asserts miles + "Cape May" |
| Act 2: "Orders are in" deck — 3 deterministic cards per ZIP (3 distinct types) → arc to chosen unit → StationPanel with "Your first unit" ribbon | ✅ | `09-orders.png`, `10-first-unit.png`; Vitest `orders.test.ts` (8) |
| Reduced motion: static beats + Continue | ✅ | e2e reduced-motion test |
| Mobile: ZIP form + cards fit phone width; top-right HUD clipping fixed | ✅ | e2e mobile test |
| Build / unit / e2e | ✅ | `npm run build` ok · Vitest 39/39 · Playwright 6/6 |

Demo/approx: Cape May coords approximate (demo-unverified); ZIP centroids are city-level; orders are illustrative, not real assignments (labelled in UI).
Known gaps: text beats can collide with map labels on busy regions (add a scrim); arc from the Gulf looks nearly straight at national zoom (expected for the distance).

## Phase 1.6 — Polar Star phase: slot board, ship intro, world patrol, sound (2026-10-19) ✅
| Area | Status | How verified |
| --- | --- | --- |
| Landing mission mosaic (4 blended DVIDS tiles) | ✅ | `07-start-adventure.png`; e2e counts 4 tiles |
| "Orders are in" slot board — reel always lands on USCGC Polar Star, Seattle | ✅ | e2e (two ZIPs) + `09-orders.png` |
| Synthesised audio: ambient bed, reel ticks, lock, ship horn, whoosh, chimes, fanfare + mute chip | ✅ code path | **manual check**: listen in Chrome/Safari (gesture = spin button) |
| Ship intro card (icebreaker hero, missions, gallery, Set sail CTA) | ✅ | `11-ship-intro.png`; e2e asserts content |
| Patrol cinematic: 8 legs, port cards w/ DVIDS photos, Panama lock animation, cumulative miles, homecoming | ✅ | `12-patrol.png`; e2e runs first leg + Esc path |
| New machine phases (shipIntro, patrol) incl. skip paths | ✅ | Vitest 46/46 |
| Antimeridian-safe multi-leg route builder | ✅ | patrol.test.ts continuity test |
| Reduced motion: instant slot, static ship card, port list + Continue | ✅ | e2e reduced-motion test |
| Mobile fit (slot frame, cards, HUD) | ✅ | e2e mobile test |
| Build / unit / e2e | ✅ | build clean · Vitest 46/46 · Playwright 6/6 |

Demo/approx: route, port blurbs and ship facts are illustrative (labelled in UI); owner will supply verified details.
Full diff summary: CHANGES-2026-10-19.md.

# Appendix B — DECISIONS.md
# DECISIONS.md — architecture decision log

Format: date · decision · why · alternatives · consequences.

## 2026-10-18 · MapLibre GL JS over Mapbox GL JS

- **Why:** keyless, no billing, BSD-3 licence, no vendor lock-in, same vector-tile ecosystem. Mapbox requires an access token and metered billing, which violates the "no accounts, no money" constraint.
- **Alternatives:** Mapbox GL (token), Leaflet (raster, no pitch/3D camera), Google Maps (token/billing), deck.gl (overkill for Phase 1).
- **Consequence:** we depend on a free style host; mitigated by automatic fallback (below).

## 2026-10-18 · OpenFreeMap dark style as primary, CARTO Dark Matter as fallback

- **Why:** OpenFreeMap is free for any use, keyless, OSM-based, with a ready dark style. If unreachable the app swaps to CARTO's free dark style (also keyless) after a style error or 9 s timeout.
- **Consequence:** attribution for both is recorded in ASSET_LICENSES.md and rendered in the map's attribution control.

## 2026-10-18 · MapLibre GL JS 6.x (not 5.x)

- **Why:** the task asked for "latest"; 5.x carried a critical XSS advisory (GHSA-jrc7-96c5-q579) flagged by `npm audit`. 6.14 is clean.
- **Consequence:** MapLibre ≥5 loads its web worker as a separate module relative to `import.meta.url`, which fails under Vite's dependency pre-bundling. Fixed by importing `maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url` and calling `setWorkerUrl()` (see `MapView.tsx`).

## 2026-10-18 · Vite 6 + Vitest 5 + React 18

- **Why:** React 18 was the agreed stack; Vite 6 is stable on Node 22; Vitest 3 shipped a critical tinypool RCE advisory, so Vitest 5 (0 vulns) was used instead. All run on Node 22 — the Node 24 install was not needed.

## 2026-10-18 · GSAP for UI animation, MapLibre for camera

- **Why:** GSAP 3.13+ is free for all uses (including commercial) under the Standard "no charge" licence, and gives reliable timelines/staggers for DOM. Map camera motion stays in MapLibre (`flyTo`/`easeTo`/`fitBounds`) because it is integrated with tile loading and gestures.
- **Rule:** both honour `prefers-reduced-motion` (`jumpTo` / zero-duration). GSAP effects use `revert()` on cleanup to survive React StrictMode double-invocation.

## 2026-10-18 · Browser `speechSynthesis` as the temporary narration fallback

- **Why:** zero cost, no keys, works offline, lets us build and test the full narration UI (controls, captions, audio gate) now. Clearly labelled in the UI as temporary.
- **Later:** ElevenLabs (or similar) rendered **server-side** into static audio files committed/served as assets; the client never holds an API key. `narrationAudio` field already exists in the data model for this.

## 2026-10-18 · Plain CSS with custom properties (no Tailwind)

- **Why:** one well-structured stylesheet keeps the design system legible, avoids build-time utility bloat, and makes the cinematic look easy to tune. `color-mix()` is used for type-tinted badges.

## 2026-10-18 · Data as a validated JSON array

- **Why:** adding a unit = appending a record. zod gives runtime + compile-time types; cross-record rules (unique ids, coordinates inside the declared region) catch common mistakes. `contentReviewStatus` makes the "unverified" state explicit in data, not just docs.

## 2026-10-18 · DOM markers instead of symbol layers

- **Why:** DOM markers allow rich CSS (glow, pulse, tooltips), are keyboard-focusable `<button>`s, and work in Playwright without WebGL hit-testing. Fine at 17–100 units; revisit (symbol layer or clustering) if the dataset grows into the hundreds.

## 2026-10-18 · Bundled Inter via `@fontsource/inter` (OFL-1.1)

- **Why:** no Google Fonts hot-linking (privacy + offline). Inter is OFL-licensed and ships as npm package files.

## Adventure mode (2026-10-18)
- **ZIP lookup offline (Census 2020 ZCTA Gazetteer) instead of an API** — public domain, no key, no rate limits, works at demos without network; ~760 KB JSON lazy-loaded only after the user submits a ZIP. Trade-off: centroid (city-level) accuracy, no city names (we derive state from the 3-digit prefix table).
- **Arc as a progressively revealed GeoJSON great-circle line + rAF head marker**, camera eased with MapLibre `easeTo`; GSAP only for overlay text. Keeps map and UI motion on separate clocks and respects reduced-motion via `jumpTo`/static beats.
- **Orders = deterministic hash of the ZIP → 3 units of distinct types.** Reproducible for demos/tests; clearly labelled "illustrative, not real orders".
- All journey copy lives in `src/journey/copy.ts` so the owner can edit the words without touching components.

## 2026-10-19 — World-patrol exception & Polar Star phase (owner-directed)

- **Geography guardrail exception:** AGENTS.md limits the map to CONUS+AK+PR+Guam.
  The owner explicitly directed a world patrol cinematic (Seattle → Pacific →
  Tasmania/NZ → around South America → Panama Canal → Seattle) for the Polar Star
  phase. The exception applies to the patrol overlay only; the explore map and
  unit data remain US-scoped.
- **Slot board replaces the orders deck:** orders always land on USCGC Polar Star
  (owner: "Always simulate the first unit to be USCGC POLAR STAR"). OrdersDeck is
  kept unused for the future A-school choice phase.
- **Synthesised audio engine:** all sound is WebAudio-generated in `src/lib/audio.ts`
  (no assets, no hot-links, autoplay-safe behind the spin gesture, mute persisted).
- **DVIDS imagery bundled:** 16 public-domain DoD photos under `public/media/` with
  `dvids-manifest.json` attribution; recorded in ASSET_LICENSES.md. DVIDS public
  API key is NOT in the client bundle — images were fetched once by script.

# Appendix C — PLANS.md
# PLANS.md

## Phase overview

| Phase | Goal | Status |
| --- | --- | --- |
| 1 | Foundation: running local site, map + markers + panel + directory + narration fallback, data model, tests, docs, private repo | **Done** (2026-10-18) |
| 1.5 | Adventure mode: ZIP → arc to Cape May (miles counter, text beats) → orders deck → first unit | **Done** (2026-10-18) |
| 2 | Cinematic polish: intro camera choreography, marker clustering/declutter, ambient map motion, panel micro-interactions, sound design hooks | Next |
| 3 | Narration audio: pre-rendered studio/TTS audio per unit (server-side generation, never client keys), captions synced to audio timestamps | Planned |
| 4 | Verified content: owner fact-checks every record, fills `sourceUrls`/`lastVerified`, adds licensed imagery with attribution; flips records to `verified` | Planned |
| 5 | Performance & resilience: bundle budget, lazy-loaded panel tabs, offline/cached tiles for demos, error boundaries | Planned |
| 6 | Accessibility & QA: screen-reader pass, focus-trap review, colour-contrast audit, cross-browser/mobile matrix | Planned |
| 7 | Release readiness: hosting decision (still private by default), analytics-free deploy, launch checklist | Planned |

## Phase 1 — detailed

### Delivered

- Vite + React 18 + TS scaffold, Node 22, port 5174 (`--host 127.0.0.1`).
- `src/data/units.json` (17 demo units; 6 on the Louisiana/Gulf coast) + zod schema + `validate:data` script.
- Landing hero (GSAP entrance/exit, disclaimer, stats).
- MapLibre GL 6 with OpenFreeMap dark style, automatic CARTO fallback, Vite-bundled worker.
- Custom DOM markers (glow dot + ring + pulse, type colour), hover tooltip, selected/dimmed states, keyboard-focusable.
- Cinematic camera: `fitBounds` national intro → `flyTo` (zoom 10.6, pitch 52, per-unit bearing) → slow bearing drift → `fitBounds` back. `prefers-reduced-motion` → `jumpTo`.
- Station panel (right drawer / mobile bottom sheet) with procedural SVG header, badge, tabs, Esc/Back-to-map, GSAP slide + stagger.
- Narration via `speechSynthesis` (Play/Pause/Replay/volume/mute, sentence captions, audio-enable gate, no autoplay).
- Directory (search + type filters) and region quick-jump chips.
- Vitest: 13 tests (data validator, Directory, Narration). Playwright: 2 smoke tests + screenshot capture.
- Docs set, `.env.example`, `.gitignore`, Desktop launcher, private GitHub repo.

### Known gaps (carried to Phase 2+)

- No marker clustering: Louisiana markers overlap at national zoom (click "Gulf Coast" to separate).
- Header images and gallery tiles are placeholders.
- Narration voice quality depends on the OS/browser TTS voice.
- Map chrome (attribution/zoom controls) is styled but not custom-designed.
- Focus is not trapped inside the panel (intentional for now — map stays usable).

## Phase 2 — cinematic polish (proposed scope)

1. Intro choreography: landing exit → camera sweep along the Gulf → settle on national view; optional "tour" mode cycling units with narration.
2. Marker declutter: clustering or collision-aware spider-out for the New Orleans group; marker labels at higher zooms.
3. Ambient motion: slow idle drift at national view, subtle parallax on the hero, animated route/sea-lane lines (decorative, labelled as such).
4. Panel: tab-content crossfades, header art parallax, "next/previous unit" navigation, share-less deep links (`#unit=id`).
5. Audio: ambient soundscape toggle (local, licensed), UI tick sounds — all behind the audio switch.
6. Visual QA pass on 1080p, 1440p, iPad, iPhone.

## Owner vision roadmap (recorded 2026-10-18, telegram-v2 session)

Purpose: let an applicant *feel* their first years — comrades, skills, missions —
and understand the Coast Guard's **non-rate program** (choose your rate AFTER ~4
months at a real unit, not blind at a recruiter's desk).

- **Phase A (done 2026-10-19):** boot-camp act → slot board → USCGC Polar Star →
  ship intro → world patrol cinematic → explore.
- **Phase B — Boot camp deep-dive:** inspirational Cape May sequence (water survival,
  firefighting, marching, pugil sticks, challenge course, graduation).
- **Phase C — A-school choice:** reuse OrdersDeck/slot for Yorktown, Petaluma
  (support rates + HS + AST), Elizabeth City (aviation rates minus AST for now),
  Charleston (ME/MLEA); each with travel animation, curriculum beats, duration.
- **Phase D — First unit as PO3:** rate-specific billets across the US, unit/role
  detail animation (most specific of the three).
- **Phase E — Non-rate program explainer:** the "choose your rate with your eyes
  open" message woven through the journey end-cap.

# Appendix D — AGENTS.md
# AGENTS.md — durable rules for anyone (human or AI) working in this repo

## Scope guardrails

- Geography is **CONUS + Alaska + Puerto Rico + Guam**. Do not add world-map features or other territories without an explicit owner decision recorded in DECISIONS.md.
- Keep the disclaimer line on the landing page and in README/index.html meta. Never imply affiliation with or endorsement by the U.S. Coast Guard.
- Spend **no money**, create **no external accounts**, add **no API keys**, and do **no public hosting** unless the owner explicitly asks.

## Demo-data labelling (mandatory)

- Every record in `src/data/units.json` carries `contentReviewStatus`, `sourceUrls`, `lastVerified`. New or edited records default to `"demo-unverified"`, `[]`, `null`.
- Only the owner flips a record to `"verified"`, and only with at least one public `sourceUrls` entry and a `lastVerified` date. Log the source in SOURCES.md.
- Do not write dramatic or specific historical claims into placeholder text. Neutral, short, labelled "Demo".
- `npm run validate:data` must pass before every commit that touches data.

## Secrets & security

- Nothing secret ever enters the client bundle. Only `VITE_*` variables are exposed to the browser; anything sensitive (e.g. a future `ELEVENLABS_API_KEY`) is server-side only and lives in `.env*` files that are git-ignored.
- `.env.example` lists placeholder **names** only. Never commit `.env`, `.env.local`, tokens, or credentials.
- See SECURITY.md for data sourcing guidelines and handling of official insignia.

## Ports & processes

- Dev server: `127.0.0.1:5174` (`npm run dev`). Preview: `5175`.
- **Port 4173 belongs to another app on this machine. Never bind to it or kill its process.**
- Do not touch other projects on the Mac mini.

## Engineering conventions

- Stack is fixed: Vite + React 18 + TypeScript, MapLibre GL JS, GSAP, plain CSS with custom properties (no Tailwind), Vitest, Playwright. Changes to the stack go through DECISIONS.md.
- Map camera animations use MapLibre (`flyTo`/`easeTo`/`fitBounds`); GSAP is for DOM/UI only. Both must honour `prefers-reduced-motion` via `src/lib/motion.ts` (`jumpTo` / instant).
- No hot-linked fonts, images, or scripts. Bundle assets and record their licenses in ASSET_LICENSES.md.
- Keep `npm run build`, `npm test`, and `npm run test:e2e` green. Add a test when you add a behaviour.
- GSAP + React StrictMode: clean up tweens with `revert()` (not `kill()`) so `from()` values don't leak between double-invoked effects.
- Do not use or imply official USCG endorsement. Maintain the disclaimer on the landing page and in docs.

## Documentation update rule

When you change behaviour, update the matching doc in the same commit:

| Change | Update |
| --- | --- |
| Feature works / verified | PROGRESS.md |
| Stack or architectural choice | DECISIONS.md |
| Phase scope or ordering | PLANS.md |
| New dependency / asset | ASSET_LICENSES.md |
| Data record verified | SOURCES.md |
| Security or data sourcing change | SECURITY.md |

Commits touching data must also pass `npm run validate:data`.
