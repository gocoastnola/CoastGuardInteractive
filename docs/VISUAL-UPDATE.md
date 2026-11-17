# Story-locked visual update — The Long Watch

This document describes the current scoped visual work, not a deployment or a new application. The owner-approved decision is recorded in [DECISIONS.md](../DECISIONS.md), “Story-locked visual development.” Checks without final visual-branch evidence are explicitly **NOT RUN** below. Enter measured results only when the corresponding check is complete. Source inspection and an earlier screenshot do not establish a final PASS.

## Branch, comparison and limits

- Repository: `gocoastnola/CoastGuardInteractive`.
- Visual branch: `codex/long-watch-visual-20261117`.
- Technical-repair foundation: `b37975c2a604d59f0f375c358c796794a4d81458`. Compare the visual changes against that commit to distinguish them from the separately reviewed technical repairs.
- Original recovery remains `013fff722014729f4e044b0ce4060dbdfc3bbd57`, protected by the remotely verified tag in [RECOVERY.md](RECOVERY.md). The visual branch does not replace or move that tag.
- The working branch is separate from `main` and from `Version-before-astra-pro`. No merge, main push, production deployment, release or change to the frozen benchmark is authorized.
- No new framework, map engine, package upgrade, image source, external account, API key, paid service or replacement soundtrack is introduced by this visual update.

## Story and opening are locked

The opening retains the technical foundation’s familiar **four mission photographs**, their four-corner composition, “Enter your ZIP code and start your journey” headline, ZIP form, action and free-explore control. The source for `ZipEntry.tsx` remains the foundation version. The mission photographs remain helicopter operations, rescue, vessel-fire response and icebreaking; it is not a single-ship expedition advertisement.

Supporting copy now ends in **“discover what comes next”** rather than naming the assignment before the reveal. The icebreaking tile’s accessible image description is generic. Opening imagery stays authentic; the caption is not a new factual or operational claim.

The applicant follows the same sequence:

1. ZIP entry.
2. Hometown departure and approximate-mileage travel to Cape May.
3. Eight weeks of training and a distinct graduation conclusion.
4. Assignment-board anticipation and Polar Star reveal.
5. Travel to Seattle and introduction with approved exterior ship photography.
6. Full existing voyage: Honolulu → Hobart → Wellington → **McMurdo Station → Punta Arenas/Patagonia** → Cape Horn passage → Rio → Panama Canal transit → Seattle homecoming.
7. Existing unit panel and map exploration.

There are still **nine patrol arrivals after Seattle departure**. McMurdo precedes Patagonia. No destination, scene, route waypoint, assignment outcome or unit-verification status is changed. The voyage stays illustrative; neither the assignment nor travel is guaranteed. Independent-demo and unverified-content language remains required.

## Implemented presentation changes (source-inspected; final live review pending)

| Area | Source change and intended visible result | Guardrail |
| --- | --- | --- |
| Hometown/Seattle travel | Blue chart framing, clearer pale text and amber/cyan mileage treatment give travel a common chapter language | Keep the actual ZIP journey, camera engine and approximate-distance qualification |
| Ocean chart | Use the existing OpenFreeMap dark style and recolor provider layers toward deep blue water, teal land and pale Antarctic ice; retain provider boundary/waterway detail | Preserve MapLibre geographic data, attribution, existing fallback and route geometry; no replacement globe |
| Voyage route | Amber cumulative track, narrower cyan halo and a smaller current-position accent emphasize the route without a broad glow obscuring geography | Full route and wide view remain intentional; viewport padding reserves actual card space |
| Story markers | Hide exploration-unit controls while the story owns the screen; previous patrol labels become quieter while the current stop stays identifiable | Do not show an assignment/destination preview before its narrative reveal; restore exploration controls afterward |
| Training | Larger approved training photographs, a separate chapter heading and calmer text hierarchy put the photograph and emotional beat in focus | Authentic training/grad images and all eight weeks remain |
| Training timing | The week progression is 10.4 seconds and the graduation hold 4.2 seconds; constants describe the longer scene | This adjusts presentation time, not the represented eight-week training length or real schedules |
| Graduation | Distinct “You earned this moment” heading and warmer color cue conclude training before the assignment scene | No new graduation promise or unsupported real date |
| Assignment board | Ivory dispatch-style reel on the ocean palette; amber result emphasis; illustrative status remains visible | Preserve the apparently uncertain reveal and fixed illustrative Polar Star outcome |
| Ship introduction | Large exterior hero paired with identity and mission text; existing icebreaking/penguin imagery gains supporting captions and the existing hero receives a source link | Do not replace the approved gallery with interiors, close-up personnel, family or baby images |
| Port calls | Numbered cards sit alongside the chart on desktop, below an available chart area on portrait phones, and in a photo/copy split on short landscapes | Preserve every port and its reading time, scientific context, image sources and cumulative geographic context |
| Credits | Provider attribution remains above cinematic overlays; its transparent container ignores pointer events while the actual credit box stays interactive, and scene spacing reserves room for it | Do not hide mandatory map/source credits for a cleaner screenshot |
| Reduced motion | The same chapter style uses static training and a scrollable complete patrol narrative | Essential story and controls must remain readable without timed animation |

