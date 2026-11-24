# TASK-9.5 changes

- `src/table/review.ts` — `ShownOpponent` and `shownOpponents(hand)`: opponents in `CompletedHand.shown`, showdown order, user left out.
- `src/ui/table/ReviewPanel.tsx` — optional `shown` prop; "Shown at showdown" list between the header and the Decisions list.
- `src/ui/table/Table.tsx` — `reviewHeader` now returns `{ summary, shown }` from one `completedHand(table)`; spread into `ReviewPanel`.
- `src/ui/styles.css` — `.review-shown` rules (14 px, wrapping rows, 24 × 34 px cards).
- `tests/support/table-scenarios.ts` — `REVIEW_DEE_MUCKS` fixture (Ben shows Kd 7c, Dee mucks 5c 5d).
- `e2e/support/table-scenes.tsx` — `review-shown` and `review-fold-out` scenes with an open review.
- `e2e/support/table-harness-bundle.ts` — both scene names added to `TableScene`.
- `tests/table/review-shown.test.ts` — unit tests of `shownOpponents` (SPEC-06).
- `tests/ui/review-shown.acceptance.test.tsx` — rendered panel and panel-data acceptance tests (SPEC-01..05).
- `e2e/review-shown.spec.ts` — scenes and live-app Playwright tests, Chromium and WebKit, axe (SPEC-07, SPEC-08).
- `docs/ui/review.md` — "Shown hands" section, title adds TASK-9.5, Security line.

No new dependencies.
