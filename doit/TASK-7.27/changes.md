# Changes — TASK-7.27

- `src/advice/chart-print.ts` — added `formatChartForReview` (header, chart justification, each spot grid + `Why:` line), `ChartPrintIo`, `CHART_PRINT_USAGE` and `chartPrintMain` (size argument handling; exit 2 on bad input). Existing formatters unchanged.
- `tools/chart-print/main.ts` — now a thin entry: `process.exitCode = chartPrintMain(process.argv.slice(2), io)`.
- `tests/advice/chart-print-sizes.acceptance.test.ts` — new: spawns `npm run chart:print -- <size>` (SPEC-01..04).
- `tests/advice/chart-print-review.test.ts` — new: in-process unit tests for `chartPrintMain` and `formatChartForReview` (SPEC-05, SPEC-06).
- `doit/TASK-7.27/changes.md`, `doit/TASK-7.27/build-log.md` — builder records.

No new dependencies.