The palette and source-layer edits are presentation changes. They do not constitute a claim that a new globe or polar projection has been implemented. An experimental outline of water polygons was removed because tiled/clipped polygon edges can draw a false cyan meridian through the ocean; the current source keeps the provider’s boundary detail and route halo instead. Camera padding now reserves the actual port-card area, and the map allows a minimum zoom of −2 so the wide route can fit phone screens. Actual rendered route visibility must still be verified.

## Genuine mobile chart defect found during live review

The initial complete live-resource runs reached exploration and captured 23 scenes each on desktop and the emulated phone. They did **not** prove the composition correct: the mobile patrol route was being fitted against the full viewport rather than the narrow chart space left above the card, and the McMurdo label collided with the mileage area. That is a visible application defect, not an external-image failure or a harmless screenshot difference.

The source-level correction is deliberately scoped to patrol fitting:

- `FitOptions.absolutePadding` preserves the intended scene insets for MapLibre 6.14 fitting.
- Commit that padding **before** calculating/applying the first fitted camera, so the first port does not inherit the previous scene’s full-viewport Mercator constraint.
- Allow minimum zoom −2 for the small free chart area on a phone; do not alter the full voyage geometry or drop stops.
- Reset the scene padding to zero when leaving the animated patrol so exploration does not inherit its insets.

An intermediate probe moved the McMurdo marker and label out of the mileage area, but its first-port fit was still wrong; the padding pre-commit was added afterward. Do not treat that intermediate probe or the earlier full journey captures as final proof. Final mobile patrol capture now verifies the corrected first-port fit and all nine arrivals through exploration. It also exposed and corrected a separate marker-world-copy mismatch: each arriving marker now uses the terminal point from its existing unwrapped route leg, aligning its displayed world copy with the cumulative track. Route geometry, destinations and order are unchanged. Final desktop camera capture remains pending.

The final 390×844 mobile evidence is in `final-patrol-mobile/camera-observations.json` and the matching actual PNGs:

- At the first Honolulu arrival, zoom is −1.27915 with chart insets top 140, bottom 597, left/right 24. All 49 visible cumulative-line samples fit the free chart rectangle x=24–366, y=140–247 from the first arrival.
- At Hobart, the marker dot lies at x=138–148, aligned with the unwrapped route endpoint around x=142.8 instead of the earlier wrong-world-copy position around x=354.
- At McMurdo, the marker dot lies at x=149–159, y=242–252, and its label at y≈182–226, above the port card (top≈307–309) and mileage readout (top≈687). The root agent inspected the actual final McMurdo screenshot with approved exterior/research imagery and found the earlier collision removed.

Those are measured local-browser positions, not a physical-phone or universal-screen guarantee. The final phone capture contains all nine arrivals, four McMurdo gallery slides and exploration. Earlier full-journey captures remain evidence for the unchanged opening, training, graduation, orders and ship scenes; they are not substituted for final patrol geometry.

## Sound scope

The existing project-generated WebAudio score, ambient sound and effects remain the sound source. No licensed music replacement or new audio asset has been added. The work is limited to coordinating existing cues with the same story.

Two scoped interaction refinements are implemented and covered by the unit/browser checks below; subjective audio quality remains unreviewed:

- Reduced-motion orders now remain **ready** until the applicant activates “Open your orders,” then reveal instantly without a reel animation. The earlier auto-land effect is removed, so static mode no longer deliberately discloses the result on arrival. The existing Escape-to-resolve path remains.
- Ship-introduction activation now unlocks audio and advances the scene without adding its own horn/whoosh. The patrol-start sequence retains its existing cues, avoiding the former duplicate CTA layer without replacing the soundtrack.

