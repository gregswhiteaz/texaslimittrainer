# Build log — TASK-7.20

## BUILD
- Added `echo()` helper (20-char cut) at the three echo sites and the two-RangeError `chartCell` JSDoc in `src/advice/preflop-chart.ts`. `wordCount` unchanged (D-1).
- Wrote `tests/advice/preflop-chart-edges.acceptance.test.ts` (5 tests, SPEC-01..05); reuses `REPO_ROOT` from `tests/support/sandbox.ts`.
- `npx vitest run tests/advice/preflop-chart-edges.acceptance.test.ts` → 5 passed.
- Mutant check: replaced `text.match(/\p{L}+/gu)` with `text.match(/\S+/g)` → SPEC-01 test failed (1 failed, 4 passed); reverted by exact replacement, `cmp` against a pre-mutation copy → identical.
- `npm run format` → clean; `npm run lint` → clean; `npm run typecheck` → clean.
- `npm test` → 107 files passed; 376 tests passed, 6 skipped.
- `npm run chart:print` → prints the chart, no error.
- `grep -n "RangeError('Unknown hand class <hc>')" src/advice/preflop-chart.ts` → line 211.
- Scope: 2 files, ~153 changed lines vs budget 130 (within the 2x warn band; the test file copies the existing fixture helpers per spec §3).
