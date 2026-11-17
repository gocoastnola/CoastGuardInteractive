# ZIP-first acceptance checklist

This checklist defines the existing experience being stabilized. It does not approve the cinematic redesign. ZIP entry, all existing itinerary stops, approved imagery decisions, wide geographic context and cumulative route remain product requirements.

Final measured outcomes, runtime versions, commands, evidence and unresolved limitations are in [VERIFICATION.md](VERIFICATION.md). A checklist row is not a PASS claim merely because a test exists. The technical PR stays draft/not ready if material verification remains blocked.

## Evidence types

- **Deterministic browser:** real React state, GSAP timelines, MapLibre worker/camera/routes, ZIP table and WebAudio initialization. Only external basemap/image responses may use explicitly declared local fixtures. These runs verify mechanics and rendering under controlled resources, not availability/authenticity of live hosts.
- **Unit/data:** pure route math, state transitions, ZIP handling, data schema and cleanup contracts where appropriate; no claim of rendered usability.
- **Live rendered:** actual remote maps/photographs, normal presentation timing, browser console/network capture, representative screenshots. Record failures by URL/status and scene; distinguish cancelled map requests from persistent load failures.
- **Emulation:** viewport sizes, reduced motion and browser engines in this execution environment. A 390×844 viewport is not an iPhone; desktop WebKit is not physical Safari.
- **Manual/physical:** actual listening, hardware/browser interruptions, real iPhone/Android, keyboard/screen-reader review and sustained device performance. Mark NOT RUN when unavailable.

## A. ZIP entry and travel

| ID | Required acceptance | Method / evidence needed |
| --- | --- | --- |
| A1 | Headline remains “Enter your ZIP code and start your journey”; no date cards or selected departure date | Browser landing assertion and rendered screenshot |
| A2 | Valid Census ZIP submission starts hometown travel before boot camp | Deterministic complete journey, app phase sequence and hometown/Cape May markers |
| A3 | Missing, malformed and unsupported/unrecognized ZIPs show a useful error; input remains editable and a corrected ZIP succeeds | Browser form cases with actual lookup or declared response fixture; keyboard focus and retry |
| A4 | Failed ZIP-table loading shows a recoverable error; retry is possible | Deterministic network failure followed by restoration/retry; no permanent cached rejected promise |
| A5 | Mileage is consistent with the underlying great-circle calculation and stated units | Unit arc/distance checks and browser counter assertion |
| A6 | Approximate ZIP-area centroids and straight-line/statute distance are not presented as exact road travel | Visible qualification/copy inspection in travel, not only a test helper or developer comment |

## B. Training and graduation

| ID | Required acceptance | Method / evidence needed |
| --- | --- | --- |
| B1 | Hometown → Cape May travel completes before training starts | Full real-timing phase sequence; no date-first bypass |
| B2 | Training covers weeks 1–8 and ends in visible graduation before orders | Complete desktop/mobile journey assertions and normal-timing screenshots/events |
| B3 | Authentic approved training/graduation image sources remain; photography loads and its crop/caption stays readable | Live image status, natural dimensions and rendered scene review; fixture pass alone is insufficient |
| B4 | Reduced motion preserves training information and photography instead of leaving all photos hidden | Reduced-motion browser journey and matched before/after training screenshot |

## C. Assignment and ship introduction

| ID | Required acceptance | Method / evidence needed |
| --- | --- | --- |
| C1 | Assignment board resolves to USCGC Polar Star | Browser landed-board assertion and reducer/assignment tests |
| C2 | Assignment is visibly illustrative, with no guaranteed career or travel implication | Visible demo-note assertion and copy review |
| C3 | Report aboard → Seattle travel → ship intro → Set sail works | Full desktop/mobile phase assertions; existing Escape paths separately checked |
| C4 | Exterior/moored/icebreaking image decisions remain intact; no rejected interior/personnel/family/baby photography is introduced | Source manifest and rendered photography review, successful/fallback loading evidence |

## D. Patrol and geography

| ID | Required acceptance | Method / evidence needed |
| --- | --- | --- |
| D1 | Full order: Seattle departure → Honolulu → Hobart → Wellington → McMurdo → Punta Arenas → Cape Horn → Rio → Panama → Seattle home | Unit stop-order assertion plus complete live/deterministic browser arrival sequence; all nine arrivals retained |
| D2 | McMurdo appears before Patagonia with Antarctic environment/research-support context; penguins and existing scenic ports remain | Scene text/image assertions and rendered gallery/port review |
| D3 | Route samples stay continuous through the antimeridian and Antarctic via points | Unit longitude/segment continuity and cumulative-distance checks; live rendered world-route review for visual artifacts |
| D4 | Wide view retains the cumulative voyage route rather than repeated close-up-only framing | Rendered screenshots at successive ports; MapLibre route-layer content assertion |
| D5 | Port captions/images remain visible, do not overlap essential UI and have sensible unavailable-media behavior | Normal-timing desktop/phone/landscape screenshots; explicit media failure test; live host checks separate |

