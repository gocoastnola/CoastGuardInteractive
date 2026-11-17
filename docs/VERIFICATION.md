# ZIP-first stabilization verification

Repository: `gocoastnola/CoastGuardInteractive`. Development baseline: `013fff722014729f4e044b0ce4060dbdfc3bbd57`. Recovery and non-destructive rollback: [RECOVERY.md](RECOVERY.md). Required behavior/evidence map: [ACCEPTANCE.md](ACCEPTANCE.md).

## Environment and provenance

Measured with Node **22.23.5**, npm **11.9.0**, the existing `package-lock.json`, Linux and Playwright Chromium **156.0.8078.4** (revision 1248). Chromium uses software WebGL in this execution environment. Emulated phone viewports are not physical phones. Browser downloads and Node installation are local tooling, not repository dependency upgrades.

Baseline evidence was captured before application changes: an unaccelerated desktop journey reached every stop and exploration at 117.999 seconds from navigation; a production-build 390 × 844 journey did the same at 110.125 seconds. These are observed session durations, not fixed application deadlines or representative hardware benchmarks. No ports/scenes were skipped in those two captures.

Browser functional tests explicitly fixture external map-style responses and remote photographs. They still run the real MapLibre map, worker, route layers, GSAP timings, local ZIP table, local ship photography and WebAudio. Fixtures are labeled in test code and image pixels. They do not establish live map accuracy, authentic photo availability or music quality. Separate live-resource captures use the actual external hosts.

## Baseline results and classification

| Check | Result | Evidence / classification |
| --- | --- | --- |
| Locked install | PASS | `baseline/install.log` |
| Production build | PASS | `baseline/build.log` |
| Unit tests | PASS — 55 tests, 8 files | `baseline/unit.log` |
| Data validation | PASS — 18 records | `baseline/data.log`; all demo-unverified |
| Existing browser tests | FAIL — 1 passed, 5 failed | `baseline/e2e.log`; the five failures expect absent date-picker text/controls. ZIP UI was confirmed by live render and source. These are outdated tests, not a reason to restore date entry. |
| Normal rendered journey | PASS for traversal | Live desktop/mobile screenshot sequence and `observations.json`, all nine patrol legs; visual/media defects remain below |
| Reduced-motion training | FAIL | Photo gallery hidden; no Week 1–8 readout or graduation completion. Genuine application defect. |
| Landscape/narrow ship introduction | FAIL | At scrollTop 0, card top = −108.625 px at 844 × 390 and −26.344 px at 360 × 780. Genuine unsafe-centering defect. |
| Landscape static patrol | FAIL | List starts −65 px above viewport at 844 × 390. Genuine clipping defect. |
| Normal patrol mileage counter | FAIL | Live screenshots plus CSS show inherited zero opacity; the patrol never animated it in. Genuine visibility defect. |
| Assignment reel after spin | FAIL | Settled mobile screenshot shows empty masked reel although assignment below is present. React reuses the transformed strip DOM as the final row. Genuine animation/DOM reuse defect. |
| External photograph | FAIL | Existing confidence-course image requested directory `1208`; browser reports `ERR_BLOCKED_BY_ORB`. Published DVIDS source points to directory `1312`. External asset/path failure, repaired without replacing the selected image. |
| Browser exceptions | PASS in observed live traversals | No uncaught page errors. GSAP target warnings, upstream map-style filter warning and software GPU warnings recorded separately. |

The desktop network log includes 46 failed-request events: 45 map `ERR_ABORTED` events around camera changes/exit and one actual photograph failure. Cancelled superseded tiles are not classified as 45 unavailable map services. Later live checks have separate logs; availability can change between runs.

## Authorized repair scope

- Resolve bundled images against Vite's base at rendering boundaries, including unit galleries. Remove deployment-time text rewriting as the asset-path mechanism.
- Render an honest unavailable-photograph state when optional media fail; never fall back to rejected interiors/personnel/family images. Keep existing approved primary selections.
- Correct the verified confidence-course CDN directory and distinguish NSF from USCG credits.
- Preserve training photos, all eight weeks and graduation in a scrollable reduced-motion alternative.
- Clean up reduced patrol ambient audio and scope assignment spin/timer cleanup. Preserve the existing synthesized score, user-gesture initialization and owner-directed audio controls.
- Distinguish approximate straight-line ZIP-centroid distances from approximate cumulative route miles, and explicitly show the patrol counter instead of inheriting zero opacity.
- Repair short-screen centering/scroll access, bound route padding to retain a positive landscape map viewport, and place a restrained readability backing behind existing travel/training text. Resize the existing Panama illustration/photo allocation to fit the complete card, and reserve room for the mileage note. No new art direction or scene timing redesign.
- Replace obsolete browser expectations, document current ZIP-first behavior, and require relevant PR validation before the existing production deployment job can run.

