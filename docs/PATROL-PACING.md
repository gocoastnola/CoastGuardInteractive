# Touch-and-go patrol and completed-voyage overview

The owner requested faster port calls followed by a rotating view of the entire patrol after returning to Seattle. This continues the published globe application from freshly fetched main `2cec276dc08bde643577a6e0f1e0261b124472ce`, on `codex/patrol-touch-and-go-20261117-210100Z`. The owner requested skipping further recovery checks; no recovery, tag, bundle or backup operation is part of this revision.

## Visible behavior

| Stop | Previous hold | New hold |
| --- | --- | --- |
| Ordinary port | 3.8 seconds | 1.4 seconds |
| McMurdo | 10.2 seconds | 2.4 seconds |
| Panama Canal | 4.4 seconds | 1.8 seconds |
| Seattle homecoming | 3.8 seconds | 2.2 seconds |

Entry/exit fades are 0.22 seconds, with shorter inter-call gaps. Sailing-leg durations and all sea waypoints remain unchanged. All four McMurdo thumbnails still cycle during its brief call; full photographs, captions and credits remain in Details and are available again from the completed-patrol dock. The canal animation is shortened to fit its arrival window.

The exact order remains Seattle departure → Honolulu → Hobart → Wellington → McMurdo → Punta Arenas/Patagonia → Cape Horn → Rio → Panama → Seattle. No stop or photograph is removed. The same 1,129 route coordinates produce approximately 28,855 cumulative statute miles; these remain illustrative calculations, not an operational track or promised assignment.

After homecoming the entire route is drawn and all nine arrival indicators are complete. A broad globe turns around its longitude axis at latitude −20°, bringing the different route sections into view. A sphere naturally hides its far side, so the rotation reveals the whole patrol over time. This uses four native MapLibre 90° segments of three seconds each, after a one-second overview transition. A single 360° target would normalize to zero motion in MapLibre; bearing-only rotation would not reveal the other hemisphere.

The overview remains until **Explore the map** or Escape. Each visited-stop button opens its existing photographs and pauses the orbit; closing resumes it. Resize preserves framing and a paused gallery. Reduced motion retains the static full itinerary and Continue path without forcing rotation. Native user gestures, other camera actions and unmount cancel orbit listeners safely.

Browser testing reproduced a responsive defect when crossing the 860px layout breakpoint: a new imperative map wrapper restarted the patrol after returning to portrait. Patrol setup and its resize subscription now follow native-map availability rather than wrapper identity, keeping the completed route, mileage and gallery intact.

The authored normal patrol reaches its recap at approximately **32.72 seconds**, versus the previous **65.47 seconds** before automatic exploration. The first complete overview turn finishes around 45.72 seconds. These are timeline calculations, not hardware performance guarantees. The four-photo ZIP opening, training, surprise orders, ship introduction, music and existing exploration behavior remain intact.

## Verification record

Actual local runtime: **Node 22.23.5 / npm 11.9.0**. GitHub Actions used **Node 22.23.4**. Locked package files and dependencies are unchanged. Application commit is `e70ca98`; browser tests are frozen in `99f144892630a346d2c75434860e96c7c6ee09e4`. Later evidence-only commits do not change the tested bundle.

| Check | Status | Evidence / limits |
| --- | --- | --- |
| Unit tests | PASS | 89 tests in 13 files, including quarter-turn wrapping and orbit listener cancellation |
| Production-subpath build | PASS | `/CoastGuardInteractive/`, local and GitHub Actions run #27 |
| Data validation | PASS | 18 demo-unverified records. Standard npm command passed in CI; the same validator passed locally via `node --import tsx` after the CLI's sandbox IPC restriction |
| Complete Chromium suite | PASS | 18/18 in GitHub Actions run #27, including both complete ZIP-first journeys and all nine quick arrivals |
| Production browser subset | PASS | 8/8 in the same CI run; deployment correctly skipped for the PR |
| Focused Chromium recap | PASS | Three relevant behaviors passed locally; native recap measured 360.564° longitude over 12.061s, 84 sampled positions, constant −18° bearing |
| Native WebKit recap | PASS | One focused case: 364.590° longitude, all galleries, paused breakpoint changes, resume and exit cleanup; not physical iPhone testing |
| Real production-build map/media | PASS | 1440×900 and 390×664, no resource fixtures or accelerated clocks; every arrival, four loaded McMurdo thumbnails, full route, all galleries and Explore exit |
| New hosted version | NOT RUN | Prepublication snapshot; [PR #8](https://github.com/gocoastnola/CoastGuardInteractive/pull/8) records actual deployment and subsequent hosted checks |
| Physical-device / subjective-listening checks | NOT RUN | Browser viewport emulation is not phone hardware; soundtrack is unchanged |

[Genuine screenshots and measurements](evidence/patrol-recap/README.md) show multiple hemispheres and phone reflow. Real-resource native travel measured 409.965° desktop / 389.625° phone across the saved viewpoints. Both runs retained all 1,129 coordinates, approximately 28,855 miles and nine visited stops. There were no JavaScript page errors or HTTP resource failures; one expected recording seek cancellation was retained. Software-renderer ReadPixels and the existing optional `circle-11` style warning were recorded separately.

Frame-sampled arrival durations are quantized by software graphics scheduling (for example one desktop call sampled at 1.183s); they are not exact timer or physical-device measurements. The authored holds are listed above. Screenshot inspection found the pre-existing small Seattle-label/status overlap in one desktop view and persistent attribution over part of scrollable gallery content; the header, Explore control, photo sources and recap stay usable.

Testing also corrected two new harness assumptions: last-bit Node/browser trigonometry differences now use a tiny floating-point tolerance while comparing every route point, and the orbit assertion requires changing longitude with steady bearing rather than zero bearing. An interrupted WebKit run was preserved and repeated once after the environment resumed. One genuine responsive-restart defect was fixed as described above. The final complete CI run is green; failures were not hidden by skipping scenes or weakening the itinerary.

[PR #8](https://github.com/gocoastnola/CoastGuardInteractive/pull/8) is the final release ledger. Publication follows the existing validation-gated workflow; the timing is not claimed live before actual deployment and hosted verification. No recovery checks or backup operations were performed for this revision.
