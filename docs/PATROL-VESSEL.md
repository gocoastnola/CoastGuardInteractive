# Miniature Polar Star patrol marker

The owner requested a small red icebreaker, with the feel of a miniature toy Polar Star, riding the leading tip of the gold voyage line while that connecting line remains visible. This revision starts from main `ce5f4c5916dd5f199bc6408fa96fb90c99e2449b` on `codex/polar-star-route-marker-20261117-223000Z`.

## Visible behavior

A compact red-hulled ship replaces the patrol's small route-head dot. The original project-authored SVG has a white bridge, two buff stacks, dark windows and mast, and a broad raised bow. It is an illustration rather than a photograph and carries no Hot Wheels logo or official seal. The bundled transparent asset is `public/media/polar-star-mini.svg` (160×112 viewBox, 4,200 bytes); its usage is recorded in [ASSET_LICENSES.md](../ASSET_LICENSES.md).

The gold cumulative route remains connected beneath the vessel. A native MapLibre Marker receives the exact head returned by the same `arcPrefix` calculation that draws the visible line; the marker does not run a separate voyage clock or route. Native projection and globe occlusion keep it tied to the existing spherical map. It faces the projected direction of travel by flipping horizontally and tilting by at most 14°, keeping the toy upright. A small wake and gentle one-pixel bob support the miniature effect; reduced motion disables the bob and retains the existing static itinerary.

The marker is decorative and does not intercept map or gallery controls. Its asset URL uses the existing project-subpath helper, and a local CSS hull is available if the image fails. Marker and move-listener cleanup follow patrol exit and map disposal.

While attaching the vessel, source review found that patrol progress counted the first route point as an extra segment. `PatrolOverlay.tsx` now counts `points.length - 1` for every leg, matching `arcPrefix`. Port-call progress therefore reaches the actual port coordinate rather than a point just beyond it. Sea waypoints and route coordinates are retained.

The four-photo ZIP opening, training, surprise orders, ship introduction, all nine arrivals, touch-and-go holds, completed-patrol overview, galleries, music and map engine remain as established in the [published pacing baseline](PATROL-PACING.md). The route and assignment remain illustrative demo content.

## Verification record

Local unit, production-build and data checks pass on Node 22.23.5 / npm 11.9.0. Browser and rendered verification are in progress. Earlier reports and PRs document their own historical builds and do not certify this vessel revision.

| Check | Status | Evidence / limits |
| --- | --- | --- |
| SVG render and small-size inspection | PASS | Local Inkscape PNG renders inspected at 640px and 58px wide; red hull, white bridge and buff stacks remain distinct |
| Unit tests | PASS | 96 tests in 14 files, including seven new tangent/orientation tests and extended reduced-motion mount/unmount assertions |
| Production-subpath build | PASS | `npm run build -- --base=/CoastGuardInteractive/`; browser asset-path verification follows below |
| Demo-data validation | PASS | Existing validator through `node --import tsx scripts/validate-data.ts`: 18 records, all unverified; no unit data edits |
| Browser journey, route-head position and cleanup | PENDING | Check desktop/phone, travel/port calls, gallery pause, recap, exit and reduced motion |
| Real-resource visual evidence | PENDING | Record the final candidate's rendered vessel and gold connecting line |
| Merge / deployment / hosted checks | NOT RUN | No new explicit publication approval is recorded for this revision |
| Physical-device / subjective-listening checks | NOT RUN | Browser emulation is not phone hardware; soundtrack is unchanged |

No dependency, account, key or paid service is added. The owner's instruction to skip further recovery checks remains in effect; existing tags, bundles, backups and the separate benchmark are untouched. The current instruction authorizes implementing and reviewing the ship marker; prior publication approvals apply to their recorded revisions.