The full route, nine arrival destinations, McMurdo-before-Patagonia order, wide cumulative framing, map engine, source data status and independent-demo disclaimer remain intact. No data record is promoted to verified.

## Final verification

| Check | Environment | Result | Evidence | Remaining limitation |
| --- | --- | --- | --- | --- |
| Unit tests | Node 22.23.5 / Vitest | PASS — 64 tests, 11 files | `after/unit.log`; asset/error-state, reduced story, ambient ownership and assignment cleanup regressions | Mocked cleanup contracts do not establish audible output |
| Data validation | Node 22.23.5 / existing data | PASS — 18 valid records | `after/data.log` | All remain demo-unverified |
| Production build | Node 22.23.5 / Vite project base | PASS | `after/build.log`; `npm run build -- --base=/CoastGuardInteractive/` | Build success alone does not establish runtime behavior |
| Development browser suite | Chromium / real implementation, external fixtures | PASS — 13 tests, 4.7 minutes | `after/e2e-dev-final.log`, `after/browser-dev-final/`; counter cumulative opacity and viewport explicitly asserted | External style/photo fixtures are explicitly labeled |
| Production browser checks | Chromium / preview 5175 / project subpath | PASS — 4 tests, 17.2 seconds | `after/e2e-production-final.log`, `after/browser-production-final/` | Checks startup, ZIP, bundled images, worker, static story and audio lifecycle; full normal journey separately exercised |
| Targeted WebKit | Linux desktop engine | BLOCKED | `after/e2e-webkit.log`, launch traces | Missing libgtk-4, libgraphene, libharfbuzz-icu, libmanette, libhyphen and libGLESv2; no application assertions ran |
| Audio initialization | Actual Chromium AudioContext | PASS | Browser context creation, running state, suspend → user-gesture resume, single context on repeat visits | Not real iOS interruption behavior or actual listening |
| Actual listening | Speakers/headphones | NOT RUN | No listening claim made | Owner/device listening pass remains required |
| Mobile emulation | Chromium 390×844, 360×800, 844×390 | PASS for covered paths | Normal 390 journey; narrow/landscape controls, card geometry and user-input scrolling | CSS viewport emulation is not a physical iPhone |
| Physical-device testing | iPhone/Android | NOT RUN | No physical device available in this task | Safari, touch, safe-area, hardware performance, battery and OS interruptions remain manual |

| Check | Environment | Result | Evidence | Remaining limitation |
| --- | --- | --- | --- | --- |
| Rendered live visual inspection | Actual remote maps/photos; normal desktop/mobile baseline and repaired mobile production journey | PASS for observed traversal/repairs | Repaired mobile capture: 18 screenshots, all nine arrivals and exploration at 110.787 seconds; selected matched pairs below | Timed still/scene inspection is not an attended video or physical-device test |
| External images and map delivery | Live hosts in final mobile production capture | PASS in this observed run | Zero non-cancelled network failures; no uncaught JavaScript exceptions; corrected confidence-course photo loaded | Future host availability is not guaranteed; upstream map-style filter warning and software GPU warnings remain |

The final reduced-training week labels also received a dark backing after live visual review; the relevant 4 production checks were rerun successfully (17.2 seconds), and the matched static screenshot was recaptured. The normal story/timing was unchanged by that final static-only contrast correction.

Matched before/after evidence uses actual live resources and the same viewport/scene:

