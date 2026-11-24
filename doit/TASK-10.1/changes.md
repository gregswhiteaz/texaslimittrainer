# TASK-10.1 changes

## Created
- `src/table/session-report.ts` — headless `SessionReport`/`CashResult` types, `SessionEnder` interface, `sessionReport`, `bbPer100`, `parseSessionReport`, `signedDollars`, `signedTenths`, `reportView`. Fix brief 3: `parseSessionReport` rejects `cash.buyIn` ≠ `buyIn(stake)`.
- `src/ui/report/ReportScreen.tsx` — the Session Report screen (heading, header line, cash KPI tiles, Back to Home).
- `tests/table/session-report.acceptance.test.ts` — SPEC-01, SPEC-02, SPEC-06.
- `tests/storage/session-end.acceptance.test.ts` — SPEC-03, SPEC-04, SPEC-12.
- `tests/ui/report-screen.acceptance.test.tsx` — SPEC-05.
- `e2e/session-report.spec.ts` — SPEC-07, SPEC-09, SPEC-10, SPEC-11, SPEC-14.
- `docs/storage/reports.md` — the reports store, fields, rules and tests.
- `e2e/session-end-order.spec.ts` — fix brief 2: Leave clicked before the last hand's write is queued (grade replies held) still ends the session after that write.
- `tests/table/session-report.test.ts` — fix brief 3: parseSessionReport rejects a cash buy-in other than 20 big bets.

## Modified
- `src/storage/hand-store.ts` — DB version 3 with the `reports` store; `endSession` and `getReport`; `openHandStore`/`sharedHandStore` return `HandStore & SessionEnder`.
- `src/table/table-view.ts` — export `GAME_LABEL` (no behaviour change).
- `src/ui/App.tsx` — `ending` and `report` screens, the `leave(sessionId)` handler (Leave table ends the session); `goHome` shares `closeTable`. Fix brief 1: `endSession` runs from an effect of the `ending` screen, after the Table's final effects.
- `src/ui/table/Table.tsx` — `onLeave` receives the session id.
- `src/ui/table/TableScreen.tsx` — `onLeave` prop type takes the session id.
- `src/ui/table/useTableSession.ts` — also returns `sessionId`.
- `src/ui/styles.css` — report screen styles.
- `e2e/rebuy.spec.ts` — locked (TASK-3.11), D-4 (1): bust-dialog Leave test replaced by SPEC-08's test.
- `e2e/bust-continue.spec.ts` — locked (TASK-9.2), D-4 (2): Continue-then-Leave test replaced by SPEC-08's second test.
- `e2e/resume.spec.ts` — locked (TASK-2.6), D-4 (3): click `Home` instead of `Leave table`.
- `e2e/next-hand.spec.ts` — locked (TASK-3.4), D-4 (4): expect the `Session report` h1 focused.
- `e2e/home-control.spec.ts` — locked (TASK-2.14), D-4 (5): store names `['hands', 'reports', 'sessions']` (and its doc comment).
- `e2e/support/hand-records.ts` — raw-DB helpers open v3 and create `reports`; new `storedReports(page)`.
- `tests/storage/hand-store.test.ts` — `DB_VERSION` 3 and `REPORTS_STORE`; the "newer database" check opens at `DB_VERSION + 1` (a literal 3 now equals the app's version).
- `tests/table/hand-record.test.ts` — not listed in the spec; its corrupt-record setup opened the DB at the literal version 2, which now fails with `VersionError` and hung the test. It opens at `DB_VERSION` instead (not locked by any task).
- `docs/storage/sessions.md` — DB v3; `endedAt` written by `endSession`; Leave table ends the session.
- `docs/ui/navigation.md` — Session report screen row, Leave table ends the session, bust-dialog paragraph, Report history note, tests.
- `docs/storage/hand-records.md` — database version 3 in the table.

## Dependencies
- None added.
