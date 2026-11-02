# CoastGuard Interactive (demo)

An interactive, cinematic map of U.S. Coast Guard units — continental U.S., Alaska, Puerto Rico and Guam.

> **Independent educational demonstration. Not affiliated with or endorsed by the U.S. Coast Guard. Demo data pending verification.**

All unit content in this build is placeholder (`contentReviewStatus: "demo-unverified"`). See [SOURCES.md](SOURCES.md).

## Quick start

Requires Node 22 (the default `node` on this machine). No API keys, accounts or paid services.

```bash
npm install
npm run dev          # → http://127.0.0.1:5174
```

Or double-click **`~/Desktop/CoastGuard Interactive.command`** — it starts the dev server if it isn't already listening and opens the browser.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on `127.0.0.1:5174` (port 4173 belongs to another app — never use it) |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Serve the production build on `127.0.0.1:5175` |
| `npm run validate:data` | Validate `src/data/units.json` (schema, unique ids, coords inside region) |
| `npm test` | Vitest unit tests (data validator, Directory, Narration) |
| `npm run test:e2e` | Playwright smoke test (also refreshes `docs/screenshots/`) |
| `npm run typecheck` | `tsc -b` only |

First-time Playwright setup: `npx playwright install chromium` (local download, free).

## Project layout

```
src/
  App.tsx                 state: landing/map, selected unit, directory, audio switch
  components/
    Landing.tsx           full-screen hero (GSAP entrance/exit)
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
e2e/smoke.spec.ts         Playwright smoke test
docs/screenshots/         captured by the e2e test
```

## Adding a unit

Append an object to `src/data/units.json` matching the `Unit` type in `src/data/schema.ts`, then run `npm run validate:data`. New records **must** carry `contentReviewStatus: "demo-unverified"`, `sourceUrls: []`, `lastVerified: null` until the owner verifies them against public sources.

## Map tiles

Keyless vector tiles from [OpenFreeMap](https://openfreemap.org) (`https://tiles.openfreemap.org/styles/dark`). If that host is unreachable the app falls back automatically to CARTO Dark Matter. Override with `VITE_MAP_STYLE_URL` in `.env.local` (see `.env.example`). Attribution details in [ASSET_LICENSES.md](ASSET_LICENSES.md).

## More docs

[PROJECT_BRIEF.md](PROJECT_BRIEF.md) · [PLANS.md](PLANS.md) · [PROGRESS.md](PROGRESS.md) · [DECISIONS.md](DECISIONS.md) · [AGENTS.md](AGENTS.md) · [SECURITY.md](SECURITY.md) · [SOURCES.md](SOURCES.md) · [ASSET_LICENSES.md](ASSET_LICENSES.md)

## ZIP data

`public/data/zips.json` is generated from the U.S. Census 2020 ZCTA Gazetteer (public domain) by `npm run build:zips` (see `scripts/build-zips.ts`). It was lazy-loaded by the original ZIP landing. Since 2026-10-20 the landing is **"Pick your basic training date"** (ship-date cards → Cape May countdown); the ZIP landing (`ZipEntry.tsx`) and this table are retained but unused — see DECISIONS.md.
