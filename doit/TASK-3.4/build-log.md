## BUILD (2026-11-18)
- Implemented spec §5: `minimumStack` (engine, A-8), `nextHand`/`nextHandDelay`/`TableState.button` and the Q-4
  top-up with the verbatim TEMPORARY comment, `handResultView`/`handName`, next-hand timer with `holdNextHand`,
  result block in `Table.tsx`, A-5 throws in `completedHand` and `tableView`.
- Test edits to earlier stories: E1, E2 (`e2e/table.spec.ts`), E3 (`e2e/action-bar.spec.ts`), E4
  (`tests/support/table-scenarios.ts`) only; typecheck + lint run after each edit (exit 0).
- SPEC-11: seeds `replayCodeFromWords([7, k, 2, 3])`, k = 1..60, already produce at least one Q-4 top-up; no change
  of seed range needed.
- Scripted states checked under Node type stripping (`node --import ./tools/playtest/resolve-ts.js`): KINGS_SHOWDOWN
  Ben $122 "Pair of kings" stacks [158,222,160,160,100,160]; AVA_UNCONTESTED Ava $16; SPLIT_STRAIGHT 30/30
  Straight; SHOWDOWN "You win $54" "Pair of nines".
- `npx vitest run` on the 4 new Vitest files: 12 passed.
- `npm run e2e` (Chromium + WebKit): 80 passed (run twice; second run after the result CSS change).
- `npm run playtest -- --hands 10000 --seed 42`: 10000 hands, 0 invariant violations, exit 0.
- `npm run typecheck`, `npm run lint`, `npm run format`: exit 0.
- Screenshots: `doit/TASK-3.4/result-showdown.png`, `doit/TASK-3.4/result-uncontested.png` (1280×720, Chromium,
  taken with a temporary spec that was deleted).
- Full `npm test` left to the stop-hook gate (no other Vitest run active).
