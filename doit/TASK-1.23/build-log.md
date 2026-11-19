## BUILD

- Implemented spec §5 in `tools/ci/retry.js` (killGroup outcome, groupExists, sudoKillGroup, stopGroup, reap, stuck handling, optional `sudoKill` parameter on `runWithRetry`).
- Added `tests/support/process-group.ts` + test; switched the speed-limits acceptance test to it (100 s nested timeout).
- Rewrote `tests/ci/retry.sudo.test.ts`: SPEC-01/04/05 unit tests, SPEC-02 Linux-CI flock test, `finally` cleanup (helper SIGKILL, `sudo -n pkill -KILL -f <bracket pattern>`, temp dir removal) for both Linux-CI tests (SPEC-03).
- README CI paragraph: one sentence.
- Commands: `npx vitest run tests/ci/retry.sudo.test.ts tests/support/process-group.test.ts tests/ci/retry.test.ts` → 17 passed, 2 skipped (Linux CI only). Run command → two `timed out after 1 s` warnings, `::error::demo failed after 2 attempts`, exit 1, 2.0 s. `npm run format`, `npm run lint`, `npm run typecheck` → clean. `npm test` → 81 files, 298 passed, 3 skipped.
- SPEC-02 cannot run on macOS; it must be checked in the branch's CI run.
