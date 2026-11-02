# ASSET_LICENSES.md

Every third-party library, font, tile source and asset used by the app, with its licence. Update when adding a dependency or asset.

## Runtime libraries (shipped in the bundle)

| Package | Version | Licence | Notes |
| --- | --- | --- | --- |
| react, react-dom | 18.3.1 | MIT | |
| maplibre-gl | 6.14.0 | BSD-3-Clause | Includes its CSS. |
| gsap | 3.15.0 | GSAP Standard "no charge" licence (https://gsap.com/standard-license) | Free for all uses incl. commercial since v3.13 (Webflow). |
| zod | 3.25.76 | MIT | |
| @fontsource/inter | 5.3.0 | SIL Open Font License 1.1 | Inter typeface by Rasmus Andersson; bundled locally, not hot-linked. |

## Dev / test tooling (not shipped)

| Package | Version | Licence |
| --- | --- | --- |
| vite | 6.4.4 | MIT |
| @vitejs/plugin-react | 4.x | MIT |
| typescript | 5.7.3 | Apache-2.0 |
| vitest | 5.0.5 | MIT |
| @testing-library/react, jest-dom | 16.x / 6.x | MIT |
| jsdom | 26.1.0 | MIT |
| @playwright/test | 1.64.1 | Apache-2.0 (Chromium binary downloaded locally; BSD-style licences) |
| tsx | 4.23.15 | MIT |

## Map tiles & styles (loaded at runtime, keyless)

| Source | Use | Licence / attribution requirement |
| --- | --- | --- |
| **OpenFreeMap** — `https://tiles.openfreemap.org/styles/dark` (primary) | Vector tiles + style | Free for any use, no key. Tiles derived from OpenStreetMap data (ODbL) via OpenMapTiles (BSD/CC-BY). Attribution rendered in-map: "OpenFreeMap © OpenMapTiles Data from OpenStreetMap". |
| **CARTO Dark Matter** — `https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json` (fallback only) | Vector tiles + style | CARTO free basemaps; requires "© CARTO" + "© OpenStreetMap contributors" attribution, which the style supplies and the attribution control shows. Used only if OpenFreeMap fails to load. |
| OpenStreetMap data | Underlying data for both | ODbL 1.0 — https://www.openstreetmap.org/copyright |

## Project-authored assets

| Asset | Licence |
| --- | --- |
| `public/favicon.svg`, inline SVG header art, icons in `src/components/Icons.tsx`, landing artwork | Created for this project; owned by the project owner. |
| Unit text, narration scripts | Placeholder demo text authored for this project; to be replaced/verified (SOURCES.md). |

No photographs or external images are included in Phase 1. When imagery is added, record `src`, `alt`, `license`, `attribution` in the unit's `images[]` entry **and** here.

## Data
| Asset | Source | License | Use |
| --- | --- | --- | --- |
| `public/data/zips.json` (ZCTA centroids) | U.S. Census Bureau, 2020 Gazetteer Files — ZIP Code Tabulation Areas (`2020_Gaz_zcta_national.zip`) | Public domain (U.S. Government work) | Built by `scripts/build-zips.ts`; no attribution required, credited on the landing page anyway |

## DVIDS photography (added 2026-10-19)

16 photographs under `public/media/` (mission mosaic tiles, Polar Star ship/gallery,
patrol port calls). Source: DVIDS (Defense Visual Information Distribution Service),
U.S. government works — public domain. Per-file DVIDS asset ids, titles and credits:
`public/media/dvids-manifest.json`. DVIDS asks for courtesy attribution; port cards
and the manifest preserve unit/photographer credits. No API key ships in the bundle.
