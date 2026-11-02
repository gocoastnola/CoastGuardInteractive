# PLANS.md

## Phase overview

| Phase | Goal | Status |
| --- | --- | --- |
| 1 | Foundation: running local site, map + markers + panel + directory + narration fallback, data model, tests, docs, private repo | **Done** (2026-10-18) |
| 1.5 | Adventure mode: ZIP → arc to Cape May (miles counter, text beats) → orders deck → first unit | **Done** (2026-10-18); superseded by 1.7 |
| 1.7 | Date-first landing: pick a basic-training ship date → Act 1 Cape May countdown + Week 1→8 progression (ZIP retained, unused) | **Done** (2026-10-20) |
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

## Ideas queued after the date-first landing (2026-10-20)
- Optional hometown step after the date pick (re-use `ZipEntry` + the arc branch of `JourneyOverlay`).
- Real ship-date calendar: replace `nextShipDates()` with owner-supplied dates once verified (SOURCES.md).
- A-school choice phase (OrdersDeck) still queued.