| Scene / viewport | Before | After | Observed repair |
| --- | --- | --- | --- |
| Assignment, 390×844 | [Before](evidence/before-assignment-390x844.png) | [After](evidence/after-assignment-390x844.png) | Selected ship name appears inside the reel, not only in the result card |
| Panama, 390×844 | [Before](evidence/before-panama-390x844.png) | [After](evidence/after-panama-390x844.png) | Entire lock illustration/caption fits; cumulative counter is visible and separated |
| Reduced training, 390×844 | [Before](evidence/before-static-training-390x844.png) | [After](evidence/after-static-training-390x844.png) | Centered readable story, eight weeks and original photographs; remaining sequence/Continue is scrollable |
| Ship introduction, 844×390 | [Before](evidence/before-ship-844x390.png) | [After](evidence/after-ship-844x390.png) | Card begins at y=20 instead of y=−108.625; CTA reachable by scrolling |
| Static patrol, 844×390 | [Before](evidence/before-static-patrol-844x390.png) | [After](evidence/after-static-patrol-844x390.png) | Beginning of itinerary is reachable at y=110 instead of y=−65; all stop blurbs retained in scroll flow |

These are repair screenshots, not redesign concepts. Network/camera state and exact animation frame may differ between runs; crop/viewport and named scene are matched. Photography sources/usage notes remain in ASSET_LICENSES.md and the existing DVIDS manifest. The PR remains draft because WebKit is blocked and physical-device/listening checks are outstanding. It is not represented as release-ready.

A later live-resource capture caught a visibility gap after a green geometry suite: the patrol counter had a box but inherited zero opacity. The repair explicitly shows it, and normal/reduced journey tests now require rendered opacity as well as position. Earlier post-repair captures are retained under `after/interim/*before-counter`; they are not represented as final-counter evidence.

The first revised suite reported 3 FAIL / 10 PASS. Both complete journeys exposed genuine Panama lock/caption clipping (desktop body 155 px vs 250 px content; mobile 171 px vs 206 px), which was repaired without dropping the animation or weakening the portrait fit assertion. The repeated-visit test attempted Restart through an open unit panel; it now follows the existing Back to map → Restart path. The final 13-test run passes. Initial failure logs and traces are retained separately.

The first production attempt reused an old local preview process started without the project base, which returned HTML for JavaScript URLs. This was an environment/server-reuse error, not classified as an application defect. The known project preview was stopped; Playwright now owns production preview with the matching base and refuses to reuse a production server. Final production checks pass. No other project or port 4173 was touched.

## Evidence locations

The review package outside Git is `/workspace/coastguard-evidence/`: `baseline/` and `after/` contain raw logs, scene screenshots, layout measurements and observations. Small matched screenshot pairs are copied under [evidence](evidence/) for PR review. The full cinematic proposal is a separate HTML artifact; it is not part of this implementation diff.

## Performance observations and limits

Baseline build JavaScript plus map worker: **1,928,691 bytes raw**, **548,620 bytes gzip** (gzip estimates, not proof of wire delivery). Bundled media: **7,113,579 bytes**; ZIP JSON: **760,869 bytes**, fetched on first submit. Desktop entry-ready observation: **1,082 ms**; mobile-viewport production observation: **866 ms**, using this shared environment with different cache/network conditions. These do not establish a mobile-network service level.

Observed CLS was 0.00936 desktop and 0.02760 mobile emulation. ResourceTiming transfer totals omit/zero some cross-origin transfers, so the 10.38 MB / 2.56 MB session figures cannot be compared as total-download improvements. Coarse reported heap was 64 MB / 47.4 MB; this excludes full GPU/worker memory. Long tasks reached 842 ms in the shared software-rendered desktop run. No physical-device frame-rate or battery claim follows from these measurements.

## Remaining manual checks and policy limits

Actual listening, real iPhone/Android behavior, VoiceOver/TalkBack, hardware GPU performance and real background/interruption behavior need device checks. Technical AudioContext assertions are not a listening assessment. Product decisions about a global mute/pause control are deferred to the cinematic proposal; existing owner-directed behavior is preserved.

Pre-existing opacity-hidden patrol/McMurdo credit links can still appear in keyboard focus order; the training-credit regression is repaired, but this is not a complete keyboard/screen-reader accessibility audit. Remote Commons/DVIDS availability, exact cropping at every screen ratio and all license/attribution obligations require ongoing review. A successful fallback verifies resilience, not successful delivery of the intended photograph. The proposal identifies additional editorial/content verification work without claiming the demo facts are verified.

CI job dependencies enforce validation before its deploy job. They do not by themselves prevent merging: the active-rules endpoint returned an empty list, while legacy branch-protection inspection returned HTTP 403. Owner-required status checks remain unverified. No auto-merge, production workflow dispatch, merge, release or main push is part of this task.
