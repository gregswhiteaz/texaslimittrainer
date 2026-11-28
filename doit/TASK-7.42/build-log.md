## BUILD (2026-11-28)

What I did:
- Base measurements came from a scratch worktree of a28ea6df, which I removed afterwards: `chart:print 6-max` and `chart:print full-ring`, the 10,000-hand 6-max playtest, and `size-ranges-playtest`. Base run: 1 passed.
- Code:
  - `Situation` gains `blind-defence-early`, plus `EARLY_RAISERS` and the D-2 spot order;
  - `situationOf` routes on the raiser's position (`positionOf({ ...view, seat })`);
  - the Q-2/Q-3 text;
  - the TAG A-1 mapping.
- Charts:
  - 4 new early grids (6-max SB 6.8%, BB 30.3%; full ring SB 5.7%, BB 24.0%), all inside their Q-4 bands;
  - 4 late justifications rewritten, with no late grid changed (checked cell for cell against the base);
  - one clause on the split added to each chart-level text;
  - 2 Rock ranges (Q-5).
- New acceptance test `tests/advice/blind-defence-split.acceptance.test.ts` (5 tests). Its steps name only seat and type, and amounts come from `legalActions` (A-5).
- Spec route B8 lists `c4 c5 r1`, but at 6 seats the CO (seat 6) acts between seat 5 and the button. The test uses `c4 c5 f6 r1`, which is the intended "BTN isolates two limpers" route.
- First full run: the locked postflop golden spots (`6max-flop-bb-call-j8o`, `6max-turn-bb-check-a3o`, `6max-turn-bb-fold-k3s`, `6max-river-bb-check-53s`, `fr-turn-bb-check-a6o`, `fr-river-bb-fold-43s`) failed validation. In each one the hero calls a UTG raise from the BB, which the draft grids made a Major error.
  - I made those cells borderline folds with a call alternative (`F*/C`), together with their dominating neighbours so the grids have no inversion. A call there now grades as Minor.
  - I left those spots unedited; they are not in the re-pin list.
  - The A-3 6-max golden hand moved from K5s (now borderline) to Q6s.
- Locked re-pins: all spec §5 files, each unlocked for every owner.
- Seeded re-pins (D-7): calling-station Example B, maniac Examples C and H, games seed 43 → 45, calling-station-draws `exampleB`. Found with temporary probe tests, which I deleted.

Commands:
- `npx vitest run tests/advice/blind-defence-split.acceptance.test.ts`: 5 passed.
- `npx vitest run tests/advice tests/bots tests/golden tests/playtest tests/stats tests/table` before the re-pins: 27 failed, 912 passed, 53 skipped. These were the expected re-pins plus the postflop golden issue above.
- `npm run typecheck`: exit 0. `npm run lint`: exit 0. `npm run format`: run.
- `npm test`: exit 0, 357 files passed, 11 skipped; 1588 tests passed, 60 skipped; coverage 92.84% statements.
- `npm run test:slow`: exit 0, 27 files and 114 tests passed. TAG full-ring after: VPIP 14.2, PFR 11.2, aggression 65.0, WTSD 38.1, W$SD 52.3, all healthy.
- `doit.py gate TASK-7.42`: PASS (all checks ok; 707 lines, 29 files).
