## BUILD (TASK-10.18)
- Merged the liveLevels/voidedBets walks into private `voidingWalk` in `src/engine/hand.ts`; both are wrappers now. SPEC-01 grep `grep -c "c > live) live = c" src/engine/hand.ts` -> 1.
- Added SPEC-02 property case to `tests/engine/force-fold.property.test.ts` (seed 0x10d18, 2000 hands; checks after every forced fold that each same-street bet/raise above `currentBet` is voided and every voided index is a same-street bet/raise). Mutation check (voidedBets returning an empty set) makes it fail at hand 15; restored.
- `npx vitest run tests/engine/force-fold.property.test.ts tests/engine/voided-bets.test.ts`: 2 files, 4 tests passed.
- `npm run format`, `npm run lint`, `npm run typecheck`: clean.
- `npm test`: 345 files passed, 11 skipped, exit 0.
- SPEC-03: `npm run -s playtest -- --hands 10000 --seed 42` on this branch and on a temporary worktree of 46e6e83 (removed afterwards): `cmp` identical (1130 bytes each).
