# DECISIONS.md — architecture decision log

Format: date · decision · why · alternatives · consequences.

## 2026-11-17 · Miniature red icebreaker at the patrol route head

- The owner requested a small toy-like red Polar Star at the leading tip of the gold voyage line, with the connecting line retained. Use an original project-authored SVG, without a Hot Wheels logo or official seal; it is an illustrative miniature rather than a photograph.
- Keep MapLibre and use one native Marker at the exact head returned by the existing `arcPrefix` call. This shares the visible route's geometry and progress and follows native globe projection/occlusion without another voyage clock or engine.
- Face projected travel by horizontal flip and limited ±14° tilt so the vessel stays upright. Keep the wake and bob subtle, disable bob for reduced motion, and preserve the static itinerary. The decorative marker does not intercept interaction and is removed with its listeners on exit.
- Count segments as `points.length - 1` for every leg, matching `arcPrefix`; counting the initial point again had placed early port-call heads beyond the destination. Keep the route coordinates, story, port holds, overview, galleries and audio unchanged.
- Work begins at main `ce5f4c5916dd5f199bc6408fa96fb90c99e2449b` on `codex/polar-star-route-marker-20261117-223000Z`. No dependency or paid service is added. Verification is pending in [docs/PATROL-VESSEL.md](docs/PATROL-VESSEL.md). The owner skipped further recovery checks; existing recovery references are untouched. This request authorizes implementation; no new explicit merge/deploy approval is recorded.

## 2026-11-17 · Faster calls and a completed-patrol globe overview

- Owner: “Please speed up the port calls just a bit. It should touch and go … until back to Seattle and then a rotating view of everywhere you went encompassing the entire patrol.”
- Use brief port holds (ordinary 1.4s, McMurdo 2.4s, Panama 1.8s, Seattle 2.2s). These supersede the previous hold-preservation rule; preserve the actual destinations, order, sea route, imagery, credits and illustrative mileage.
- After Seattle, retain the full cumulative route and turn the native globe through all longitudes. Keep the completed overview until Explore or Escape, with all nine stops available for paused photo review. Reduced motion uses the static itinerary.
- Use existing MapLibre camera easing in bounded longitude quarter turns, with cleanup before native stop events. Keep the current globe engine, atmosphere, audio, four-photo ZIP opening and complete pre-patrol story.
- The owner explicitly requested skipping further recovery checks. Do not create or verify additional recovery tags, bundles or backup copies for this revision; leave existing references and the separately hosted benchmark untouched.

## 2026-11-17 · Owner-requested spherical globe and motivational audio revision

- The owner rejected the preceding subtle restyling and its repeated Mercator worlds, oversized port photographs and ambient/click-heavy audio. The current instruction explicitly calls for one real globe on an axis, visible voyage progress, moving oceans/clouds, energetic background music and new arrival/orders effects.
- Keep the existing MapLibre 6.14 engine. Its native `vertical-perspective` projection is a real sphere at every zoom, unlike the `globe` alias that blends into Mercator at high zoom. Do not substitute a masked flat map or three repeated worlds for a globe.
- The globe is the primary voyage stage. Port photography becomes a compact contextual dock with an explicitly opened larger gallery. Preserve every original destination, approved image, research caption, cumulative route and approximate mileage. A real sphere occludes its far side; retain the complete route data and visited-stop context while turning the wide globe to follow the active passage.
- Replace the old ambient score with the freely licensed recorded **Vanguard — Scott Buckley (CC BY 4.0)**, cued at 45 seconds and streamed through the existing WebAudio context. Keep the new project-authored rhythmic arrangement as a failure fallback, and replace click-heavy orders/boop cues with coherent arrival/reveal effects. This is the owner's requested audio change; the existing gesture requirement, single context and audio-control policy remain. The recording, official source and license are documented in ASSET_LICENSES.md and credited in the app.
- Preserve the four-corner mission-photo ZIP opening, hometown-to-Cape-May travel, weeks 1–8/graduation, surprise illustrative Polar Star orders and exact voyage order. No Polar Star or Antarctic promotion before the orders reveal.
- The earlier PR #7 merge attempt was rejected by automatic approval review because design approval did not explicitly override the original no-merge/no-deploy brief. On 2026-11-17 at approximately 20:30 UTC, the owner answered **“Yes”** to **“Do you approve merging PR #7 into main and deploying it to your existing GitHub Pages site?”** This explicitly authorizes that merge and the existing Pages deployment. Use the normal reviewed PR and validation pipeline; keep the benchmark and recovery tags unchanged.
- Development begins at freshly fetched main `481c4c98b31451541c6ceae26158b9f08f122571`, on `codex/globe-and-adventure-audio-20261117-162137Z`. The remotely verified annotated baseline tag `pre-codex-baseline-20261117-162137Z` peels to that commit. The original recovery tag still peels to `013fff722014729f4e044b0ce4060dbdfc3bbd57`.


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

## 2026-10-20 — Date-first landing (historical; superseded)

This records the implementation at that time. The 2026-11-17 ZIP-first decision below supersedes its entry-screen and countdown choices. Do not restore date cards from this history.

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


## 2026-11-17 — ZIP-first journey retained; repair scope only (owner-directed)

- **Current product decision:** opening headline remains “Enter your ZIP code and start your journey.” A valid hometown ZIP starts travel to Cape May with approximate mileage, then training weeks 1–8 and graduation. The internal `dateEntry` phase name and retained date helpers do not imply a visible date picker.
- **Preserved story:** illustrative orders always select USCGC Polar Star; exterior ship imagery; full existing patrol including McMurdo before Patagonia; research-support setting, penguins, all other destinations, cumulative route and wide geographic context. The exploration directory remains U.S.-scoped under the existing patrol exception.
- **Preserved audio decision:** retain the existing synthesized score/SFX and browser-gesture initialization behavior. Journey-wide mute/volume or altered autoplay behavior is a separate product/accessibility decision.
- **Authorized now:** recovery verification, narrowly scoped technical repairs, meaningful tests, current documentation and a separate redesign proposal. No major redesign implementation, engine replacement, broad dependency changes, merging or deployment is authorized.
- **Verification rule:** historical test counts are historical evidence. Record actual runtime, baseline failures, final checks and limitations for this branch before claiming success.

## 2026-11-17 — Story-locked visual development (owner-approved)

- The original four-corner mission-photo ZIP opening is locked: preserve its layout, four photographs, ZIP input, and familiar controls. Do not turn it into a single-ship or expedition advertisement. Remove assignment/destination spoilers from supporting text and accessible names while retaining the original mission imagery.
- Preserve hometown travel → Cape May eight-week training → graduation → apparently uncertain assignment reel → Polar Star reveal → report aboard Seattle → full voyage → homecoming/exploration. No ship/destination preview in the opening or pre-reveal map markers.
- Exact illustrative itinerary remains Seattle, Honolulu, Hobart, Wellington, McMurdo, Punta Arenas/Patagonia, Cape Horn passage, Rio, Panama Canal transit, Seattle. No stop removed or reordered.
- Authorized visual work enhances the existing map, color, photograph staging, motion and transitions. Keep MapLibre, the existing route geometry, source data status and original score. No new framework, external account, paid service or deployment.
- The local single-ship opening experiment was rejected and removed from active source. Its screenshots are not the approved opening. Design development branches from the separately tested technical-repair commit; neither PR is merged or deployed by this work.
- Validation may run for a PR targeting the foundation branch; publication remains limited to the existing exact main/master conditions. ZIP entry is not a pending decision.
