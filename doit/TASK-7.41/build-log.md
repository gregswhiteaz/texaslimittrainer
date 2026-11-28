# TASK-7.41 build log

## BUILD
- Base measurements in a separate worktree at `0db9c0c5` (removed afterwards): `npm run chart:print full-ring` saved for the "before" columns, and `TLH_SLOW_TESTS=1 npx vitest run tests/advice/size-ranges-playtest.acceptance.test.ts` → 1 passed (TAG full-ring VPIP 15.1, PFR 11.3, aggression 63.8, WTSD 38.3, W$SD 50.9).
- Added the 9 full-ring `re-raise-not-mine` spots to `APPLICABLE_SPOTS` (D-2) and authored `full-ring.json`: 9 new grids and texts, 9 re-justified `re-raise` texts, Q-1 trims (UTG+1, MP, LJ, HJ, CO, SB) and BTN widening (0.725 → 0.846), chart text extended. Shares are 0.825–0.873. Not-mine widths are 3.0–5.4% (UTG..SB) and 6.6% (BB), each a strict subset of its parent. None of the 18 spots has a dominance inversion.
- New `tests/advice/full-ring-re-raise-split.acceptance.test.ts` (SPEC-01..06). Added unit bands in `reference-charts.test.ts`: 9 new keys, and BTN re-raise moved to 25–35% because the Q-1 share needs 29.9% or more. Added one 9-seat case to `preflop.test.ts`.
- Unlocked and re-pinned the 4 spec §5 locked files (owners TASK-7.27, TASK-7.6, TASK-7.40, TASK-7.11, from `locked_tests` in every `doit/*/state.json`). Expected values only; check counts kept. Appended 3 golden spots.
- SPEC-06 note: the spec text says the F20/F21 `move` is "a call of 4". The big blind has 4 in and faces a fourth bet to 16, so the only legal call adds 12 (`legalActions` call amount = amount owed, `src/engine/hand.ts:413`). The test asserts `{ seat: 3, type: 'call', amount: 12 }`.
- Commands:
  - `npx vitest run` on the new and edited tests → 3 files, 11 passed.
  - golden, re-pinned and related acceptance tests → 12 files, 322 passed.
  - `npm run format`; `npm run lint` → clean; `npm run typecheck` → clean.
  - `npm test` → exit 0, 356 files passed / 11 skipped; 1581 tests passed / 60 skipped. Coverage: all files 92.84% statements.
  - `TLH_SLOW_TESTS=1 npx vitest run tests/advice/size-ranges-playtest.acceptance.test.ts` on the final chart → 1 passed (VPIP 14.7, PFR 11.2, aggression 65.2, WTSD 37.6, W$SD 52.1).
  - `npm run test:slow` on the final chart → exit 0, 27 files, 114 tests passed. No seeded example shifted, so no D-7 re-pin was needed.
