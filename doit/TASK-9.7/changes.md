# TASK-9.7 changes

- `src/table/review.ts` — `AfterHandReview` / `afterHandReview(hand, autoOpen)` ('panel' | 'badge' | 'none') and `ReviewBadge` / `reviewBadge(grades)` (text, worst grade, accessible name).
- `src/ui/table/Table.tsx` — `TableProps.autoOpenReview` (default true, read through a ref at hand end), badge state filled from the stored entries at grading, cleared on click / Deal next hand / a new hand number; `TableViewProps.reviewBadge` / `onOpenReview` and the `button.review-badge` (only after the result with no held review). Clicking it holds that hand's review.
- `src/ui/styles.css` — `.review-badge` (Deal next hand slot, 44 px), `data-worst` colours and focus ring.
- `e2e/support/records-harness.tsx` — `data-auto-open="0"` renders `<Table autoOpenReview={false}>`.
- `e2e/support/table-harness-bundle.ts` — `RecordsHarnessOptions.autoOpen` (default true) → `data-auto-open`.
- `tests/table/review-badge.acceptance.test.ts` — SPEC-01..SPEC-03 (badge text/worst, panel vs badge vs none, call-then-fold vs lone fold).
- `tests/ui/review-badge.acceptance.test.tsx` — SPEC-04, SPEC-05 (rendered badge button, text and colours).
- `e2e/review-badge.spec.ts` — SPEC-06..SPEC-09 live flows (Chromium, WebKit): badge + 1.5 s deal + axe + same-origin, click opens held review, lone preflop fold shows no badge, auto-open on shows the panel.
- `docs/ui/review.md` — "Grade summary badge (auto-open off)" section; title adds TASK-9.7.

No new dependencies.
