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
