# PROGRESS.md

_Current verification pass: 2026-11-17; historical reports retained below._

## Current stabilization status

ZIP-first is the current product decision. The exact original recovery tag is remotely verified; see [docs/RECOVERY.md](docs/RECOVERY.md). The separate repair branch starts from freshly fetched main `013fff722014729f4e044b0ce4060dbdfc3bbd57`. No major redesign, merge or deployment is authorized.

Baseline measured on Node.js **22.23.5**, npm **11.9.0** before application behavior changes:

| Check | Baseline result | Scope / limit |
| --- | --- | --- |
| Locked dependency install (`npm ci`) | PASS | Existing lockfile, no broad dependency upgrade |
| Production build | PASS | TypeScript + Vite; runtime checks remain separate |
| Unit tests | PASS — 55 tests, 8 files | Does not verify rendered UI or actual listening |
| Data validation | PASS — 18 records | All 18 remain demo-unverified |
| Existing browser suite | FAIL — 1 passed, 5 failed (6 total) | All five failing tests expected the superseded date-first headline/cards/controls; the current landing is ZIP entry |

A normal-timing live Chromium desktop run traversed the full story and all nine patrol arrivals to exploration in **117.999 seconds**. This is rendered-browser evidence, not a real-device check or an actual listening assessment. Its console/network observations are retained in the delivery evidence; remote-image rate limits and map request cancellations must be classified separately from stale date-picker assertions.

Baseline inspection also confirmed a hidden training-photo state in reduced motion and landscape ship-layout clipping. These are genuine defects to repair and compare at the same viewport; the outdated tests do not excuse them.

Final repair verification is recorded in [docs/VERIFICATION.md](docs/VERIFICATION.md), with the acceptance map in [docs/ACCEPTANCE.md](docs/ACCEPTANCE.md). Historical test counts below do not certify the repaired branch. Distinguish deterministic browser tests (fixtures), rendered live external-resource checks, emulated viewports, WebKit availability, actual listening and physical-device testing.

Current source facts: ZIP → hometown travel → training/graduation → illustrative Polar Star orders → ship intro → full nine-leg patrol, including McMurdo before Patagonia → exploration. Unit data has 18 records; all remain demo-unverified. Training/ports mix bundled and remote authentic photography; the existing score/SFX are synthesized WebAudio. These source observations are not claims of runtime or listening success.

## Historical verification archive

The sections below record earlier phases, including the superseded date-first product. Historical “What works” and checkmarks refer to those earlier reports. Date-picker expectations must not be restored to make old tests pass.

## Historical Phase 1 — what worked

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

## Phase 1.7 — Historical date-first landing (2026-10-20; superseded)
| Area | Status | How verified |
| --- | --- | --- |
| "Pick your basic training date" landing: 8 Tuesday ship-date cards (≥ 14 days out), native date fallback, Begin (Enter works), arrow-key roving, autofocus first card, "or explore the map", photo wall, DEMO badge, disclaimer | ✅ | `07-start-adventure.png`; e2e asserts 8 cards, Tuesdays, ≥14 days, focus, fallback |
| Machine: `dateEntry` phase, `shipDate` state, `START` action (replaces `SUBMIT_ZIP`/`zipEntry`) | ✅ | Vitest `orders.test.ts` reducer tests (10) |
| `journey/dates.ts` (next-8-Tuesdays, gradDate +56 d, local-time ISO helpers) | ✅ | Vitest `dates.test.ts` (7) |
| Act 1 "Report to Cape May": national view → slow flyTo Cape May, DaysCounter (Ships in N days · Tue, Nov 3) → Week 1→8 bar, 5 beats, ~12 s, Esc advances silently, reduced-motion static + Continue | ✅ | `08-training-countdown.png`; e2e asserts "Ships in", "Cape May", "Week" |
| Later phases (slot, act 2, ship intro, patrol, explore panel) unchanged | ✅ | full-journey e2e + mobile + reduced-motion still pass |
| ZIP landing retained, unused (DECISIONS.md) | ✅ | `zips.test.ts` still runs |
| Build / unit / e2e | ✅ | build clean · Vitest 55/55 · Playwright 6/6 |

Demo/approx: ship dates and the 8-week length are illustrative (SOURCES.md).
