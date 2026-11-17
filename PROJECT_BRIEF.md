# Project Brief — CoastGuard Interactive

## Vision

A cinematic, explorable map of U.S. Coast Guard units. Visitors land on a dark nautical hero, step into a 3D-tilted map, and fly from unit to unit — each with a narrated story, mission profile, history and gallery. The feel should be closer to a documentary title sequence than a GIS tool.

Owner: Head-Honcho. Built as an **independent educational demonstration** — not affiliated with or endorsed by the U.S. Coast Guard.

## Scope (fixed)

- **Geography:** the exploration directory covers continental USA + Alaska + Puerto Rico + Guam. The owner-directed Polar Star patrol is the existing world-route exception recorded in DECISIONS.md, including McMurdo before Patagonia. Preserve the wide view and cumulative voyage route.
- **Priority:** design and interaction first. Factual content is placeholder until the owner fact-checks it. Every data record is tagged `contentReviewStatus: "demo-unverified"` with `sourceUrls: []` and `lastVerified: null`.
- **Cost / accounts:** zero. No paid services, new hosting, external accounts or API keys without explicit owner authorization. Existing GitHub Pages hosting is outside this repair task; no deployment is approved. Keyless map tiles use OpenFreeMap with CARTO fallback.
- **Content ethics:** no invented history or dramatic claims; short neutral placeholder text clearly labelled as demo.

## Current applicant journey (owner-confirmed 2026-11-17)

“Enter your ZIP code and start your journey” → approximate hometown travel to Cape May → eight-week training progression and graduation → illustrative USCGC Polar Star assignment → ship introduction → full existing Antarctic patrol with research context and all ports → homecoming and free exploration. The emotional progression is identification, challenge, accomplishment, belonging, adventure and meaningful service. Current work repairs reliability and tests; the cinematic redesign is a proposal requiring separate approval.

## Historical Phase 1 foundation

A running local website with:

1. Landing hero with "Explore the Map" and the disclaimer line.
2. MapLibre dark map with custom glowing DOM markers coloured by unit type; hover tooltip; click → cinematic `flyTo` (zoom ~10.6, pitch 52°, per-unit bearing, slow bearing drift).
3. Station panel (GSAP slide-in; bottom sheet on mobile) with placeholder header art, type badge, tabs: Overview · Missions · History · Gallery · Narration. Narration uses browser `speechSynthesis` as a clearly labelled temporary fallback, with captions; never autoplays.
4. Directory: search (name/city/type) + unit-type filters; selecting an item == clicking its marker.
5. Responsive + keyboard accessible (focusable markers/list items, Esc closes) + `prefers-reduced-motion` honoured (instant camera, no tweens).
6. Validated data model (`units.json` + zod schema + `npm run validate:data`).
7. Docs, unit tests, Playwright browser tests and GitHub repository. Historic visibility/hosting assumptions do not authorize changing repository settings.

## Audience

Coast Guard members and families, maritime enthusiasts, students, and Coast Guard recruiting (the target customer).

## Later phases (summary)

Cinematic polish → real narration audio → verified content & sources → performance/offline → accessibility audit → optional server-side features → release review. Details in PLANS.md.
