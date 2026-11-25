# TASK-10.8 — Build log

## BUILD
- `src/stats/leaks.ts`: added `MAX_SHOWN_LEAKS = 3` and a non-exported comparator (Major desc, error rate desc via
  `errors × decisions` cross-products, errors desc, LEAK_CATEGORIES index); `sessionLeaks` collects leaks, sorts,
  slices to 3. `ReportScreen.tsx`: doc comment only. Stored `leakCounts` untouched.
- Tests: new `tests/ui/report-leak-ranking.acceptance.test.tsx` (AC#1–#3, 3 tests); new `it` in
  `tests/stats/leaks.test.ts` (SPEC-04). No locked test edited.
- Docs: `docs/stats/leaks.md` ranking rule, example, cap, display-time ranking, test list.
- `npx prettier --write` on all touched files.
- `npm run lint` — pass. `npm run typecheck` — pass.
- `npm test` — 288 files passed / 4 skipped; 1333 tests passed / 45 skipped; coverage thresholds met.
- `npm run build && npx playwright test e2e/report-leaks.spec.ts e2e/session-report.spec.ts` — 12 passed (Chromium + WebKit).
