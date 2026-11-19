# TASK-1.23 changes

- `tools/ci/retry.js` — modified; `killGroup` returns `'sent' | 'gone' | 'denied'`, new `groupExists` and `sudoKillGroup` (`sudo -n kill` after EPERM), bounded reap wait (2 s, 250 ms polls) after every attempt, an attempt that cannot be stopped ends the helper with `::error::`; `runWithRetry` takes an optional sudo fallback for tests (SPEC-01, SPEC-04, SPEC-05; AC#1, AC#4).
- `tests/ci/retry.sudo.test.ts` — modified; unit tests for killGroup/groupExists outcomes and the stop logic with mocked `process.kill`, new Linux-CI-only real-sudo flock test, `try/finally` cleanup in both Linux-CI-only tests (SPEC-01..SPEC-05); FIX round 1: the real-sudo flock test asserts the EPERM -> `sudo -n kill` fallback ran, asserts no attempt `succeeded`, and puts a `ps -eo pid,ppid,pgid,sid,user,args` layout (marker + sudo lines, during attempt 1 and after exit) in every assertion message.
- `tests/support/process-group.ts` — new; `runProcessGroup` runs a command in its own process group and SIGKILLs the whole group at a timeout and after close (SPEC-06..SPEC-08).
- `tests/support/process-group.test.ts` — new; unit tests of `runProcessGroup` (SPEC-06, SPEC-07).
- `tests/ci/speed-limits.acceptance.test.ts` — modified; nested Vitest runs through `runProcessGroup` with a 100 s timeout instead of `spawnSync` (SPEC-08).
- `README.md` — modified; one sentence in the CI paragraph on how timed-out attempts are stopped.
- `doit/TASK-1.23/changes.md`, `doit/TASK-1.23/build-log.md` — build records.

No new dependencies.
