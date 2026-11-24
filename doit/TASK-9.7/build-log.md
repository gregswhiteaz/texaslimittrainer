# TASK-9.7 build log

## BUILD
- Added `afterHandReview` / `reviewBadge` to `src/table/review.ts`. `Table` gets `autoOpenReview` (read through a
  ref at hand end), badge state filled at `onHandGraded`, `openReview` on click, and the badge is cleared on Deal
  next hand and on a new hand number. The hand-number clear is a render-time state adjustment, not the spec's
  `useEffect`, because the `react-hooks/set-state-in-effect` lint rule rejects `setState` in an effect body. The
  behaviour is the same (A-6).
- `TableView` renders `button.review-badge` only when `result !== null && review === null`. CSS per A-4. Records
  harness `autoOpen` option.
- Tests: `tests/table/review-badge.acceptance.test.ts` (3), `tests/ui/review-badge.acceptance.test.tsx` (2),
  `e2e/review-badge.spec.ts` (4 tests x Chromium/WebKit).
- Commands: `npm run lint` clean; `npm run typecheck` clean; `npm test` 256 files passed / 3 skipped, 1237 tests
  passed / 43 skipped; `npx vitest run tests/golden/` 282 passed; playtest 10,000 hands seed 42: 0 invariant
  violations; `npx playwright test e2e/review-badge.spec.ts` 8 passed; full `npm run build && npx playwright test`
  258 passed, 16 skipped. `npx prettier --write` on every touched file.
