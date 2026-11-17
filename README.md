# CoastGuard Interactive (demo)

An existing ZIP-first recruiting journey: hometown → Training Center Cape May → eight-week training and graduation → illustrative USCGC Polar Star assignment → Antarctic patrol → map exploration. The exploration directory covers continental U.S., Alaska, Puerto Rico and Guam; the owner-directed patrol is a world-route exception.

> **Independent educational demonstration. Not affiliated with or endorsed by the U.S. Coast Guard. Demo data pending verification.**

All unit content in this build is placeholder (`contentReviewStatus: "demo-unverified"`). See [SOURCES.md](SOURCES.md).

## Current patrol vessel revision

This revision uses a single native 3D globe, broad leg-by-leg orientation and a compact destination-photo dock. Tap **Details** for full photos, text and credits; the voyage pauses while the drawer is open. The original ZIP opening, training and all nine voyage arrivals remain. Primary music is the bundled **Vanguard — Scott Buckley**, licensed under **CC BY 4.0** and attributed in the information control. Authored fallback music and reveal/arrival cues need no paid service, account or API key.

The latest refinement adds an original miniature red Polar Star illustration at the leading tip of the gold patrol line. The native map marker follows the same route-head calculation, stays upright as it turns, and has a gentle bob that is disabled for reduced motion. The connecting line remains. See [vessel scope and verification](docs/PATROL-VESSEL.md); application checks for this branch are pending.

The published pacing baseline uses brief touch-and-go port calls, then a rotating full-patrol overview after Seattle. Choose any visited stop for photographs, or **Explore the map** when ready. See [pacing and final-overview verification](docs/PATROL-PACING.md) for that prior revision.

