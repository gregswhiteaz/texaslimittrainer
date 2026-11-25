## BUILD (TASK-10.5)

- Added `src/stats/leak-categories.json` (15 entries, text copied verbatim from spec §5 "Category content") and `src/stats/leaks.ts` (validation, classification, counting, leak rule, evidence, `sessionLeaks`).
- `src/table/session-report.ts`: optional `street`/`action` on `ReportDecision`; `leakCounts` computed with `errors` (key order style, errors, leakCounts); `parseLeakCounts`.
- `src/ui/report/ReportScreen.tsx`: `LeaksSection` (no hooks/effects; computed during render); CSS in `src/ui/styles.css`.
- Tests: `tests/stats/leaks.acceptance.test.ts` (6), `tests/stats/leaks.test.ts` (2), `tests/table/session-report-leaks.test.ts` (2), `tests/ui/report-leaks.acceptance.test.tsx` (2), `e2e/report-leaks.spec.ts` (1 × Chromium/WebKit).
- Docs: `docs/stats/leaks.md` (new), `docs/storage/reports.md` (leakCounts).
- Unlocked test updated: `tests/table/session-report-errors.test.ts:77` pinned the last two report keys `['style', 'errors']`; now asserts the last three `['style', 'errors', 'leakCounts']` (style and errors order still checked; nothing dropped).
- Commands: `npm run lint && npm run typecheck && npm test` — first run 1 failed (the key-order pin above) / 1302 passed / 44 skipped; after the fix the file passes 3/3. `npm run build && npx playwright test` — 304 passed, 16 skipped, 0 failed (report-leaks passes in Chromium and WebKit).
- Final run: `npm run lint && npm run typecheck && npm test` exit 0 — 279 files passed / 4 skipped; 1303 tests passed / 44 skipped; coverage thresholds met (`src/stats/leaks.ts` 100% lines).
