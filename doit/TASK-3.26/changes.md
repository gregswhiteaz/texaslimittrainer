# Changes — TASK-3.26

- `src/table/hand-result.ts` — `PotResultView` gains `potText` ("Side pot $81") and `winnersText` ("Ben wins $41, Ava wins $40"); `text` is built from them (SPEC-05, A-4).
- `src/ui/table/Table.tsx` — the Pot winners item renders `p.potText` and `p.winnersText`; no `.join(` left in `HandResult` (SPEC-03, SPEC-05).
- `src/ui/styles.css` — `.hand-result-title` gets `white-space: nowrap; flex-shrink: 0`; `.hand-result:has(> ul[aria-label='Pot winners'])` stacks the title and lists in full-width rows (A-1, D-1); `.config-choice label` gets `box-sizing: border-box` so checked and unchecked options are both 44 px (A-3).
- `tests/support/table-scenarios.ts` — new crafted `SPLIT_SIDE_POT_SHOWDOWN` (main $60 → You, side $81 → Ben $41 / Ava $40; Ava's contribution +$1 and Ben/Ava stacks follow the awards so chips reconcile) (A-2).
- `e2e/support/table-scenes.tsx` — registers scene `split-side-pot`.
- `e2e/support/table-harness-bundle.ts` — adds `'split-side-pot'` to the `TableScene` union.
- `tests/table/side-pots.test.ts` — existing `toEqual` includes `potText`/`winnersText`; new case `pot result text is built from potText and winnersText` (SPEC-05), also checks the split scene's chips reconcile.
- `tests/ui/split-side-pot.acceptance.test.tsx` — new render test (SPEC-03).
- `e2e/side-pot-result.spec.ts` — new browser tests (SPEC-01, SPEC-02, SPEC-04); attaches `side-pot-result.png` / `split-side-pot-result.png`.
- `e2e/game-type-height.spec.ts` — new browser test (SPEC-06).
- `doit/TASK-3.26/changes.md`, `doit/TASK-3.26/build-log.md` — task records.

No new dependencies.
