# Build log — TASK-7.13

## BUILD (blocked)

- Implemented D-1..D-5: `ranges.ts` (hand order loader, `rangeWidthPct`, `scaledWidthPct`, `strongestClasses`, snapshot validation and scaling in `estimateOpponentRanges`, `basis`/`widthPct`), `postflop.ts` (`observedOpponents`, `opponentBasis`), `explain.ts` (`basisText`, opponent-type lead), `explanations.ts` (authored texts), docs, D-4 re-pin.
- Hand order: generated once with a temporary script (deleted; the spec says no committed generator) using the §5 rule 7 procedure: for each class in HAND_CLASSES, its lowest-id combo against `unseenCombos(combo)`, `computeEquity` on an empty board. All 169 ran sampled, 30,000 trials each (SAMPLE_TRIALS), with the seed derived from the canonical input (no external seed). Total 944 ms. Sorted descending by `toPct`, ties by grid index. The unit test recomputes AA, KK, AKs, AKo, T9s, 72o and 32o exactly (49 ms; unit file 0.46 s wall).
  - Top 10: AA 85.5, KK 82.4, QQ 79.7, JJ 77.7, TT 74.8, 99 72.0, 88 69.3, AKs 66.8, 77 66.2, AQs 66.0.
  - Bottom 10: 53o 36.6, 73o 36.3, 63o 36.0, 32s 35.7, 43o 35.2, 72o 34.7, 52o 34.7, 62o 33.9, 42o 33.4, 32o 32.1.
- `npx vitest run tests/advice/observed-ranges.acceptance.test.ts` → 7/7 passed. `tests/advice/observed-ranges.test.ts` → 10/10 passed. `tests/advice/explain.test.ts` → 15/15 passed. `tests/advice/postflop.acceptance.test.ts` (re-pinned) → 6/6 passed.
- `npm run format`, `npm run lint` → clean (after moving two stale, gitignored sync-conflict copies `doit/TASK-1.55/spec-items 2.json` and `state 2.json`, which `tools/lint/sync-copies.js` rejects, to /tmp/tlh713/sync-conflicts). `npm run typecheck` → clean.
- `npm test` → 4 failed | 962 passed | 41 skipped (1007). After fixing a hand-class literal in ranges.ts (preflop AC#3 no-literal rule), 3 locked failures remain: value-bet AC#9 (exact key list), preflop AC#6 (sandbox file list lacks hand-order.json), range-model AC#8 (runtime call with 'Maniac'). These contradict SPEC-12. Wrote blocked.json and stopped.
- Playtest `npm run -s playtest -- --hands 10000 --seed 42` → Invariant violations: 0, SHA-256 1eb65ef2cbd611efa25a131801e52f97546fdeb40fea3efc841db8cf861238a5 (unchanged).

## BUILD (resume after block 1)

- Item 1 (c): fixed. `estimateOpponentRanges` passes `[]` to the validator when `observed` is not an array, so every opponent gets the default range with basis 'typical player'; arrays still throw the A-7 RangeErrors. Unit test "ignores a snapshot that is not an array and uses default ranges" added to `tests/advice/observed-ranges.test.ts`.
- Item 2 (a)/(b): orchestrator's locked edits to `tests/advice/value-bet.acceptance.test.ts` and `tests/advice/preflop.acceptance.test.ts` listed in changes.md; not edited again.
- `npm test` → 217 files passed | 3 skipped; 967 passed | 41 skipped (1008), 0 failed.
- Playtest `--hands 10000 --seed 42 | shasum -a 256` → 1eb65ef2cbd611efa25a131801e52f97546fdeb40fea3efc841db8cf861238a5 (unchanged), invariant violations 0.
- `npm run format`, `npm run lint`, `npm run typecheck` → clean.

## FIX (review round 1)

- Item 1 (range width never checked): fixed. Unit test `rangeWidthPct(AA, AKs, AKo)` ≈ 22/1326 × 100; AC#2 now asserts the typical UTG open-raise `widthPct` equals the default classes' summed `comboCount` / 1326 × 100 computed in the test, and that the view's dead cards remove combos from that range (the "before dead cards" rule).
- Item 2 (n > 100 cap untested): fixed. `scaledWidthPct(20, 60, 250)` ≈ 60 and `(20, 0, 150)` ≈ 0; an estimate at 150 hands gives widthPct = PFR (35) and the same start as 100 hands.
- Orchestrator MINOR (stat choice): fixed. Unit test covers limp, open-raise, call-raise, three-bet, call-three-bet (two views) and four-bet: widthPct matches the right stat and not the other (vpip 40 ≠ pfr 10, n = 50), d counted in the test.
- Orchestrator MINOR (circular import): fixed. `basisText` and `OBSERVED_MIN_HANDS` live in explanations.ts (type-only imports); ranges.ts and explain.ts no longer import each other. explain.ts re-exports `basisText`; ranges.ts re-exports `OBSERVED_MIN_HANDS`.
- Orchestrator MINOR (docs): fixed. Known-limits note in docs/advice/range-model.md and in the hand-order.json justification, pointing to TASK-7.29. No ordering or code change.
- No assertion dropped or loosened.
- `npx vitest run` on the three touched test files → 36/36 passed. `npm test` → 217 files passed | 3 skipped; 970 passed | 41 skipped (1011), 0 failed.
- `npm run format`, `npm run lint`, `npm run typecheck` → clean.
- Playtest `--hands 10000 --seed 42 | shasum -a 256` → 1eb65ef2cbd611efa25a131801e52f97546fdeb40fea3efc841db8cf861238a5 (unchanged).
