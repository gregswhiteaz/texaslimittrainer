# TASK-10.6 — Build log

## BUILD
- Appended the 16 preflop entries to `src/stats/leak-categories.json` (text copied verbatim from spec §5).
- `src/stats/leaks.ts`: union `LeakCategory`, street-first validation then per-street key sets, `positionGroup`, `preflopAction`, `decisionCategory(street, action, spot?)`, `handCategoryDecisions` (pairs j-th decision with the user's j-th non-blind record; tracks preflop `raise` records).
- `src/table/session-report.ts`: `button?` on `ReportHand`; `leakCounts` via `handCategoryDecisions`.
- D-3 edit to the locked `tests/stats/leaks.acceptance.test.ts` (exact-15 on postflop subset kept; 16 preflop ids check added). Unit test path updated per SPEC-09.
- New tests: `tests/stats/preflop-leaks.acceptance.test.ts`, `tests/stats/preflop-leaks.test.ts`, `tests/ui/report-preflop-leaks.acceptance.test.tsx`. Docs updated.
- Commands:
  - `npm run lint` — pass. `npm run typecheck` — pass.
  - `npm test` — 284 files passed / 4 skipped; 1322 tests passed / 45 skipped; coverage thresholds hold (93.88% statements overall).
  - `npm run build && npx playwright test e2e/report-leaks.spec.ts e2e/report-errors.spec.ts e2e/session-report.spec.ts` — 14 passed (Chromium + WebKit).
- Scope: ~1180 changed lines vs budget 950 (warn band; new tests ~670 lines and the 16-entry content table in docs).
