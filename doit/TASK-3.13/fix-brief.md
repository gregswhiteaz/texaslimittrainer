# Fix brief — TASK-3.13 (resolving blocked.json; recorded deviation for SPEC-05)

Decision (orchestrator, autopilot): **Option 4, plus a tracker AC.** AC#2 is about pace (scheduling), not advice. The
app can't play 10 handed yet only because the 6-max preflop chart throws for 10 seats (TASK-7.6 builds other charts).
So in the test-only 10-player pace harness, serve bot decisions from a test-only worker/policy that never calls the
6-max chart (e.g. check/call/fold from the legal set, deterministic), going through the SAME production scheduling
path (useTableSession → botActionDelayMs → shared AdviceClient request/reply). Keep SPEC-05's timing assertions
exactly as specified (≤300 ms per bot action, ≥9 measured, user folds preflop). The test-only policy must never reach
dist (same marker/grep approach as TASK-3.6's slow worker). Record this deviation in build-log.md and changes.md, and
keep your SPEC-02 cap+1 correction (good catch) noted there too.
The orchestrator adds an AC to TASK-7.6 to re-run SPEC-05 with real TAG bots once 10-seat charts exist.
Then delete blocked.json, run `npm run e2e` and `npm run e2e:slow` once (save the reporter annotations this time —
use a reporter that prints them, e.g. `--reporter=list,json` to a temp file — and record elapsedMs / handsPerHour in
build-log.md), `npm run format`, gate. Never push. Leave no background processes.