Source inspection confirms those two code changes; it does not establish the complete visual/audio experience. A targeted orders regression test was added for concealed reduced-motion assignment. The primary agent reports the targeted orders checks and a final **65-test unit run** passing under Node 22.23.5; the deterministic browser runs described below pass. Final scoped live patrol captures are complete on desktop and phone. **Actual listening is NOT RUN** for this visual branch unless a separate listening check is recorded. Browser playback/instrumentation is not a subjective evaluation of musical quality.

## Responsive and accessibility intent

Portrait and landscape CSS use larger photographs with separate readable copy, reachable controls and space for attribution. Reduced-motion layouts provide intrinsic scrolling rather than inheriting timed-card offsets. Inactive port/gallery credits leave keyboard navigation and pointer targeting while their scenes are hidden.

Deterministic Chromium checks cover 1440×900 desktop, 390×844 mobile portrait, 360×800 narrow portrait, 844×390 landscape and reduced motion. An additional 360×600 portrait McMurdo case sends wheel input to the active caption body, verifies scrolling reaches the end, and checks that inactive cards do not intercept input. These passes do not establish every phone/browser: a viewport is emulation, desktop WebKit is not a physical iPhone, and no real-device performance or accessibility audit is implied.

## Measured build weight

The production build passes under actual Node 22 with base `/CoastGuardInteractive/`. The comparison below uses the same byte/gzip measurement in `build-weight-final.json`, against the technical-repair foundation. It is an asset-size comparison, not a measured mobile download time or a claim of smooth physical-device frame rates. Gzip byte counts are from the comparison tool and need not equal Vite’s rounded size display or a host’s transfer encoding.

| Asset | Foundation bytes / gzip bytes | Visual bytes / gzip bytes | Change |
| --- | --- | --- | --- |
| App CSS | 143,855 / 21,460 | 168,947 / 25,730 | +25,092 raw / +4,270 gzip |
| App JavaScript | 295,706 / 88,430 | 299,530 / 89,635 | +3,824 raw / +1,205 gzip |
| MapLibre JavaScript | 1,056,631 / 286,387 | 1,056,631 / 286,387 | Unchanged |
| MapLibre worker | 508,900 / 146,853 | 508,900 / 146,853 | Unchanged; counted once |
| GSAP JavaScript | 70,462 / 27,625 | 70,462 / 27,625 | Unchanged |

No dependency or lockfile changes are introduced. Fonts, bundled/remote photography, ZIP data, map tiles/glyphs, cache behavior and request timing are outside this small bundle table; do not present its totals as the entire initial download.

## Verification ledger — visual branch only

The technical foundation’s [VERIFICATION.md](VERIFICATION.md) reports the earlier repair pass. Its results do **not** certify this visual branch. The current runs establish **14 distinct Chromium cases across two runs**, not one full 14-case run:

- Development run: **13 passed**, including complete desktop and mobile journeys at normal timing.
- After the final active/inactive-card hit-testing CSS and decorative-legend placement refinement, production-preview run: **5 passed** — the four `@production` cases plus the new `@portrait-scroll` case. Four cases overlap the development set.

The production subset runs the built project subpath; deterministic external media/style fixtures are declared in the tests. **Both of those browser runs preceded the later mobile chart-fit repair described above**; they remain valid stage evidence, not certification of the changed camera. Build and all 65 unit tests were rerun after the final camera-source change and pass. Final mobile camera/marker capture now covers all nine arrivals and exploration; final desktop camera capture is complete too: all nine arrivals, all four McMurdo slides and exploration. The final targeted restart/short-portrait browser result is recorded separately below.

The initial full live-resource capture is separately recorded below, with its genuine layout failure and remaining warnings. Results cite execution artifacts in `/workspace/coastguard-long-watch-evidence/`; the durable final selection is indexed in [docs/evidence/visual/README.md](evidence/visual/README.md) when copied.

