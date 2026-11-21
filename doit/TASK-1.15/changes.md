# Changes: TASK-1.15

- `src/engine/hand.ts` — private `showdownOrder` (REQ-019.4: rotate to the last river bet/raise seat, counted or not, A-1; else left of the button, D-3) and `revealShown` (REQ-019.5/.8: pots settled last side pot to main, show if ties/beats the best face-up eligible hand, mucks stay mucked, lone-seat pots skipped, A-3/A-5); `endRound` awards each pot among shown eligible hands (lone-seat pot to its seat); `HandResult.showdown` doc comment.
- `src/engine/player-view.ts` — `showdownOf` doc comment (only shown hands, in showdown order).
- `src/table/hand-result.ts` — `ShownHandView`, `HandResultView.shown` (shown seats with no award share, in showdown order); shared seat-name lookup with the existing RangeError.
- `src/ui/table/Table.tsx` — `<ul aria-label="Shown hands">` after Winners with `li[data-shown-seat]` lines, hand name and two cards (Q-3).
- `src/ui/styles.css` — muted regular-weight style for shown-hands lines (Q-3).
- `tests/engine/showdown-order.acceptance.test.ts` — new: SPEC-01..07 (W1-W5).
- `tests/engine/showdown-order.test.ts` — new: SPEC-09..11 (W6-W8).
- `tests/engine/showdown-order.property.test.ts` — new: SPEC-12 (5,000 seeded random all-in hands).
- `tests/ui/hand-result-shown.acceptance.test.tsx` — new: SPEC-08.
- `tests/support/table-scenarios.ts` — exports `SHOWN_HANDS` (W9).
- `e2e/support/table-scenes.tsx` — scene `'shown-hands'` → `SHOWN_HANDS`.
- `e2e/support/table-harness-bundle.ts` — `TableScene` union gains `'shown-hands'` (needed for `openTableScene`; not in the spec's file list).
- `e2e/showdown-shown.spec.ts` — new: SPEC-14.
- `tests/table/hand-result.test.ts` — U1: expected KINGS_SHOWDOWN view gains `shown: []`.
- `tests/engine/hand.acceptance.test.ts` — locked edit E1: `[2, 5]` → `[2]`.
- `tests/engine/hand.property.test.ts` — locked edit E2: shown seats must equal the computed REQ-019.4/.5 running-max list (exact, same failure string).
- `tests/engine/side-pots.acceptance.test.ts` — locked edit E3: sorted `[1, 3, 4]` → exact `[3]`.
- `tests/ui/user-shown-cards.acceptance.test.tsx` — locked edit E4: `[1, 2, 3, 5]` → `[1, 2, 3]` and the line-16 comment.

New dependencies: none.
