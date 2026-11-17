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

Actual local runtime: **Node 22.23.5 / npm 11.9.0**. Locked package files and dependencies are unchanged.

| Check | Status | Evidence / limits |
| --- | --- | --- |
| Unit tests | PASS | 89 tests in 13 files, including quarter-turn wrapping and orbit listener cancellation |
| Production-subpath build | PASS | `/CoastGuardInteractive/`; final-source build before browser verification |
| Data validation | PASS | Same validator executed with `node --import tsx scripts/validate-data.ts`: 18 valid demo-unverified records. Local npm/tsx CLI hit a sandbox IPC-listen restriction; no validator or application change |
| Browser, rendered voyage and recap | NOT RUN | Final result pending; earlier PR #7 checks do not certify this change |
| Physical-device / subjective-listening checks | NOT RUN | Browser viewport emulation is not phone hardware; soundtrack is unchanged |

The application and browser evidence will be recorded with the focused pull request. Publication must follow the existing validation-gated workflow; do not claim the new timing is live before deployment and hosted verification.
