# TASK-10.7 — Changes

- `src/table/session-report.ts` — modified: `HintCounts`, optional `SessionReport.hints` (last key), counting in `sessionReport`, `parseHints` in `parseSessionReport`, `HintTile` and `hintTile(report)` (D-1, D-2, D-4).
- `src/ui/report/ReportScreen.tsx` — modified: renders the "Hints used" tile as the 4th item of the "Volume and errors" list.
- `src/ui/styles.css` — modified: `.report-hints` shares the tile rules; its `dd` is 18px.
- `tests/ui/report-hints.acceptance.test.tsx` — new: SPEC-01..03 (AC#1–#3).
- `tests/storage/session-end-hints.acceptance.test.ts` — new: SPEC-04 (AC#4, scripted 50-hand session in fake-indexeddb).
- `tests/table/session-report-hints.test.ts` — new: SPEC-05..07 (presence/key order/old reports, rounding and wording, validation).
- `tests/table/session-report-errors.test.ts` — modified (unit, not locked, D-3): key-order assertion now `slice(-4)` ending in `'hints'`.
- `e2e/report-hints.spec.ts` — new: SPEC-08 (Leave table shows the Hints used tile; Chromium and WebKit, axe, own-origin requests).
- `docs/storage/reports.md` — modified: `hints` field row, "hints" section, read validation, Tests list.
- `tests/table/session-report-leaks.test.ts` — modified (unit, not locked; same case as D-3, missed by the spec): key-order assertion now `slice(-4)` ending in `'hints'`.

No new dependencies.
