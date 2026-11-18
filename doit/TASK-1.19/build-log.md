## BUILD (TASK-1.19)
- Wrote `tools/ci/retry.js` (parseArgs + tokens to require `--`; spawn detached; group kill via `process.kill(-pid)`), the stub fixture, `tests/ci/retry.test.ts` (8 tests, 0.5 s timeouts / 0 s delays, ~5 s total) and the workflow test changes; wrapped both install steps in `ci.yml`; README sentence.
- `npx vitest run tests/ci` → 2 files, 17 tests passed (~4.8 s).
- Run command (spec §10) checked by hand: failures=2 hang → two `timed out after 1 s` warnings, `attempt 3 of 3 succeeded`, exit 0; missing command → `could not start: spawn nosuchcmd ENOENT` ×2, `::error::… failed after 2 attempts`, exit 1; stray positional before `--` → usage, exit 2.
- `npm run format`, `npm run lint` (clean), `npm run typecheck` (clean). Full `npm test` left to the stop-hook gate.
- Size: ~436 added lines across 6 files vs. budget 360 (retry.js 183, retry.test.ts 172 after Prettier's one-arg-per-line wrapping, fixture 35, workflow test +41, ci.yml +4, README +4).

## FIX round 1 (Q-1)
- Item 1: fixed — new `tests/ci/retry.sudo.test.ts`, `describe.skipIf(!(linux && CI === 'true'))`: helper with 2 attempts × 2 s, 0 s delay around `sudo -n sh -c 'exec sleep "$1"' sh <unique 1000.nnnnnnnnn>` (the unique duration marks sudo, sh and sleep); asserts two `timed out after 2 s` warnings, exit 1 with the `::error::` last line, < 20 s, and `pgrep -f <marker>` empty (polled up to 2 s).
- Item 2: fixed — `killGroup` (now exported) ignores ESRCH, logs a short `retry: could not send … (EPERM)` note on EPERM and continues; other errors still throw. Unit tests spy on `process.kill` to throw EPERM/ESRCH/EINVAL.
- `npm run lint` clean, `npm run typecheck` clean, `npx vitest run tests/ci` → 3 files, 20 passed, 1 skipped (the sudo test, as expected on macOS). Full `npm test` left to the stop-hook gate.
