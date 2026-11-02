# CoastGuard Interactive — HANDOFF (generated 2026-10-19, refreshed 2026-10-27)

Single-file briefing for anyone (human or AI assistant) picking this project up. Everything below also lives in the repo docs; this is the consolidated version.

## What it is
A cinematic, interactive map website of U.S. Coast Guard units, built to pitch to Coast Guard recruiting. Owner: Head-Honcho. Built with OpenClaw/Claude on a Mac mini.
- Geography: continental USA + Alaska + Puerto Rico + Guam only.
- Priority: design and interaction. All Coast Guard facts are PLACEHOLDER (every record flagged `demo-unverified`) until the owner fact-checks them.
- Independent educational demo; not affiliated with or endorsed by the USCG.

## Current state (done, tested, running)
- Phase 1 foundation + 1.5 adventure + 1.6 Polar Star phase + 1.7 date-first landing are complete.
- Flow (2026-10-20): landing **"Pick your basic training date"** (8 Tuesday ship-date cards ≥ 14 days out, demo schedule, native date fallback, Begin/Enter) → **Act 1 "Report to Cape May"**: camera flies national view → Training Center Cape May while a days counter ticks to the ship date, then a Week 1 → Week 8 bar fills under 5 text beats (graduation = ship date + 8 weeks) → "Orders are in" slot board (always USCGC Polar Star) → arc to Seattle → ship intro card → world patrol cinematic → station panel with "Your first unit" ribbon → free explore. Esc quietly advances any cinematic. The old ZIP landing/hometown arc is retained but unused (DECISIONS.md).
- 17 demo units (6 Gulf Coast). Narration = browser text-to-speech stub. Images = procedural placeholders.
- Tests: build clean · Vitest 55/55 · Playwright 6/6.
- Repo (private): https://github.com/solairstreamline-cyber/CoastGuardInteractive
- Local: ~/Documents/CoastGuardInteractive · `npm install && npm run dev` → http://127.0.0.1:5174 · production build shared via a Cloudflare quick tunnel.
- **Live demo (refreshed 2026-10-27, tested 200 before sending):** https://retrieved-forecast-impression-enrollment.trycloudflare.com — unlisted, no login. Served from the owner's Mac mini by two launch agents (`ai.coastguard.demo.server`, `ai.coastguard.demo.tunnel`). Caveats: it is a Cloudflare quick tunnel, so the URL changes if the tunnel restarts, and it only works while the Mac mini is awake and online. A permanent URL needs either a public repo (GitHub Pages) or a free Cloudflare account with a named tunnel or Pages project.

## Working on it with two assistants
One source of truth: the GitHub repo. Neither assistant edits the other's live copy.
- **OpenAI (ChatGPT / Codex):** connect GitHub once (Settings → Connectors → GitHub → only this repo). Codex works on a cloud copy and opens pull requests. Review and merge those PRs.
- **OpenClaw (Chief Sinbad):** works on the Mac mini checkout, runs the build, hosts the live demo, and pushes commits.
- **Coordination rule:** pull before you start, work on a branch for anything large, and do not work on the same file in both places at the same time. Merge conflicts happen only when both edit the same lines.
- Anyone sharing the demo link should re-check it first; links from quick tunnels can go stale.

## Stack and why
Vite 6 · React 18 · TypeScript · MapLibre GL 6 (keyless OpenFreeMap dark tiles, CARTO fallback — chosen over Mapbox: no key, no billing, no lock-in) · GSAP 3.15 (free for commercial use) · zod · @fontsource/inter · Vitest · Playwright. Node 22. Zero paid services, zero API keys, nothing public except the temporary share tunnel.

## Where things live
- `src/data/units.json` — THE data file; append a record to add a unit (schema in `src/data/schema.ts`; `npm run validate:data`).
- `src/journey/copy.ts` — every line of journey narration text. Edit words here.
- `src/journey/` — state machine (`dateEntry→act1→orders→act2→shipIntro→patrol→explore`), `dates.ts` ship-date helpers, arc/haversine math, ZIP loader (unused), orders picker, Cape May constant (approx coords, demo-unverified).
- `src/components/Adventure/DateEntry.tsx` (landing), `TrainingAct.tsx` + `DaysCounter.tsx` (Act 1). `ZipEntry.tsx`/`MilesCounter.tsx` remain for Act 2 / future hometown step.
- `src/components/Adventure/` — ZipEntry, JourneyOverlay, MilesCounter, OrdersDeck.
- `src/components/` — MapView (markers, flyTo, arc layer), StationPanel, Narration, Directory, Hud.
- `public/data/zips.json` — ZIP centroids (U.S. Census 2020 ZCTA Gazetteer, public domain), built by `npm run build:zips`.
- Docs: README, PROJECT_BRIEF, AGENTS (dev rules), PLANS (phases), PROGRESS, DECISIONS, SOURCES, ASSET_LICENSES, SECURITY, .env.example.

## Known gaps
- New Orleans markers overlap at national zoom (clustering/declutter = Phase 2 #1).
- Journey headline text can sit over map labels in busy regions (needs a scrim).
- Orders are illustrative (hash of ZIP), not real assignments; could be biased toward the recruit's region.
- Cape May coordinates and "eight weeks" need owner confirmation.

## Next phases (from PLANS.md)
2 Cinematic polish (declutter, intro camera sweep, panel micro-animations, ambient sound behind the audio switch) → 3 Real narration audio (pre-rendered, server-side keys only) → 4 Verified content + licensed imagery (DVIDS API planned: public-domain USCG photos with credits) → 5 Content admin → 6 QA/accessibility → 7 Hosting (Cloudflare Pages, unlisted) and release checklist.

## Rules for whoever continues
- Keep the DEMO labelling until the owner verifies a record; never invent history.
- No secrets in client code; never commit .env.
- Don't bind port 4173 (another app on the owner's Mac mini).
- Update the matching doc in the same commit as any behaviour change; keep `npm run build`, `npm test`, `npm run test:e2e` green.

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
