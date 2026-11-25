# TASK-11.6 changes

- `src/ui/report/ReportScreen.tsx` — optional `onStatistics` prop; controls in a `.report-actions` row at the end of `<main>`: View statistics (only when `onStatistics` is given) then Back to Home.
- `src/ui/App.tsx` — one `openStatistics()` handler used by Home's Statistics entry and the report's View statistics.
- `src/ui/styles.css` — `.report-actions` right-aligned flex row (like `.config-actions`).
- `docs/ui/navigation.md` — Session report and Statistics rows of the screen table; paragraph on View statistics from the report.
- `tests/ui/report-navigation.acceptance.test.tsx` — new: SPEC-01, SPEC-02 markup tests.
- `e2e/report-navigation.spec.ts` — new: SPEC-03, SPEC-04, SPEC-05 through the real App (Chromium and WebKit).

No new dependencies.
