# Changes — TASK-9.1

- `src/table/review.ts` — created: headless review model (`ReviewEntry`, `STREET_LABELS`, `opensReview`, `reviewEntries`) grading each user decision with `gradeView`.
- `src/ui/table/ReviewPanel.tsx` — created: the Hand Review panel (complementary landmark, heading focus, Close review, graded entries with board cards and text badges).
- `src/ui/table/Table.tsx` — modified: optional `review` / `onDealNext` / `onCloseReview` / `dealNextRef` props on `TableView`, `.table-layout` / `.table-main` wrapper, Deal next hand button; `Table` holds review state, a stable `onHandComplete`, the hold, Close (focus to Deal next hand) and Deal next hand.
- `src/ui/table/useTableSession.ts` — modified: returns `dealNext` (one `newCode()` outside the updater, deals only when the hand is done).
- `src/ui/styles.css` — modified: layout row, review panel, entries, grade badges, Deal next hand styles.
- `tests/support/table-scenarios.ts` — modified: `userTableAfter` helper and `REVIEW_FOUR`, `CALL_THEN_FOLD`, `PREFLOP_FOLD_ONLY`, `BB_WALK`, `RAISE_TAKES_BLINDS`.
- `tests/table/review.acceptance.test.ts` — created: SPEC-01, SPEC-02, SPEC-04, SPEC-08.
- `tests/table/review.test.ts` — created: SPEC-09 model edges.
- `tests/ui/review-panel.acceptance.test.tsx` — created: SPEC-03 rendered panel and table side.
- `e2e/review.spec.ts` — created: SPEC-05, SPEC-06, SPEC-07 browser flows (Chromium and WebKit).
- `doit/TASK-9.1/review-open.png`, `doit/TASK-9.1/review-closed.png` — created: requested 1280×720 Chromium screenshots (panel open; after Close with Deal next hand).

No new dependencies.
