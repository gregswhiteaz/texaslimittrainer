# TASK-1.44 changes

- `src/engine/hand.ts` — added a 7-line JSDoc above `foldOut` stating the reset rule (`currentBet`/`betCount` to 0, same as `endRound`), why (`gather` zeroes contributions; no betting round on a finished hand; bets stay in `actions`), and the pinning test. No code change.
- `tests/engine/fold-out.acceptance.test.ts` — new acceptance test pinning the rule for a preflop fold-out (SPEC-01) and a flop fold-out after a raise (SPEC-02).

No new dependencies.
