## BUILD (2026-11-20)
- Replaced `killGroup` (retry.js, logs EPERM to stdout) in `runProcessGroup` with a local silent `killGroupQuietly`; added the SPEC-01 unit test.
- New test fails against the old `process-group.ts` (1 failed / 2 passed) and passes with the fix.
- `npx vitest run tests/support/sandbox-timeout.acceptance.test.ts tests/support/process-group.test.ts`: 5/5 passed.
- SPEC-03: 42 busy node processes (3 x 14 cores, tagged `TLH149LOADMARK`, killed via an EXIT trap), 10 consecutive runs of the locked file: `passed 10/10`; `pgrep -f TLH149LOADMARK` afterwards: 0 left.
- Locked test sha256 unchanged: 41ab930ea2bfb3c0a63a017560e6acad3c094c3528865a52d78dcfae17471b66.
- `npm run format` ok, `npm run lint` ok, `npm run typecheck` ok, `npm test`: 101 files passed, 363 passed / 6 skipped.
- Diff: 2 files, +51/-5.
