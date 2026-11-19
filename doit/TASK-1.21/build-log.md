## BUILD — 2026-11-18
- Captured the baseline `npm run playtest -- --hands 10000 --seed 42` and `--replay-code 0123456789abcdeffedcba9876543210 --size 6` outputs before any change.
- Implemented parseCard type guard and truncated echo, createHand snapshot, safe-integer and A-4 checks, and the exact `nextIntUnbiased` with its guard and doc comment.
- Wrote `tests/engine/input-hardening.acceptance.test.ts` (4 tests) and the unit additions in cards/hand/seeded-random/deck tests. Ran typecheck and lint after each test-file edit: clean.
- Targeted runs: acceptance 4/4; cards and hand 6/6; seeded-random and deck 9/9.
- Playtest after the change: exit 0, `Invariant violations: 0`; both playtest outputs are byte-identical to the baseline (diff empty); run time 0.65s before vs 0.67s after.
- `grep` for banned substrings in `src/engine/seeded-random.ts`: none.
- `npm test` (no other vitest running): 76 files passed, 282 tests passed and 2 skipped; coverage across all files 96.44% statements / 96.94% lines.
- `npm run format` / lint: clean. Changed lines about 354 vs budget 340 (the gate only warns at this level).
