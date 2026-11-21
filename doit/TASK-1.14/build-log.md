# Build log: TASK-1.14

## BUILD
- Implemented the §5 rule in `src/engine/hand.ts` (`fullBetLevel`, all-in amount, `!hasActed` gate, counted-only
  `betCount`/`hasActed` reset) and the independent checker derivation in `src/engine/invariants.ts`.
- D-3: updated `tests/engine/hand.test.ts` "$6 behind" assertion to `[fold, call 4, raise 6]` (equally strict).
- Wrote `tests/engine/short-all-in.acceptance.test.ts` (7 tests, SPEC-01..07), `tests/engine/short-all-in.test.ts`
  (5 tests, SPEC-08..12; every scripted step asserts `checkStep(...) === []`) and
  `tests/engine/short-all-in.property.test.ts` (1 test, SPEC-13, ~0.6 s).
- No deviations from the spec's literal values: every §5 worked example matched the engine as specified.
- Commands:
  - `npx vitest run tests/engine tests/playtest tests/advice tests/bots tests/table` (after engine change, before new
    tests): 76 files, 286 tests passed.
  - `npm run format`; `npm run lint` — clean; `npm run typecheck` — clean.
  - `npm test` — 122 files passed, 436 tests passed, 6 skipped; coverage thresholds met.
  - `npm run playtest -- --hands 10000 --seed 42 --size 6` — exit 0; Ended by fold 5470, showdown 4530, Player
    actions 88831, capped 244, Largest pot $70, Invariant violations 0 (matches baseline).
- Scope: ~730 changed lines vs budget 650 (warn band, under the 1300 fail line); the overrun is test code (610 lines
  across the three new test files). Files: 6 of 6.

## FIX round 1
- Item 1 (checker all-in size exemptions untested): partly fixed and partly disputed.
  - Fixed (bet clause and genuine all-ins): new test in `tests/engine/short-all-in.test.ts`, "the invariant checker exempts a short bet or raise from the unit only when it is all-in". A forged flop `big-blind` record of -$1 makes `legalActions` offer seat 2 (156 behind) a $3 bet that is short but not all-in. The test asserts the exact violation `seat 2 bets $3 does not match the $4 flop betting unit`. It also asserts that a genuine $3 all-in bet and a genuine $5 all-in raise produce no size violation. Mutation check: replacing `!(amount < unit && amount === allInTo)` with `!(amount < unit)` makes the new test fail (1 failed / 160 passed in tests/engine + tests/playtest). Source restored.
  - Disputed (raise clause, part b): no input can produce a short raise that isn't all-in, so the raise mutant is equivalent. `legalActionMessage` returns early unless the action is in `legalActions(before)`. The legal raise is `min(fullBetLevel + unit, streetContribution + stack)`, and that is computed from the same `before`, seat (toAct), unit and level derivation as the checker's `fullTo`/`allInTo`. So any legal raise either equals `fullTo` or equals `allInTo` (< fullTo, > currentBet). A faulty engine can't help either, because membership is checked against the real `legalActions`. Evidence: replacing `amount < fullTo && amount === allInTo` with `amount < fullTo` leaves all 161 tests in tests/engine + tests/playtest green. Source restored. The bet clause can only be reached because a forged negative level lowers `level + unit` below the unit, and that has no raise equivalent.
- Commands: `npm run format`, `npm run lint`, `npm run typecheck`: clean. `npm test`: 122 files, 437 passed, 6 skipped. Coverage thresholds met.
