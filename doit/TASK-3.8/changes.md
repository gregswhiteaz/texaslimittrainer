# TASK-3.8 changes

- `src/table/table-view.ts` — `PotLineView`, `potLabel()`, `potLines()` and `TableViewModel.pots` (felt pot lines while side pots exist; street bets on the last line).
- `src/table/hand-result.ts` — `PotResultView` and `HandResultView.pots` (one line per award when there are ≥ 2); shared `winText` wording.
- `src/ui/table/Table.tsx` — renders the felt "Pots" list in place of `Pot $N` and the result "Pot winners" list before Winners.
- `src/ui/styles.css` — `.table-pots` (flex row, `.table-pot` font).
- `tests/support/table-scenarios.ts` — `SIDE_POT_DECK`, `SIDE_POT_MOVES`, `SIDE_POT_RIVER`, `SIDE_POT_SHOWDOWN`.
- `e2e/support/table-scenes.tsx` — registers scenes `side-pot-river`, `side-pot-showdown`.
- `e2e/support/table-harness-bundle.ts` — adds the two scene names to the `TableScene` union (needed for typecheck; not in the spec's file list).
- `tests/table/side-pots.test.ts` — unit tests SPEC-05, SPEC-06.
- `tests/ui/side-pots.acceptance.test.tsx` — acceptance tests SPEC-01..04.
- `e2e/side-pots.spec.ts` — browser acceptance SPEC-07 (Chromium + WebKit).

No new dependencies.
