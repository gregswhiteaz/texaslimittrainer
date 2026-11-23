
## BUILD (TASK-6.17)
- Added shared `postflopValueMove` in `src/bots/style.ts`; Rock refactored onto it; Calling station applies it after `recommend`, before any draw (no draw consumed when demoted).
- `calling-station.json`: `postflopValue.thresholdPct: 88` + justification. `maniac.json`: postflop check→bet and call→raise 0.85 → 0.6, check→bet justification rewritten (A-3).
- New `tests/bots/calling-station-postflop.acceptance.test.ts` (SPEC-04/05/06): 3 tests pass, 137 ms.
- Locked re-pins (Q-3), no assertions dropped: style-bands (CS + Maniac bands, "every bot style" titles), rock-postflop (CS 88, TAG/Maniac null loop), maniac.acceptance (0.6; Example C calls 8), replacement.acceptance (first hand whose seat styles differ from hand 1). Unlocked cli.test pin 17/18.
- `npx vitest run tests/bots tests/playtest/replacement.acceptance.test.ts tests/playtest/cli.test.ts`: 23 files passed, 1 skipped; 89 tests passed, 6 skipped.
- `TLH_SLOW_TESTS=1 npx vitest run tests/bots/style-bands.acceptance.test.ts`: 3/3 passed (~145–155 s per seed). Measured (VPIP / PFR / AGG):

  | seed | TAG | Rock | Calling station | Maniac |
  |---|---|---|---|---|
  | 42 | 22.2 / 16.4 / 63.8 | 10.2 / 8.8 / 47.8 | 59.6 / 6.7 / 15.3 | 56.1 / 53.3 / 79.3 |
  | 7 | 22.3 / 16.4 / 63.8 | 10.1 / 8.7 / 47.0 | 58.7 / 6.5 / 14.8 | 56.4 / 53.6 / 77.4 |
  | 1234 | 22.2 / 16.2 / 63.4 | 10.0 / 8.5 / 45.4 | 59.9 / 6.7 / 15.8 | 57.3 / 54.3 / 78.9 |

- `npm run -s playtest -- --hands 10000 --seed 42 | shasum -a 256` → `2cbbafa79dfeb56a159349b949039132b89cb0e41e72a83784e579653ae4bb98` (unchanged).
- `npm run playtest -- --hands 10000 --lineup mixed --size 6 --seed 42` → Invariant violations: 0, Bots replaced: 44, exit 0.
- `npm run format`, `npm run lint`, `npm run typecheck`: clean. `npm test`: 201 files passed, 3 skipped; 737 tests passed, 30 skipped; coverage thresholds held.
