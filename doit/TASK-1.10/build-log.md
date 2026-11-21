## BUILD (TASK-1.10)
- Implemented side pots in `src/engine/hand.ts` (`buildPots`, per-pot awards, `payOut` sums across awards) and P6–P8 in `src/engine/invariants.ts`.
- Added `tests/engine/side-pots.acceptance.test.ts` (6 tests), `tests/engine/side-pots.property.test.ts` (1 test, ~2.5 s locally for 100,000 hands), `tests/engine/side-pot-invariants.acceptance.test.ts` (1 test). All passed first run.
- `npm run format`: clean. `npm run lint`: 0 warnings. `npm run typecheck`: pass.
- `npm test`: 117 files, 410 passed, 6 skipped; coverage 96.84% statements overall, invariants.ts 99.65%.
- `npm run playtest -- --hands 10000 --seed 42`: byte-identical to the §3 baseline (Largest pot $70, 0 violations).
- `git diff --exit-code 791d900 -- tests/ src/ui src/table src/advice e2e`: empty (no locked test edited).
