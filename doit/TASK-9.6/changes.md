# TASK-9.6 changes

- `src/ui/table/ReviewPanel.tsx` — grade badge and the new "hinted" tag (`data-part="hinted"`, shown iff `entry.decision.hinted`) inside a `review-verdict` group.
- `src/ui/styles.css` — `.review-entry-top` wraps (`row-gap: 6px`); new `.review-verdict` (takes the badge's `margin-left: auto`) and `.hinted-tag` (outlined pill).
- `tests/ui/review-hinted.acceptance.test.tsx` — rendered-panel acceptance tests SPEC-01..SPEC-04 (fixtures via `userTableAfter(..., hints)`).
- `e2e/review-hinted.spec.ts` — live records-harness flows SPEC-05 (Hint at the flop) and SPEC-06 (Hint opened and hidden at the first decision), Chromium and WebKit, axe, same-origin requests.
- `docs/ui/review.md` — "Hinted tag" section, `hinted` row in the entry table, title adds TASK-9.6.

No new dependencies.
