## BUILD (TASK-10.1)
- Added `src/table/session-report.ts`, DB v3 `reports` store with `endSession`/`getReport`, `ReportScreen`, App `leave` flow (`ending`/`report` screens), session id passed through `Table`/`TableScreen`/`useTableSession`.
- Tests: 3 new Vitest files (SPEC-01..06, SPEC-12), `e2e/session-report.spec.ts` (SPEC-07, 09, 10, 11, 14), D-4 edits (1)–(5) to the five unlocked e2e files, unlocked updates to `tests/storage/hand-store.test.ts` and `tests/table/hand-record.test.ts` (stale v2 literal) and `e2e/support/hand-records.ts` (v3).
- Docs: new `docs/storage/reports.md`; updated `docs/storage/sessions.md`, `docs/ui/navigation.md`, `docs/storage/hand-records.md`.
- `npm run typecheck` pass; `npm run lint` pass.
- `npm test`: 259 files passed, 3 skipped; 1244 tests passed, 43 skipped.
- `npx vitest run tests/golden/`: 282 passed. `npm run -s playtest -- --hands 10000 --seed 42`: 0 invariant violations.
- `npm run build && npx playwright test` (full suite, Chromium + WebKit): 268 passed, 16 skipped (opt-in slow tests).
