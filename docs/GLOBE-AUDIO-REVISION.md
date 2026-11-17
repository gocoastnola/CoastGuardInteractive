# Globe and adventure audio revision — 2026-11-17

This is a revision of the existing application, on `codex/globe-and-adventure-audio-20261117-162137Z`. The owner requested a genuine globe as the main stage, smaller optional photography, stronger motivational music, distinct arrivals and an assignment reveal without repetitive clicks. The owner has authorized publishing this concrete revision after verification; do not introduce another approval request for the same scope. Publication is not claimed until its actual result is recorded.

## Recovery and development baseline

| Reference | Exact target / scope |
| --- | --- |
| Repository | `gocoastnola/CoastGuardInteractive` |
| Fresh main / development baseline | `481c4c98b31451541c6ceae26158b9f08f122571` |
| [Pre-globe baseline tag](https://github.com/gocoastnola/CoastGuardInteractive/tree/pre-codex-baseline-20261117-162137Z) | `pre-codex-baseline-20261117-162137Z` — remotely verified peeled target `481c4c98b31451541c6ceae26158b9f08f122571` |
| Annotated baseline tag object | `aa6e0381dc82754ba0b2518a73d26818293adb8a` — distinct from its target commit |
| [Original recovery tag](https://github.com/gocoastnola/CoastGuardInteractive/tree/pre-codex-redesign-2026-11-16) | `pre-codex-redesign-2026-11-16` — original target `013fff722014729f4e044b0ce4060dbdfc3bbd57` |
| Portable bundle | `/workspace/coastguard-globe-evidence/pre-globe-recovery.bundle`, outside Git; verified complete reachable history including both recovery references |

The original tag, pre-globe tag and separately hosted `Version-before-astra-pro` benchmark remain unchanged. Git/bundles preserve tracked code, source URLs and bundled assets, not remote photographs, map services, browser policies or deployment settings. Store the bundle independently if durable off-workspace retention is needed. Recovery should use a separate branch/worktree and reviewed change; never move these tags or force-push main. [RECOVERY.md](RECOVERY.md) describes the original preservation procedure.

## The story remains locked

Keep the four-corner mission-photo ZIP opening and familiar controls. No assignment or destination is announced before the assignment-board reveal. The journey remains hometown → Cape May travel → eight training weeks → graduation → illustrative Polar Star assignment → Seattle/ship introduction → full voyage → homecoming and exploration.

All nine arrivals remain in order: Honolulu, Hobart, Wellington, **McMurdo**, Punta Arenas/Patagonia, Cape Horn, Rio, Panama and Seattle. The full existing route geometry, approximate cumulative mileage, scientific context, blurbs and approved imagery are preserved. McMurdo precedes Patagonia; the four McMurdo photographs remain available. This is an independent educational demo with unverified content and illustrative assignments, not a promise of travel or a real operational track.

## What changed

- **One real globe:** MapLibre’s native `vertical-perspective` projection replaces the repeated flat-world presentation. The existing map engine, geographic tile providers, worker and route data remain; no new framework or mapping service is introduced.
- **Broad geographic camera:** each leg gently turns the globe toward the leg’s geographic midpoint at a whole-Earth overview scale, rather than zooming into destination streets. The cumulative route stays in its GeoJSON source. Far-hemisphere portions are naturally occluded by the sphere; the visited-stop rail preserves overall progress. Do not claim the entire back side is simultaneously visible.
- **Authored atmosphere:** a procedural cloud shell and restrained ocean highlights add depth. They are original stylized graphics, not satellite photography, live weather or measured currents. Animation is capped, pauses when hidden and is static in reduced motion; graphics resources are cleaned up.
- **A globe-led layout:** the current portrait layout reserves **372 pixels of a 390×664 viewport (about 56.0%)** for the globe stage, after increasing the credits row to 56 pixels. The earlier 404-pixel/61% probe preceded the attribution correction and is historical, not the final layout. The automatically shown port dock remains 88 pixels tall with an 80×64 thumbnail, rather than a large photograph covering the voyage. Short landscape uses a side dock. This is local browser geometry, not physical-iPhone validation.
- **Photographs by choice:** Details explicitly opens the destination text, source credits and gallery in an accessible drawer. Opening it pauses the authored voyage timeline and camera; closing resumes and returns focus. Escape closes the drawer first, preserving Escape-to-end-patrol outside the drawer. McMurdo’s compact thumbnail still cycles its four photographs during the same 10.2-second hold; all four are available together in Details.
- **Story and recovery controls:** all nine stops, original arrival holds, Panama animation, quiet Escape, restart/exploration, reduced-motion itinerary and Continue remain. Reduced mode also retains total approximate mileage and its qualifier.
- **Rotation recovery:** a reproduced mid-leg portrait-to-landscape crop is repaired. Resize immediately fits the physical sphere to the new stage at its current geographic position, then continues the remaining leg camera time. A photo drawer remains paused; static reduced-motion framing and listener/frame cleanup are retained. Matched before/after evidence is recorded separately from fresh-load layout checks.
- **Recorded primary soundtrack:** **Vanguard — Scott Buckley**, licensed under [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/). The [official track page](https://www.scottbuckley.com.au/library/vanguard/) and [composer licensing page](https://www.scottbuckley.com.au/library/licensing/) were verified. The composer describes the track as “driving, epic hybrid orchestral”; that description is not represented as a completed listening assessment.
- **Efficient playback and fallback:** the full 234.58-second recording is bundled as `public/media/music/vanguard-scott-buckley.mp3` (128 kbps stereo; **3,754,020 bytes**). One streaming HTML audio element feeds the existing single AudioContext; the application does not decode the entire track into an AudioBuffer. Playback is primed inside the user gesture, becomes audible only after playing/seek readiness at the 45-second cue, and uses a 0.4 recorded-music gain. Restart/loop returns to that cue; ordinary scene changes retain playback position. If loading/playback fails or stalls, the new authored rhythmic score remains available as the fallback. Its 124–132 BPM training/orders/patrol modes describe the **fallback**, not Vanguard’s tempo; Vanguard’s BPM is not claimed here.
- **Arrival and reveal cues:** arrival uses a fuller nautical impact/horn cue. The assignment board uses its authored 4.6-second rise/roll and reveal impact instead of per-row click spam. The primary licensed recording is bundled rather than hot-linked; the arrival/orders effects remain project-authored. No paid service, account, key or new dependency is added. Existing gesture restrictions and owner-directed audio policy remain.

## Attribution and evidence boundaries

The native accessible map information control credits **Vanguard — Scott Buckley**, links the official work and CC BY 4.0 terms, and identifies the web mix/repeated playback. [`public/media/music/ATTRIBUTION.txt`](../public/media/music/ATTRIBUTION.txt) preserves a text copy beside the bundled recording. On portrait screens the credits row is 56 pixels, and attribution uses 10-pixel text / 14-pixel line height without an extra default margin, so provider and music credits have reserved space rather than hiding essential controls. The composer does not endorse the demo.

The earlier WAV/offline previews demonstrate the **fallback score and authored effects**, not the primary Vanguard recording. A recording excerpt is separately available at `/workspace/coastguard-globe-evidence/audio/vanguard-excerpt-45-65.mp3`. Neither those files nor numerical waveform metrics constitute actual subjective listening by the agent.

## Verification — current revision only

Earlier reports such as [VERIFICATION.md](VERIFICATION.md) and [VISUAL-UPDATE.md](VISUAL-UPDATE.md) describe prior source states. Green baseline CI run **#21** does not certify this new revision. The final Node/build/unit/data results below are confirmed. Browser, live-scene and publication results must still be entered from their final-source runs. An initial 15-case diagnostic run had **9 passed / 6 failed**: four test-harness assumptions and two genuine application defects (reduced-layout grid alignment and off-screen/back-face map-marker keyboard exposure). Both defect fixes and the corrected harness are in the frozen candidate; the clean 17-case run is in progress. Do not call that diagnostic run a passing final suite.

| Check | Environment | Result | Evidence / limit |
| --- | --- | --- | --- |
| Recovery references and portable bundle | Git / remote tag verification | PASS | Primary-agent gate: both exact recovery targets; complete-history bundle outside repository |
| Locked dependency install / runtime | Node 22.23.5, npm 11.9.0 / existing lockfile | PASS | `npm ci`; no new dependencies |
| Final production build | Node 22.23.5; `/CoastGuardInteractive/` | PASS | `/workspace/coastguard-globe-evidence/build-final.log`; local build, not publication |
| Final unit tests | Node 22.23.5 / Vitest | PASS — 79 tests in 13 files | `/workspace/coastguard-globe-evidence/unit-final.log`; includes audio/globe/recorded-score behavior |
| Final data validation | Node 22.23.5 / existing validator | PASS — 18 records | `/workspace/coastguard-globe-evidence/data-final.log`; all 18 remain demo-unverified |
| Native-globe component inspection | Actual Chromium render | PASS — component scope only | Native globe/cloud preview frames exist; not proof of the complete normal-timing journey |
| Complete development browser suite | Chromium; 17-case final run in progress | NOT RUN | Earlier diagnostic 9/6 is classified above; final result pending |
| Production-subpath browser subset | Chromium; seven targeted cases planned | NOT RUN | Final result pending; no deployment implied |
| Complete rendered journey / live media | Normal timing; real external map/photo resources | NOT RUN | Final scene capture, all-nine-arrival record, errors and warnings pending |
| Details pause, focus and recovery | Chromium at 390×664 | PASS — earlier local fixture probe only | Close focus and Escape were checked before the final credits/layout correction; current full gallery/normal-timing result remains pending |
| Final portrait globe/credits geometry | Current 390×664 layout | NOT RUN | Source budget is 372-pixel globe stage plus 56-pixel credits row; final rendered candidate result pending |
| Fallback score and cue rendering | Native OfflineAudioContext, shared fallback/cue builders | PASS — numerical render only | WAV metrics show zero clipped/nonfinite samples; these are not Vanguard previews or a listening assessment |
| Actual listening | Human/model subjective assessment | NOT RUN | The actual 45–65-second Vanguard MP3 excerpt and fallback WAV previews exist; no sound-quality judgment is claimed |
| WebKit engine availability | Actual native blank-page launch | PASS — startup only | A bounded user-space dependency setup and `/tmp/coastguard-webkit-run.sh` enabled the engine; no privileged system install |
| Targeted WebKit compatibility | Seven targeted cases planned | NOT RUN | Engine availability is not an application compatibility pass; final suite result pending |
| Physical-device testing | Real iPhone/Android/desktop hardware | NOT RUN | Viewport emulation is not a physical device; no hardware frame-rate claim |
| Current revision CI / publication | GitHub Actions / existing Pages site | NOT RUN | Baseline #21 was green; current revision result and published SHA/URL remain to be recorded |

Audio previews and measurements are under `/workspace/coastguard-globe-evidence/audio/`, including `audio-review.html`, `metrics.json` and the separate Vanguard MP3 excerpt. The fallback scheduler and offline renderer share instrument/cue builders; their numerical success proves generated samples/output bounds, not that the primary recording or fallback was heard or preferred.

The **initial** host WebKit attempt was blocked by six missing native libraries. One bounded user-space setup supplied nine libraries and a temporary wrapper, after which a native blank page launched successfully. This did not alter the host system or add an application dependency/account/secret. The targeted application suite remains pending; no physical-iPhone Safari pass is claimed. Earlier integrated phone/Honolulu/McMurdo captures used the pre-final credits frame and are labelled development evidence; final normal-journey captures must use the current 372-pixel portrait stage.

## Release and review

Use the existing production pipeline and project-subpath checks. The owner has already approved publication of this revision’s concrete scope; complete the relevant checks and verify the actual deployed SHA/site before reporting publication. Keep the frozen benchmark and immutable tags intact. Record the final PR/commit, CI result, deployed URL/SHA and remaining manual listening/device checks here when available.
