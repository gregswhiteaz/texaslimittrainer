# TASK-7.40 build log

## BUILD (round 1)
- "Before" figures: worktree of base e8005a62. `TLH_SLOW_TESTS=1 npx vitest run tests/bots/tag-short-handed-playtest.acceptance.test.ts`: 2/2 passed. Figures are in changes.md. Also saved the base `npm run chart:print 6-max` output for the sign-off. Worktree removed.
- Code: added `Situation` and the 6-max spots, A-2 in `situationOf`, and the context sentence and label (exact Q-1/Q-2 text).
- Chart: 6 new grids authored to Q-3 rules 1–5. Widths: UTG 4.2%, HJ 4.5%, CO 5.7%, BTN 7.1%, SB 5.0%, BB 8.4%. The 6 re-raise texts were rewritten for own routes only. D-8: CO re-raise A9o F → C*/F (share 0.866). The chart-level sentence was extended.
- Rock: 6 ranges (AA AKs AKo KK QQ).
- Golden: 3 spots appended.
- Tests:
  - new `tests/advice/re-raise-split.acceptance.test.ts`: 5/5 passed;
  - unit bands and situationOf cases added;
  - every spec-table re-pin made;
  - re-pinned the unlocked `preflop-chart.test.ts`, `calling-station-draws.acceptance.test.ts` and `cli.test.ts` for the shift.
- `src/bots/tag.ts`: `as SpotType` cast, needed by typecheck. A-4's "no compile need" was wrong.
- `npm run format`, `npm run lint`, `npm run typecheck`: clean.
- `npm test`: 6 failed, 1557 passed, 60 skipped (1623). The failures are all in the locked files calling-station.acceptance (TASK-6.3), maniac.acceptance (TASK-6.4/6.25) and games.acceptance (TASK-1.16). They are seeded-play example pins that shift with the new folds, and none is in the spec's re-pin table. All 7 affected files pass on base. Wrote `blocked.json` and stopped before the gate and signoff.md.
- "After" AC#8 run on the final chart: 2/2 passed, all ten figures healthy (changes.md).

## BUILD (round 2, after A-8)
- A-8 re-pins (probe: the seed-61 decision lists re-collected, each old view located in the new list; where the index moved, a point i = j + k·len was chosen whose draw still meets the example's threshold):
  - calling-station.acceptance: Example B fold[35] → point 216 (fold[36]);
  - maniac.acceptance:
    - Example A → check[8] (6d 9c flop; the 7h Qh hand is now folded preflop);
    - D → point 45 (check[0]);
    - E → check[7];
    - B → call[0];
    - C → call[22];
    - H → point 98 (call[28]);
    - G → capped[5] (77 owing 4, call advice; capped[0] is now fold advice), hot code k = 4;
    - worker test → call[0], same seed;
  - games.acceptance: cash seed 42 → 43 (side pots 2 in 1,000 hands, 14 in 10,000).
- The `src/bots/tag.ts` `as SpotType` cast from round 1 is recorded in changes.md.
- `npx vitest run` on the 3 re-pinned files: 16 passed, 3 skipped (the slow runs).
- `npm run format`, `npm run lint`, `npm run typecheck`: clean. `npm test`: exit 0, all passing.
- Wrote `signoff.md` (SPEC-12) from the saved base `chart:print 6-max` output and the final one. Changed re-raise cells: CO A9o F → C*/F only.
- Temporary probe tests were deleted.
