## BUILD (2026-11-21) — blocked

Done so far:
- Locked edits E1–E6, applied exactly as the spec lists them.
- Engine: $1 floor, all-in blinds, D-1/D-2/D-3 (`bettingOver`), `nextButton`.
- `checkDeal`.
- Runner: games, carried stacks, rebuy/restart, word 2, deal check.
- CLI: `--game`/`--stacks`, the new lines, blind text, the deal violation block.
- `tests/engine/hand.test.ts` floor cases.

Commands:
- `npx vitest run tests/engine`: after the hand.test.ts floor update, all pass except as noted below.
- `npx vitest run` (full suite): 444 passed, 5 failed, 6 skipped.
  - FAIL tests/engine/bet-cap.acceptance.test.ts AC#4 (locked, TASK-1.12): overCap 7. The failing streets are short all-in raises under half a bet (REQ-016.5), now possible because stacks carry over.
  - FAIL tests/table/next-hand.test.ts (unit, TASK-3.4): expects a $4 stack to throw.
  - FAIL tests/playtest/cli.test.ts x3: not updated yet (SPEC-15 work pending).
- `npx tsc -p tsconfig.json --noEmit`: 2 errors.
  - tests/engine/bet-cap.acceptance.test.ts(233): `firstViolation.violation` possibly null under D-7. This is a locked file.
  - tests/playtest/cli.test.ts(375): the HandRecord fixture needs `game`/`size`. Pending.
- Probes (temp scripts, deleted):
  - Cash seed 42 over 10,000 hands: rebuys 13, all-in hands 24, side-pot hands 5, violations 0, largest pot $70.
  - sng seed 42 over 10,000 hands: only 1 completed sit-and-go (hand 5716). Heads-up starts at hand 1768; 6597 heads-up hands; 0 violations.
  - The single completed sit-and-go is a §11 stop condition.
  - The playtest acceptance tests run so far are green: summary, invariants, heads-up, runner, playtest.

Stopped per §11: wrote blocked.json. Not done yet:
- the new test files (button-blinds, all-in-blinds, check-deal, games);
- the cli.test/runner.test updates;
- the final playtest baselines.

## BUILD (continued after fix brief) — 2026-11-21

Fix brief items:
1. E7 is fixed. `betsPerStreet` in `tests/engine/bet-cap.acceptance.test.ts` now counts only REQ-016.5 counted bets: the big blind, or a bet/raise adding at least half a unit over the street's last counted level. It computes this in the test itself. Line 233 now reads `violation?.violations`. All other assertions are kept. AC#4 passes.
2. SPEC-10 (Q-6) is fixed. `games.acceptance` AC#6 asserts at least 1 completed sit-and-go, and that the hand right after the first completion has every seat at 1500 with the button at 1. It still asserts hands with fewer than 6 seats > 0, heads-up hands > 0, and busted-seat skips > 0.
3. `tests/table/next-hand.test.ts` is fixed: the floor case now uses stack 0.
4. The remaining work is done:
   - new files `button-blinds.acceptance`, `all-in-blinds`, `check-deal`, `games.acceptance`;
   - `cli.test.ts` and `runner.test.ts` updated;
   - `npm run format` run;
   - `blocked.json` deleted.
   - One code fix found by `check-deal.test.ts`: a seat missing from `previous` must be expected at 0 even with a rebuy (spec §5).

Commands:
- `npm run lint`: exit 0.
- `npm run typecheck`: exit 0.
- `npm test`: 130 files; 465 passed, 6 skipped. Coverage is 97.38% lines overall, and the thresholds hold.
- Both 10,000-hand playtests below exited 0. Each was run twice; the two runs were byte-identical. The default run equals `--game cash`.

### New cash baseline (`npm run playtest -- --hands 10000 --seed 42`, 0.79 s)
```
TLH Trainer playtest
Options: --hands 10000 --seed 42 --size 6
Table: 6 players, cash $4/$8, stacks carry over, a busted seat rebuys for $160
Hands played: 10000
Ended by fold: 5461
Ended at showdown: 4539
Player actions: 88746
Streets capped at 4 bets: 242
Largest pot: $70
First replay code: 000000000000002a0000000000000001
Last replay code: 000000000000002a0000000000002710
Invariant violations: 0
```

### New sng baseline (`npm run playtest -- --hands 10000 --seed 42 --game sng`, 0.50 s)
```
TLH Trainer playtest
Options: --hands 10000 --seed 42 --size 6 --game sng
Table: 6 players, sit-and-go 20/40 (blinds 10/20), 1500 chips each, busted seats sit out, a new sit-and-go starts when one player has all the chips
Hands played: 10000
Ended by fold: 8061
Ended at showdown: 1939
Player actions: 57692
Streets capped at 4 bets: 870
Largest pot: $880
First replay code: 000000000000002a0000000100000001
Last replay code: 000000000000002a0000000100002710
Invariant violations: 0
```

## FIX round 1
- [MAJOR] check-deal C5 untested: fixed. Added `phantomReturn` (W7 dealt-out, returned {seat 1, $3}, seat 1 +3, seat 2 -3); asserts checkState is [] and checkDeal is chips 'seat 1 got $3 back but $0 was uncalled'. Mutant `? returnedMessage(state)` -> `? null` fails it; restored.
- [MINOR] restart-after-violation: fixed. onAction now flags the action whose result completes the hand; test asserts 3 hands, each with a result and 1 violation, button 1 and buy-in stacks. Mutant dropping `hand.violations > 0 ||` in runner.ts fails it (expected 2 to be 1); restored.
