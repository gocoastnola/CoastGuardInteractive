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


## 2026-11-07 scenic adventure refresh (externally hosted)

The following destination images are hosted by Wikimedia Commons and rendered via its Special:FilePath redirect, not copied into this repository. Copyright and attribution remain with their respective creators. Follow the linked file pages for author, license, and attribution requirements. These images depict destinations, not a verified Polar Star itinerary or specific liberty events.

| Adventure scene | Wikimedia Commons image / attribution page |
|---|---|
| Honolulu | [Panorama of Honolulu-Waikiki-Diamond Head](https://commons.wikimedia.org/wiki/File:Panorama_of_Honolulu-Waikiki-Diamond_Head_(16773142068).jpg) |
| Hobart | [Mt Wellington looking down on Hobart, Tasmania](https://commons.wikimedia.org/wiki/File:Mt_Wellington_looking_down_on_Hobart,_Tasmania.jpg) |
| Wellington | [Wellington Port from Mt Vic](https://commons.wikimedia.org/wiki/File:Wellington_Port_from_Mt_Vic.jpg) |
| Punta Arenas | [Magellanic Penguins, Isla Magdalena](https://commons.wikimedia.org/wiki/File:Magellanic_Penguins,_Isla_Magdalena.jpg) |
| Cape Horn | [CapeHorn](https://commons.wikimedia.org/wiki/File:CapeHorn.jpg) |
| Rio | [Rio skyline and Cristo Redentor from Sugarloaf Mountain](https://commons.wikimedia.org/wiki/File:Rio_skyline_and_Cristo_Redentor_from_Sugarloaf_Mountain,_Brazil.jpg) |
| Panama Canal | [Miraflores Locks, Panama Canal, Panama](https://commons.wikimedia.org/wiki/File:Miraflores_Locks,_Panama_Canal,_Panama.jpg) |
| Seattle homecoming | [The Seattle Skyline](https://commons.wikimedia.org/wiki/File:The_Seattle_Skyline_(52802453072).jpg) |
| Polar Star gallery (Antarctic wildlife) | [Emperor penguins](https://commons.wikimedia.org/wiki/File:Emperor_penguins.jpg) — NSF public domain |
| Boot camp formation | [Coast Guard recruits marching in Cape May](https://commons.wikimedia.org/wiki/File:U.S._Coast_Guard_recruits_assigned_to_Company_Quebec_188_march_during_Cadence_Contest_2013_at_Training_Center_Cape_May_in_Cape_May,_N.J.,_Sept_130906-G-WA946-323.jpg) — USCG public domain |
| Boot camp pool | [Survival Float B-204](https://www.dvidshub.net/image/7912769) — USCG public domain |
| Boot camp pugil sticks | [Coast Guard recruits training with pugil sticks](https://commons.wikimedia.org/wiki/File:U.S._Coast_Guard_recruits_use_pugil_sticks_during_training_at_Coast_Guard_Training_Center_Cape_May_in_Cape_May,_N.J.,_Aug._1,_2013_130801-G-WA946-704.jpg) — USCG public domain |
| Boot camp confidence course | [Confidence Course](https://www.dvidshub.net/image/1121174) — USCG public domain |

The destination photos are **not all public domain**; Commons file pages contain the relevant Creative Commons licenses, including attribution/share-alike conditions. Before official distribution, review each license and add an accessible on-page photo credits panel. Remote photos require network access; the patrol scene has a bundled fallback if a Commons image fails to load.
