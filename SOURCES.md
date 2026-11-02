# SOURCES.md — content verification ledger

**Status: all 17 records in `src/data/units.json` are `demo-unverified`.** Unit names and cities were chosen because they are commonly known public unit names, but nothing in this build has been checked against an official source. Coordinates are approximate (city-level, `coordsVerified: false`). Mission summaries and history fields are neutral placeholders labelled "Demo".

When the owner verifies a record, add a row here, fill `sourceUrls` and `lastVerified` in the JSON, set `coordsVerified` as appropriate, and change `contentReviewStatus` to `"verified"`.

| Unit id | Field(s) verified | Source URL (public) | Verified by | Date |
| --- | --- | --- | --- | --- |
| _(none yet)_ | | | | |

Rules: public, citable sources only (e.g. official uscg.mil / dcms.uscg.mil pages, Federal Register, published histories). No non-public or internal material. No contact with USCG officials for this project (see SECURITY.md).

## Journey constants (demo-unverified)
| Item | Value used | Status |
| --- | --- | --- |
| Training Center Cape May, Cape May, NJ (only USCG recruit training center) | approx. 38.93, -74.92 | demo-unverified — owner to confirm |
| Recruit training length | "eight weeks" (public knowledge); Act 1 Week 1→8 bar and `gradDate = shipDate + 56 days` (`src/journey/dates.ts`) | demo-unverified — owner to confirm current length |
| Basic-training ship-date schedule (landing picker) | next 8 **Tuesdays ≥ 14 days out**, generated client-side; labelled "Demo schedule — illustrative dates" | demo-unverified — real Cape May class/ship dates NOT checked; owner may supply a real calendar |
| Graduation date shown in Act 1 | ship date + 8 weeks exactly | demo-unverified (derived from the row above) |

## 2026-10-19 — DVIDS image sources (Polar Star phase)

All images in `public/media/` were fetched from the DVIDS public API; the asset id,
title, credit, unit and page URL for each file are recorded in
`public/media/dvids-manifest.json`. Ship facts/port copy remain demo-unverified.
