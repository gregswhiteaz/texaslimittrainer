# TASK-9.4 changes

- `src/table/review.ts` — new `ReviewSummary`, `netResult(hand)`, `resultText(net)`, `reviewSummary(hand, handNumber)` (position via `positionName`).
- `src/ui/table/ReviewPanel.tsx` — optional `summary` prop; `.review-title` wrapper with the result / "Your hole cards" / position subtitle and the replay line.
- `src/ui/table/Table.tsx` — `TableView` passes `summary` built from `completedHand(table)` and `table.handNumber` (null before a result).
- `src/ui/styles.css` — `.review-head` aligns to the top; `.review-title`, `.review-summary` (14 px, 24 × 34 cards), `.review-replay` (12 px, wraps), monospace replay code.
- `tests/support/table-scenarios.ts` — new fixtures `REVIEW_LOST_48` (hand 133) and `REVIEW_WON_56`.
- `tests/table/review-summary.test.ts` — new: SPEC-04, SPEC-05 unit tests.
- `tests/ui/review-header.acceptance.test.tsx` — new: SPEC-01, SPEC-02, SPEC-03.
- `e2e/review-header.spec.ts` — new: SPEC-06 (live app), SPEC-07 (scene), Chromium and WebKit.
- `e2e/support/table-scenes.tsx` — `review-header` scene (REVIEW_LOST_48 with its open review).
- `e2e/support/table-harness-bundle.ts` — `'review-header'` added to `TableScene`.
- `docs/ui/review.md` — retitled; new "Header" section.

No new dependencies.
