## BUILD (2026-11-19)
- `tools/ci/retry.js`: D-1..D-4 as specified (no new log lines, constants unchanged).
- `tests/ci/retry.reap.test.ts`: SPEC-01..SPEC-05 (SPEC-05 skipped off Linux CI). Against the old retry.js all 5 local tests fail; against the new one they pass.
- `npx vitest run tests/ci/retry.sudo.test.ts tests/ci/retry.test.ts tests/ci/retry.reap.test.ts`: 20 passed, 4 skipped (Linux CI only).
- Run command (macOS) x3: `could not send SIGKILL ... (EPERM)` once, no `sudo` line, timed out after 0.5 s, `failed after 1 attempts`, exit 1.
- `npm test`: 88 files, 324 passed, 5 skipped. `npm run lint`, `npm run typecheck`: clean. `npm run format` run.
- SPEC-05 and the Linux-CI part of SPEC-06 need the branch push (orchestrator).