## E. Interaction and recovery

| ID | Required acceptance | Method / evidence needed |
| --- | --- | --- |
| E1 | Existing Continue/Escape/skip paths advance the appropriate scene once | Deterministic stage assertions and reducer tests; no global skip-only substitute for full normal-timing journey |
| E2 | Restart returns to usable ZIP entry; free explore reaches the map without a journey | Browser restart/free-explore assertions and keyboard focus check |
| E3 | Directory search, selection, station panel and panel Escape/back-to-map work | Exploration browser tests and existing Directory/Narration unit tests |
| E4 | Revisit/restart does not duplicate score intervals, ambient audio, GSAP timelines, listeners, markers or route layers | Browser instrumentation and repeated journey/restart; cleanup unit checks where useful |

## F. Responsive behavior and accessibility

| ID | Required acceptance | Method / evidence needed |
| --- | --- | --- |
| F1 | Complete mobile portrait journey works around 390×844 | Browser viewport emulation, controls reachable, no unintended horizontal scroll; not a real iPhone claim |
| F2 | 360-pixel narrow and mobile landscape views keep text/actions readable and reachable | Focused layout assertions and matched screenshots; scrollability included where relevant |
| F3 | Keyboard input, visible focus, Enter submission and Escape recovery are usable | Browser keyboard paths plus rendered focus inspection |
| F4 | Reduced-motion flow preserves the entire story, including training, all patrol stops and Continue | Dedicated reduced-motion full journey; static information must actually be visible |
| F5 | Essential story information is available visually, not only through sound or animation | Visible narrative text, training/port alternatives and copy review |
| F6 | Any new journey mute/autoplay change is proposed for owner approval rather than silently introduced | Diff and proposal review; retain current product behavior in technical repairs |

## G. Audio and media

| ID | Required acceptance | Method / evidence needed |
| --- | --- | --- |
| G1 | AudioContext initializes/resumes from valid user gestures within browser restrictions | Chromium instrumentation; targeted WebKit when supported; suspended/retry behavior |
| G2 | Scene changes, restart and repeated visits avoid duplicate playback and leaked loops | Instrumentation counts active contexts/score timers/ambient nodes and checks teardown; no implication that sound was heard |
| G3 | Existing score/SFX behavior remains; quality and transitions are assessed separately | Source/runtime review; **actual listening is NOT RUN unless a listening check is recorded** |
| G4 | Approved images load with readable crop/caption/credit and recover without broken-image UI when optional media fails | Deterministic failures, production base-path requests, live dimensions/status and rendered review |
| G5 | Photo identity/license/source evidence remains traceable | ASSET_LICENSES.md and manifest/source audit; a reachable image URL does not prove every license or attribution condition |

## H. Reliability and production

| ID | Required acceptance | Method / evidence needed |
| --- | --- | --- |
| H1 | Locked dependencies, build, unit tests and data validation pass under actual Node 22 | Commands and versions recorded in VERIFICATION.md, not inferred from another runtime |
| H2 | Development and production builds both boot; project-subpath assets/ZIP data/MapLibre worker load | Full dev suite plus `@production` subset against preview under `/CoastGuardInteractive/` |
| H3 | Console errors, network failures and missing optional media are investigated | Separate captured records: stale expectations, real defects, tooling limits, external failures, unresolved |
| H4 | PR CI covers build/unit/data/browser checks; PR/task branches/tags cannot deploy | Workflow trigger/condition inspection and CI result where available; no merge/deploy during this task |
| H5 | Required-check enforcement is reported honestly | Owner branch rules are separate from workflow checks. Ruleset endpoint returned `[]`; legacy branch-protection inspection returned 403 for this integration, so merge blocking is not verified |
| H6 | Recovery tag is remotely verified and portable bundle tested; external services are outside Git recovery | RECOVERY.md, peeled remote tag, `git bundle verify`, and separate artifact delivery |

## Reproduction commands and CI scope

Use Node.js 22 and the existing lockfile:

```bash
npm ci
npm run validate:data
npm test
npm run build -- --base=/CoastGuardInteractive/
npx playwright install --with-deps chromium
npm run test:e2e
E2E_PRODUCTION=1 npm run test:e2e -- --grep @production
```

The default deterministic suite and production subset must document their fixtures. A live external-host review is separate and may expose rate limits or unavailable resources without invalidating deterministic application assertions. Capture those limitations rather than hiding them with fixtures. The CI deployment job depends on successful relevant checks, but only the repository’s actual owner-controlled rules can enforce a required check before merging.
