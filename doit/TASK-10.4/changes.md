# TASK-10.4 changes

- `src/table/session-report.ts`: `ReportDecision`, optional `ReportHand.decisions`, `ErrorCounts`, optional `SessionReport.errors` counted in `sessionReport` (unhinted Major / Minor, present iff every hand carries decisions), `parseErrors` validation in `parseSessionReport`, `RateTile` and `rateTiles(report)` (hands played, rates via `bbPer100(count, 1, handsPlayed).toFixed(1)`).
- `src/ui/report/ReportScreen.tsx`: the "Volume and errors" `<dl>` with `.report-rate` tiles between the cash tiles and the style section, only when `report.errors` is present.
- `src/ui/styles.css`: `.report-rate` shares the `.report-kpi` tile rules.
- `tests/ui/report-errors.acceptance.test.tsx` (new): SPEC-01, 02, 03, 06.
- `tests/table/session-report-errors.test.ts` (new): SPEC-05, 07, 08.
- `tests/storage/session-end-errors.acceptance.test.ts` (new): SPEC-04 (scripted 200-hand session, fake-indexeddb).
- `e2e/report-errors.spec.ts` (new): SPEC-09.
- `docs/storage/reports.md`: `errors` field row and section (count rule, rate formula, legacy reports), validation, tests list.

No new dependencies.
