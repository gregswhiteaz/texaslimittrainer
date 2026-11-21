# Fix brief — TASK-1.9 (judge round 1 LOW findings, applied in-story)

Judge round 1: 16/17 PASS, no blocking findings. Add two test-only pins (no src changes):

1. **J-1-02 / code review MINOR** — in `tests/engine/hand.test.ts` (unlocked), extend or add next to the `exactCall`
   case: a seat calls its whole stack exactly (e.g. $8 on the flop), play the hand to its end; assert
   `result.returned` is undefined and the award equals the full pot (sum of all contributions). Also the runout
   variant (only one other seat can still bet → board runs out at once, nothing returned).
2. **J-1-01** — in an unlocked playtest test (e.g. `tests/playtest/runner.test.ts` or the existing unit test for
   `summarize`/`largestPot`), pin that Largest pot counts returned chips: a walk gives $6, a flop fold-to-raise gives
   $36 (values from the judge's holdout).

Optional NIT: rename the local `backed` to `returnedToSeat` in `src/engine/invariants.ts:151`.
Keep it small. Don't touch locked files. Run `npm run format` before the gate.