| Check | Environment | Result | Evidence | Remaining limitation |
| --- | --- | --- | --- | --- |
| Runtime / locked dependency inputs | Node 22.23.5, npm 11.9.0 | PASS — runtime measured; lockfile unchanged | Primary-agent runtime record; existing locked install reused | No package/dependency input changed; this is not a fresh visual-branch install claim |
| Production build and project subpath | Node 22.23.5; `/CoastGuardInteractive/` | PASS | `build-final.log`; production-preview subset in `e2e-production-final.log` | Local production preview, not a deployment |
| Unit tests | Node 22.23.5 / Vitest | PASS — 65 tests | Primary-agent final unit run; includes concealed reduced-motion orders regression | Does not establish visual, network, listening or real-device success |
| Demo-data validation | Actual Node 22; existing validator | PASS — 18 records | `npm run validate:data`, primary-agent run; tsx IPC required execution permission | All 18 remain unverified; this validates schema, not unit facts |
| Complete desktop story | Deterministic Chromium, 1440×900, normal timing | PASS — earlier visual stage | `e2e-dev-initial.log`; full nine-arrival journey in the 13-case run | Precedes later camera repair; does not certify final chart composition |
| Complete portrait story | Deterministic Chromium, 390×844, normal timing | PASS — full earlier journey plus final scoped patrol recapture | `e2e-dev-initial.log` for complete journey; `final-patrol-mobile/observations.json` for final all-nine-arrival patrol and exploration | Changed camera is covered by the later patrol run; no single final full ZIP-to-end rerun or physical-phone pass is claimed |
| Narrow and landscape layouts | Chromium 360×800 / 844×390; production 360×600 McMurdo | PASS — earlier visual stage | 13-case development run plus `e2e-production-final.log`: real wheel input scrolls active caption to its end, inactive cards do not intercept | Emulated wheel/layout behavior is not physical touch testing |
| Reduced-motion journey | Chromium reduced-motion emulation; development and production preview | PASS | `e2e-dev-initial.log` and `e2e-production-final.log`; all patrol stops and user-initiated orders | Fixtures do not establish live image host availability |
| Targeted WebKit | Linux WebKit runtime | BLOCKED | Known missing native libraries from foundation; not rerun for visual branch | No current WebKit or real iPhone Safari pass is claimed |
| Live image/map resources | Chromium; actual external hosts; desktop and emulated phone | PASS — observed loads in initial full capture | `live-desktop/observations.json`, `live-mobile/observations.json`: all observed image elements loaded; no HTTP or JavaScript errors | Each run had 6 cancelled map-tile requests and nonfatal sprite/software-GPU warnings; not a claim of a clean console or final composition |
| Final mobile chart fitting and route clearance | Final camera + marker source; actual live Chromium 390×844 | PASS — scoped final mobile capture | `final-patrol-mobile/camera-observations.json`, all nine port PNGs, all four McMurdo slides and `10-explore.png` | Final mobile run has no JS/HTTP failures, but 2 cancelled tile requests and nonfatal sprite/software-GPU warnings; both final patrol runs complete |
| Final desktop chart fitting and route clearance | Final camera + marker source; actual live Chromium 1440×900 | PASS | `final-patrol-desktop/camera-observations.json` and 14 captures: all nine arrivals, four McMurdo slides, exploration | Live local software GPU; not physical-device performance |
| Audio initialization / interruption | Actual browser WebAudio instrumentation in Chromium | PASS | `e2e-production-final.log`: user gesture starts/resumes one context without duplication | Does not establish subjective sound quality or physical Safari behavior |
| Audible cue-transition evaluation | Listening / cue-overlap review | NOT RUN | Source confirms duplicate ship CTA horn/whoosh removed | No listening claim; preserve existing score and patrol cues |
| Actual listening | Human listening check | NOT RUN | None recorded for visual branch | Do not claim subjective audio review |
| Real-device checks | Physical iPhone/Android/desktop hardware | NOT RUN | No physical-device record | Headless/emulated smoothness is not a hardware frame-rate claim |
| Final rendered visual inspection | Actual desktop and 390×844 phone screenshots | PASS — representative scenes inspected | Durable narrative gallery and matched mobile camera comparison in `docs/evidence/visual/README.md`; final live patrol images and measured chart bounds | Mercator polar stretching and repeated world/route copies remain visible at negative phone zoom; this is not a new 3D globe |
| GitHub CI | Published visual PR | NOT RUN | Pending PR/check URL, if published | No merge/deployment during this task |

## Live-run performance and warning limits

These measurements come from the **initial pre-camera-fix live captures** of the local production preview, with real external resources, headless Chromium and software GPU. They are not physical-phone benchmarks or final-camera performance measurements.

