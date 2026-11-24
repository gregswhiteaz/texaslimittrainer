# TASK-9.4 build log

## BUILD

- Added the summary model (`netResult`, `resultText`, `reviewSummary`) to `src/table/review.ts`; panel subtitle and
  replay line in `ReviewPanel`; `TableView` builds the summary from `completedHand(table)`; styles; fixtures
  `REVIEW_LOST_48`, `REVIEW_WON_56`; `review-header` scene; unit, acceptance and Playwright tests; docs.
- `npx vitest run tests/table/review-summary.test.ts tests/ui/review-header.acceptance.test.tsx` — 6 passed.
- `npm run lint`, `npm run typecheck` — clean.
- `npm test` — 251 files passed (3 skipped), 1221 tests passed, 43 skipped; coverage thresholds met.
- `npx vitest run tests/golden/` — 5 files, 282 tests passed.
- `npm run -s playtest -- --hands 10000 --seed 42` — 0 invariant violations.
- `npm run build && npx playwright test` — 240 passed, 16 skipped (Chromium and WebKit), including the new
  `e2e/review-header.spec.ts` and the locked review, review-numbers, bust-continue and showdown-shown specs.
- No locked test edited.
