## BUILD

- Implemented spec §5 in `tools/ci/retry.js` (killGroup outcome, groupExists, sudoKillGroup, stopGroup, reap, stuck handling, optional `sudoKill` parameter on `runWithRetry`).
- Added `tests/support/process-group.ts` + test; switched the speed-limits acceptance test to it (100 s nested timeout).
- Rewrote `tests/ci/retry.sudo.test.ts`: SPEC-01/04/05 unit tests, SPEC-02 Linux-CI flock test, `finally` cleanup (helper SIGKILL, `sudo -n pkill -KILL -f <bracket pattern>`, temp dir removal) for both Linux-CI tests (SPEC-03).
- README CI paragraph: one sentence.
- Commands: `npx vitest run tests/ci/retry.sudo.test.ts tests/support/process-group.test.ts tests/ci/retry.test.ts` → 17 passed, 2 skipped (Linux CI only). Run command → two `timed out after 1 s` warnings, `::error::demo failed after 2 attempts`, exit 1, 2.0 s. `npm run format`, `npm run lint`, `npm run typecheck` → clean. `npm test` → 81 files, 298 passed, 3 skipped.
- SPEC-02 cannot run on macOS; it must be checked in the branch's CI run.

## FIX (review round 1)

- Item 1 [MAJOR] spec02-does-not-prove-sudo-fallback-ran: fixed. `tests/ci/retry.sudo.test.ts` real-sudo flock test now asserts `retry: could not send SIG(TERM|KILL) to process group N (EPERM)` and `retry: sent SIGKILL to process group N with sudo`; per orchestrator, `not.toContain('failed with exit code')` replaced with `not.toContain('succeeded')`, and every assertion carries a `ps -eo pid,ppid,pgid,sid,user,args` layout (marker + sudo lines) taken 1 s into attempt 1 and after the helper exits. `tools/ci/retry.js` unchanged. If CI shows sudo use_pty puts the orphan outside the attempt's group, this test now fails visibly (spec assumption goes back to spec).
- Commands: `npx vitest run tests/ci/retry.sudo.test.ts` -> 7 passed, 2 skipped (Linux CI only); `npm run lint`, `npm run typecheck`, `npm run format` -> clean. The real-sudo test can only run in the branch's CI.
