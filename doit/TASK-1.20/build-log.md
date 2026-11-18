## BUILD (2026-11-17)
- Added `tests/support/speed.ts` helper + unit test; gated speed asserts in both perf suites and the bounded-work ceiling; exported `sandboxEnv`; added nested-Vitest acceptance test (no `--coverage` in nested runs); README "Speed targets" section.
- `npx vitest run tests/support/speed.test.ts tests/ci/speed-limits.acceptance.test.ts tests/advice/equity.test.ts` → 3 files, 8 passed.
- `CI=true npx vitest run tests/advice/equity.test.ts -t "bounds the work"` → 1 passed, 4 skipped.
- SPEC-05 `git diff 9c581c5 … | grep` threshold lines → empty.
- `npm run format`, `npm run lint`, `npm run typecheck` → clean. Full `npm test` left to the stop-hook gate.

## FIX round 1
- Item 1 (summary-regex-breaks-with-forced-color): fixed. In `runPerfSuites`, the nested env now deletes `FORCE_COLOR` and sets `NO_COLOR='1'`, and captured output is stripped of ANSI SGR escapes before matching. The assertions are unchanged.
- `npx vitest run tests/ci/speed-limits.acceptance.test.ts` → 2 passed; `FORCE_COLOR=1 npx vitest run tests/ci/speed-limits.acceptance.test.ts` → 2 passed. eslint and prettier clean on the file. Full `npm test` left to the stop-hook gate.
