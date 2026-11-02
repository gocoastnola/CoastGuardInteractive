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

## 2026-10-20 — Date-first landing ("Pick your basic training date")

- **Landing asks for a ship date, not a ZIP code.** Owner: "I want the first page to
  be 'pick your basic training date' instead of the zip code." The picker shows the
  next 8 Tuesdays ≥ 14 days out (illustrative; SOURCES.md) as tappable cards plus a
  native `<input type="date">` fallback. State carries `shipDate` (ISO) and the
  phase is `dateEntry` (was `zipEntry`); `START` replaced `SUBMIT_ZIP`.
- **Act 1 = "Report to Cape May" countdown.** With no hometown there is no arc; the
  camera starts on the national view and makes one slow flyTo into Training Center
  Cape May while a DaysCounter ticks today → ship date, then a Week 1 → Week 8 bar
  fills under five beats (`ACT1_BEATS`, graduation = ship date + 8 weeks). It
  dispatches the same `ACT1_DONE` / `SKIP_ACT` as before, so the slot board and
  every later phase are unchanged. Every later leg already originated at Cape May,
  so nothing downstream needed a `home` fallback.
- **ZIP code retained but unused.** `ZipEntry.tsx`, `journey/zips.ts`,
  `public/data/zips.json`, `zips.test.ts`, the ZIP-era `ACT1_ZIP_BEATS`/`ACT1_ARC`
  constants and the `act === 1` arc branch of `JourneyOverlay` stay in the repo for
  a possible optional "hometown" step later (e.g. an arc from home to Cape May after
  the date is picked). Nothing was deleted.
