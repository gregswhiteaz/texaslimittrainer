# Build log — TASK-7.27

## BUILD
- Added `formatChartForReview`, `ChartPrintIo`, `CHART_PRINT_USAGE`, `chartPrintMain` to `src/advice/chart-print.ts`;
  `tools/chart-print/main.ts` is now a thin entry setting `process.exitCode`.
- New tests: `tests/advice/chart-print-sizes.acceptance.test.ts` (SPEC-01..04, spawns npm) and
  `tests/advice/chart-print-review.test.ts` (SPEC-05, SPEC-06).
- Commands: `npm run format` (ok), `npm run lint` (exit 0), `npm run typecheck` (exit 0), focused chart-print tests
  (3 files, 9 tests passed, locked TASK-7.19 test unchanged and passing), `npm test` (328 files passed, 7 skipped;
  1462 tests passed, 52 skipped; no coverage error).
- Manual: `npm run chart:print -- heads-up|full-ring|6-max` print headers `heads-up chart: 6 spots`,
  `full-ring chart: 41 spots`, `6-max chart: 26 spots`; no-argument output is byte-identical to
  `doit/TASK-7.19/chart-print.txt`; `-- 9max` prints the two-line error to stderr and exits 2.
