## BUILD 1 (2026-11-21), blocked

- Done: the session.ts union and helpers, headerText, userActionBar unit, GameConfigScreen radio group and conditional rows, CSS, the STORYBOARD_CONFIG annotation, and the two D-5 amendments.
- `npm run typecheck`: clean. `npx eslint src/table src/ui/config tests/support`: clean.
- `npx vitest run`: 1 failed | 505 passed | 7 skipped (513). The failure is locked TASK-3.4 `tests/table/next-hand.acceptance.test.ts` (source scan for `< minimum ? buyIn(`). The spec's top-up line `startingStack(table.config)` cannot satisfy it, and spec §3 wrongly lists the test as unaffected. Stopped and wrote blocked.json.
- Not yet written: the new tests (game-type.acceptance/.test, game-config-game-type.acceptance, e2e/game-type-choice.spec.ts). Not yet run: e2e, format, gate.

## BUILD 2 (2026-11-21), after the fix brief (Option 2)

- Fix brief, block resolution: done. The top-up is now `stack < minimum ? buyIn(tableStake(table.config)) : stack`, and the locked TASK-3.4 source scan passes untouched. DEVIATION from A-3/SPEC-08: a short sit-and-go seat refills to 800 (20 big bets at 20/40), not 1,500. Starting stacks are still 1,500. TASK-3.21 removes the top-up. The SPEC-08 test keeps its spec-given name ("...tops up to its 1500 starting stack") but asserts 800, with a comment pointing to this deviation. Deleted blocked.json.
- Wrote the new tests: game-type.acceptance (3), game-type (2), game-config-game-type.acceptance (3), and e2e game-type-choice (2 tests x 2 browsers).
- `npx playwright test e2e/game-type-choice.spec.ts`: 4 passed (Chromium + WebKit).
- `npm run e2e`: 126 passed, 6 skipped.
- `npm run format`, then `npm run lint`: clean (eslint + prettier). `npm run typecheck`: clean.
- `npm test`: 146 files passed, 1 skipped. 514 tests passed, 7 skipped. Coverage across all files: 96.8% statements.
- `npm run playtest -- --hands 10000 --seed 42`, with and without `--game sng`: 0 invariant violations each.