| Observation | Desktop 1440×900 | Emulated phone 390×844 | Limit |
| --- | --- | --- | --- |
| ZIP entry usable | 920 ms | 957 ms | Local preview/runtime measurement, not a mobile-network service-level promise |
| Recorded layout shift | CLS 0.0143 | CLS 0.0362 | This captured run; not a cross-device guarantee |
| Reported JavaScript heap | 64.0 MB | 37.3 MB | JavaScript heap only, not GPU memory or total process/device memory |
| Recorded long tasks | 427, maximum 769 ms | 164, maximum 232 ms | Software-GPU/headless run; do not infer real-device frame rate |
| Cancelled tile requests | 6 | 6 | `net::ERR_ABORTED` during camera changes; distinct from HTTP failures |

Both captures recorded a nonfatal upstream style-sprite warning for `circle-11` and software-GPU `ReadPixels` stall warnings. No JavaScript exceptions or HTTP failures were recorded, but saying “the console was clean” would be false. The missing provider sprite warning and hardware performance remain limitations to communicate rather than hide.

## Evidence handling

Current execution artifacts live outside the application diff in `/workspace/coastguard-long-watch-evidence/`. `scene-review/` includes earlier desktop/phone captures and rechecks; `live-desktop/` and `live-mobile/` are the initial full 23-scene live runs. `final-patrol-mobile/` is the current mobile camera-and-marker patrol capture; `camera-fixed-before-marker-mobile/` is an explicitly superseded intermediate probe. Some older files show genuine failures; they are development evidence, not a final gallery of passing results.

The final selected screenshots will be retained in the repository’s [visual evidence gallery](evidence/visual/README.md), using real rendered screenshots rather than concepts. The review selections can reuse unchanged pre-patrol scenes from the full captures, but patrol selections must use the final camera-and-marker captures. Do not delete the failure context or present an intermediate probe as the final implementation.

The final delivery should identify the exact current opening, training, graduation, unlanded/landed orders, exterior ship, McMurdo, Patagonia, homecoming and exploration captures; retain any meaningful failure evidence with its fix/result context. Match viewport and scene when comparing against the technical foundation. Do not label concept images or superseded opening experiments as the implemented result.

## Review and rollback

Review this branch against `b37975c2a604d59f0f375c358c796794a4d81458`. The presentation changes are separated from the technical foundation and from the immutable original tag. Revert or revise visual commits through a separate reviewed branch/PR if needed; do not reset or force-push main and do not modify the hosted benchmark.

Before any merge/deployment request, deliver the visual-branch verification ledger, representative rendered screenshots, unresolved media/device/audio limits and the focused visual PR. Owner review of those concrete results remains the next approval gate.

## Final patrol evidence and visible limits

After the camera and marker corrections, both live production-preview patrol runs complete all nine arrivals, all four McMurdo slides and exploration at normal patrol timing. The unchanged preceding chapters were skipped only for these focused patrol recaptures. The earlier full ZIP-to-exploration captures remain separate stage evidence. Final live runs have no page exceptions or HTTP failures: desktop has no failed requests; phone has two cancelled map tiles on exit. A future Patagonia photograph was still pending at the first Honolulu snapshot and loaded before its own scene; selected current-scene photographs are decoded.

`geography-verification.json` verifies all nine sets of actual projected cumulative route samples lie within the reserved chart on both viewports. Current-marker/route-head differences are at most about 1.10 px on phone and 5.93 px on desktop. Provider `circle-11` sprite and software-GPU warnings remain. At the low phone overview zoom, Mercator repeats parts of the world and route at the side edges and stretches Antarctica; that visible architectural limitation remains for owner review. No globe-quality or real-phone smoothness claim is made.

The matched before/after phone comparison shows a visual-branch development defect and its repair, not a claim that these screenshots depict the original main version. Eight selected narrative scenes plus this comparison are retained in the repository. No generated concept image is presented as implemented work.

Final production-preview regression checks after the last camera/marker change: **2 PASS in 39.4 seconds**, covering Escape/restart/repeated visits and actual short-portrait McMurdo scrolling (`e2e-geography-targeted-final.log`). New DOM geometry guards in the existing complete-phone test verify markers clear the heading/card/mileage and Hobart/McMurdo remain west of Seattle on the selected Pacific world copy. The complete expanded 14-case suite is scheduled for GitHub CI; it is not represented as one locally rerun final suite.
