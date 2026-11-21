# Build log: TASK-1.15

## BUILD
- Engine: `showdownOrder` + `revealShown` in `src/engine/hand.ts`; awards among shown eligible hands. View model `shown` list, "Shown hands" UI list and muted style.
- Locked edits E1-E4 applied exactly as spec §5; U1 applied. No other locked test touched.
- New tests: showdown-order acceptance (7), unit (3), property (1), UI acceptance (1), e2e (1 x 2 browsers).
- Mutation check: settling pots main-first (temporary edit, reverted) fails 3 acceptance tests and the property test (`pot 1 paid []`).
- `npx vitest run tests/engine tests/table tests/ui` after the engine change + E1-E4/U1: 58 files, 196 tests passed.
- `npm run format`, `npm run lint`, `npm run typecheck`: clean.
- `npm test`: 126 files, 449 passed, 6 skipped; coverage thresholds met (all files 96.94% statements).
- `npx playwright test` showdown-shown, next-hand, review, table, table-display: 40 passed (Chromium + WebKit).
- `npm run e2e` (full, includes cards.visual): 100 passed. The visual baselines cover only the card gallery, not the hand-result block, so no baseline (Linux or darwin) needs to change.
- `npm run playtest -- --hands 10000 --seed 42 --size 6`: exit 0; output diffed against a run with main's `src/engine/hand.ts` — byte-identical (fold 5470, showdown 4530, actions 88831, capped 244, largest $70, violations 0).
- Extra file beyond spec §5 list: `e2e/support/table-harness-bundle.ts` (one-line `TableScene` union addition so `openTableScene` accepts `'shown-hands'`).
