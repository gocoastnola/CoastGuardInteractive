# Project Brief — CoastGuard Interactive

## Vision

A cinematic, explorable map of U.S. Coast Guard units. Visitors land on a dark nautical hero, step into a 3D-tilted map, and fly from unit to unit — each with a narrated story, mission profile, history and gallery. The feel should be closer to a documentary title sequence than a GIS tool.

Owner: Head-Honcho. Built as an **independent educational demonstration** — not affiliated with or endorsed by the U.S. Coast Guard.

## Scope (fixed)

- **Geography:** continental USA + Alaska + Puerto Rico + Guam only. No world map. Default view frames CONUS; quick-jump chips for Gulf Coast / Alaska / Puerto Rico / Guam.
- **Priority:** design and interaction first. Factual content is placeholder until the owner fact-checks it. Every data record is tagged `contentReviewStatus: "demo-unverified"` with `sourceUrls: []` and `lastVerified: null`.
- **Cost / accounts:** zero. No paid services, no public hosting, no external accounts, no API keys. Keyless map tiles (OpenFreeMap; CARTO fallback).
- **Content ethics:** no invented history or dramatic claims; short neutral placeholder text clearly labelled as demo.

## Phase 1 deliverable (this repo)

A running local website with:

1. Landing hero with "Explore the Map" and the disclaimer line.
2. MapLibre dark map with custom glowing DOM markers coloured by unit type; hover tooltip; click → cinematic `flyTo` (zoom ~10.6, pitch 52°, per-unit bearing, slow bearing drift).
3. Station panel (GSAP slide-in; bottom sheet on mobile) with placeholder header art, type badge, tabs: Overview · Missions · History · Gallery · Narration. Narration uses browser `speechSynthesis` as a clearly labelled temporary fallback, with captions; never autoplays.
4. Directory: search (name/city/type) + unit-type filters; selecting an item == clicking its marker.
5. Responsive + keyboard accessible (focusable markers/list items, Esc closes) + `prefers-reduced-motion` honoured (instant camera, no tweens).
6. Validated data model (`units.json` + zod schema + `npm run validate:data`).
7. Docs, unit tests, Playwright smoke test, private GitHub repo.

## Audience

Coast Guard members and families, maritime enthusiasts, students, and Coast Guard recruiting (the target customer).

## Later phases (summary)

Cinematic polish → real narration audio → verified content & sources → performance/offline → accessibility audit → optional server-side features → release review. Details in PLANS.md.