The earlier [globe/audio report](docs/GLOBE-AUDIO-REVISION.md), [genuine before/after evidence](docs/evidence/globe-audio/README.md) and [PR #7](https://github.com/gocoastnola/CoastGuardInteractive/pull/7) document the published globe baseline. Its test counts are historical evidence, not certification of later changes. Physical-device performance and subjective listening remain untested.

## Quick start

Requires **Node.js 22** and npm. Check `node --version` before installing; the runtime on another computer may differ. No API keys, accounts or paid services are needed.

```bash
npm ci
npm run dev          # → http://127.0.0.1:5174
```

The original Mac checkout also used a Desktop launcher; that machine-specific file is not part of this repository.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on `127.0.0.1:5174` (port 4173 belongs to another app — never use it) |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Serve the production build on `127.0.0.1:5175` |
| `npm run validate:data` | Validate `src/data/units.json` (schema, unique ids, coords inside region) |
| `npm test` | Vitest unit tests (data validator, Directory, Narration) |
| `npm run test:e2e` | Playwright acceptance tests for the ZIP-first journey and exploration |
| `npm run typecheck` | `tsc -b` only |

First-time Playwright setup: `npx playwright install chromium` (local download, free). On Linux, browser system dependencies may require `npx playwright install --with-deps chromium`. Browser emulation is not real-device testing.

## Project layout

```
src/
  App.tsx                 journey state, selected unit, directory, narration gate
  components/
    Adventure/ZipEntry.tsx live ZIP-first landing (GSAP entrance/exit)
    MapView.tsx           MapLibre map, DOM markers, flyTo/jumpTo camera, style fallback
    StationPanel.tsx      slide-in / bottom-sheet detail panel with tabs
    Narration.tsx         Play/Pause/Replay/volume/mute + captions (browser TTS fallback)
    Directory.tsx         searchable, filterable unit list
    Hud.tsx               top bar + region quick-jump chips
    HeaderArt.tsx         procedural SVG header placeholder
  data/
    schema.ts             zod schema + cross-record validation
    units.json            THE data file — append a record to add a unit
  lib/                    camera framing, unit helpers, reduced-motion helpers
  styles/global.css       design tokens + all component styles
scripts/validate-data.ts  `npm run validate:data`
e2e/                     ZIP-first journey, responsive, recovery and exploration tests
docs/screenshots/         historical screenshots; current verification evidence is separate
```

## Adding a unit

Append an object to `src/data/units.json` matching the `Unit` type in `src/data/schema.ts`, then run `npm run validate:data`. New records **must** carry `contentReviewStatus: "demo-unverified"`, `sourceUrls: []`, `lastVerified: null` until the owner verifies them against public sources.

## Map tiles

Keyless vector tiles from [OpenFreeMap](https://openfreemap.org) (`https://tiles.openfreemap.org/styles/dark`). If that host is unreachable the app falls back automatically to CARTO Dark Matter. Override with `VITE_MAP_STYLE_URL` in `.env.local` (see `.env.example`). Attribution details in [ASSET_LICENSES.md](ASSET_LICENSES.md).

## More docs

[PROJECT_BRIEF.md](PROJECT_BRIEF.md) · [PLANS.md](PLANS.md) · [PROGRESS.md](PROGRESS.md) · [DECISIONS.md](DECISIONS.md) · [AGENTS.md](AGENTS.md) · [SECURITY.md](SECURITY.md) · [SOURCES.md](SOURCES.md) · [ASSET_LICENSES.md](ASSET_LICENSES.md)

## ZIP data

`public/data/zips.json` is generated from the U.S. Census 2020 ZCTA Gazetteer (public domain) by `npm run build:zips` (see `scripts/build-zips.ts`). The **live landing is ZIP entry**, and the table is loaded after submission. Coordinates are approximate ZIP-area centroids; displayed journey distances are illustrative, not driving distances or guaranteed travel. The retained `DateEntry.tsx`, date helpers and internal `dateEntry` phase name are historical implementation details, not a product decision to restore date selection.

## Current journey and media

ZIP entry is final. The journey includes hometown travel before training, weeks 1–8 and graduation, an illustrative assignment to Polar Star, exterior ship photography, then Seattle → Honolulu → Hobart → Wellington → McMurdo Station → Punta Arenas (Patagonia) → Cape Horn → Rio → Panama Canal → Seattle. McMurdo precedes Patagonia. A broad native globe follows each leg. Cumulative route data and the visited-stop rail remain; the globe naturally occludes far-hemisphere sections rather than repeating flat world copies.

The bundled Vanguard recording is streamed through one HTML audio element into the existing single WebAudio context after a user gesture, starting at its 45-second cue. The authored fallback score and nautical sound effects cover unavailable recording playback; an orders rise/reveal replaces repetitive row clicks. See [music attribution](public/media/music/ATTRIBUTION.txt) and [ASSET_LICENSES.md](ASSET_LICENSES.md) for the official track/license sources. No listening assessment is claimed by the automated checks. They currently have no journey-wide mute control; the exploration audio gate controls narration. Accessibility changes to that product behavior require owner approval rather than an unrelated cleanup. Narration still uses browser `speechSynthesis`.

Remote Wikimedia and DVIDS photographs and keyless map hosts require network access. Git preserves bundled assets and source URLs, not external service availability or future image contents. Source and usage records are in [ASSET_LICENSES.md](ASSET_LICENSES.md). Unit facts, route details and assignments remain demo/unverified.

## Recovery and validation

See [docs/RECOVERY.md](docs/RECOVERY.md) for the immutable original recovery tag, baseline SHA, portable-bundle limits and recovery-through-review instructions. [PROGRESS.md](PROGRESS.md) separates current verification from historical reports. [docs/ACCEPTANCE.md](docs/ACCEPTANCE.md) maps the required behaviors to deterministic, live-resource and manual checks; [docs/VERIFICATION.md](docs/VERIFICATION.md) records the measured results.

The existing Pages workflow validates pull requests without deploying them. Deployment remains restricted to reviewed main/master pushes or manual runs on those branches. A workflow alone does not enforce required status checks or prevent merging: the owner must configure branch rules if that enforcement is desired. On 2026-11-17 the owner explicitly approved merging PR #7 and deploying it through this existing workflow, resolving the earlier publication hold. Its complete application checks passed; [PR #7](https://github.com/gocoastnola/CoastGuardInteractive/pull/7) records final deployment and hosted verification. Preserve the frozen benchmark and recovery tags.
