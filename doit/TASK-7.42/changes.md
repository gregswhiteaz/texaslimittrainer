# TASK-7.42 changes

## Files
- `src/advice/preflop-chart.ts`: `Situation` gains `'blind-defence-early'`. The new export `EARLY_RAISERS` holds the Q-1 groups: heads-up `[]`, 6-max UTG and HJ, full ring UTG, UTG+1, MP and LJ. `APPLICABLE_SPOTS` 6-max and full ring gain `SB`/`BB blind-defence-early` just before `blind-defence` (D-2), so the counts go 32 → 34 and 50 → 52.
- `src/advice/preflop.ts`: when SB or BB faces exactly one raise, `situationOf` reads the raiser's position with `positionOf({ ...view, seat: raiser }, size)` and returns `blind-defence-early` when that position is in `EARLY_RAISERS[size]`, else `blind-defence`. The doc comment is updated.
- `src/advice/explanations.ts`: `PREFLOP_CONTEXT['blind-defence-early']` (Q-3) and `SITUATION_LABELS['blind-defence-early']` (Q-2), each placed before `blind-defence`. The `blind-defence` text is unchanged.
- `src/bots/tag.ts`: TAG mixes `blind-defence-early` with the `preflop-blind-defence` spot type (A-1), and the comment says so.
- `src/advice/charts/six-max.json`:
  - 2 new `blind-defence-early` grids and justifications (SB 6.8%, BB 30.3% continue);
  - the 2 `blind-defence` justifications are rewritten for late raisers (grids unchanged, D-5);
  - one clause on the split is added to the chart-level text.
- `src/advice/charts/full-ring.json`: the same changes (SB 5.7%, BB 24.0%). The "nine and ten seats" phrase is kept.
- Review r1 fix (text only, no grid changed): in both charts the `BB blind-defence-early` text now lists ace-king offsuit with the re-raises and starts the offsuit-ace call group at ace-queen. The early texts (6-max SB/BB, full-ring SB/BB) and the full-ring chart-level text name the raiser's positions without counting seats.
- `src/bots/styles/rock.json`: the 2 Q-5 Rock ranges, `SB blind-defence-early` (8 classes) and `BB blind-defence-early` (24), placed before `SB blind-defence`.
- `tests/advice/blind-defence-split.acceptance.test.ts` (new): SPEC-01 to SPEC-06. It covers 23 routes × 169 classes, the D-2 order, 34/52 spots and the chart:print headers, the rules 5 and 6 checks with a mutation, the Q-2/Q-3 text, and Rock.
- Unit tests (unlocked):
  - `tests/advice/preflop.test.ts`: the UTG-raise blind case now expects `blind-defence-early`. New cases cover a CO raiser, an SB raiser, an HJ isolation raise (early) and a BTN isolation raise (late).
  - `tests/advice/preflop-chart.test.ts`: the missing-spot case drops both blind-defence situations and expects 4 messages. The `spots: 'none'` count goes 32 → 34.
  - `tests/advice/six-max-chart.test.ts`: Q-4 bands for the 2 new keys.
  - `tests/advice/reference-charts.test.ts`: Q-4 `FR` bands for the 2 new keys.
- Locked re-pins from spec §5. Each file was unlocked for every owner with `doit.py unlock <owner> <file>`. Only expected values changed, and the check count is kept:
  - `tests/advice/chart-print.acceptance.test.ts` (TASK-7.19): 32 → 34 (×2).
  - `tests/advice/chart-print-sizes.acceptance.test.ts` (TASK-7.27): `checkReview('full-ring', 50)` → 52; `('6-max', 32)` → 34.
  - `tests/advice/preflop-chart-edges.acceptance.test.ts` (TASK-7.20): 32 → 34.
  - `tests/advice/six-max-chart.acceptance.test.ts` (TASK-7.19, TASK-7.40): 32 → 34. The dominance check now covers the new grids.
  - `tests/advice/table-sizes.acceptance.test.ts` (TASK-7.6): `SITUATIONS` gains `blind-defence-early`; full ring 50 → 52; the heads-up reachable filter also drops `blind-defence-early`.
  - `tests/advice/re-raise-split.acceptance.test.ts` (TASK-7.40): the 6-max order gains the 2 D-2 entries; 32 → 34 and the `6-max chart: 32 spots` header → 34; full-ring length 50 → 52. The test title still says "32 spots" because titles were left alone.
  - `tests/advice/full-ring-re-raise-split.acceptance.test.ts` (TASK-7.41): the full-ring order gains the 2 D-2 entries; 50 → 52 and the `full-ring chart: 50 spots` header → 52; the `situations` key list gains `blind-defence-early` before `blind-defence`. The title is unchanged.
  - `tests/advice/labels.acceptance.test.ts` (TASK-8.5): `expected` and the sorted key list gain `blind-defence-early` with the Q-2 label.
  - `tests/advice/preflop-voided-raise.acceptance.test.ts` (TASK-10.17, TASK-7.40): `:66` (a surviving UTG raise) and `:75` (an HJ raise) → `blind-defence-early`. `:70` (an SB raiser) is unchanged.
  - `tests/advice/preflop.acceptance.test.ts` (TASK-7.2): `SCRIPTS` follows the 34 spots. The `r(4, 8)` BB script is now `BB blind-defence-early`; `SB blind-defence-early` `[r(4, 8), f(5), f(6), f(1)]` and `BB blind-defence` `[f(4), f(5), r(6, 8), f(1), f(2)]` are added in D-2 order.
  - `tests/bots/rock.acceptance.test.ts` (TASK-6.5, TASK-7.40): 32 → 34; `COUNTS` gains `[8, 24]` before `[17, 41]`; 31 → 33. The BB 41 pin and Example D are unchanged.
  - `tests/bots/tag.acceptance.test.ts` (TASK-6.1): the reached situation set gains `blind-defence-early`.
  - `tests/golden/preflop-spots.json` (TASK-7.11):
    - A-2: `situation` → `blind-defence-early` on `6max-sb-blind-defence-qq`, `fr-sb-blind-defence-ako` and `fr-sb-blind-defence-k9s`;
    - A-3: 2 spots appended, `6max-bb-blind-defence-early-q6s` (UTG raise, fold; `BB blind-defence` calls Q6s) and `fr-bb-blind-defence-early-k6s` (MP raise, fold; `BB blind-defence` calls K6s);
    - every other entry is byte-identical.
- Seeded re-pins (D-7, TASK-7.40 A-8 method). TAG now folds some BB hands against an early raiser, so some seeded decision lists changed:
  - `tests/bots/calling-station.acceptance.test.ts` (TASK-6.3), Example B: the 5c 3c flop view no longer exists because TAG folds 53s preflop against the UTG raise. The nearest flop view facing a bet of 4 at decision index 1 where the station calls and TAG folds is point 108 = fold[108] (6d 8h). Code `...006d`, seed 4144976625, u 1627951385; before: point 216, code `...00d9`, seed 2984596433, u 236911064.
  - `tests/bots/maniac.acceptance.test.ts` (TASK-6.4, TASK-6.25):
    - Example C: the same Kd Ad turn view is now call[21] (was call[22]). Code `...0016`, seed 3023335121, u 4218716683 (≥ 0.2, so the Maniac calls like TAG).
    - Example H: the same 8s 8d river view is now call[27] (was call[28]). The first point on it with u < 0.2 is 441: code `...01ba`, seed 2360546989, u 768080274. Before: point 98, code `...0063`, seed 2215881066, u 538411937.
  - `tests/playtest/games.acceptance.test.ts` (TASK-1.16): the side-pot `> 0` check now uses seed 45 instead of 43. Seeds 42 to 44 have 0 side pots in 1,000 hands; seed 45 has 1 in 1,000 hands and 6 in 10,000.
  - `tests/bots/calling-station-draws.acceptance.test.ts` (unlocked): `exampleB` is `fold[90]`, the first flop fold (was `fold[33]`, the 5c 3c flop).
- `doit/TASK-1.16/state.json`, `doit/TASK-10.17/state.json`, `doit/TASK-6.1/state.json`, `doit/TASK-6.25/state.json`, `doit/TASK-6.3/state.json`, `doit/TASK-6.4/state.json`, `doit/TASK-6.5/state.json`, `doit/TASK-7.11/state.json`, `doit/TASK-7.19/state.json`, `doit/TASK-7.2/state.json`, `doit/TASK-7.20/state.json`, `doit/TASK-7.27/state.json`, `doit/TASK-7.40/state.json`, `doit/TASK-7.41/state.json`, `doit/TASK-7.6/state.json`, `doit/TASK-8.5/state.json`: unlock history entries that `doit.py unlock` wrote for the re-pins above.
- `doit/TASK-7.42/changes.md`, `doit/TASK-7.42/build-log.md`: work-folder files. The sign-off package was written to the scratchpad, `signoff.md`, for the orchestrator to copy.

`src/advice/charts/heads-up.json` is unchanged. No new dependencies.

## TAG before/after (A-4, SPEC-10)
"Before" comes from a worktree of the base commit a28ea6df, which was removed afterwards.

9-max, from `TLH_SLOW_TESTS=1 npx vitest run tests/advice/size-ranges-playtest.acceptance.test.ts` (100,000 hands, seed 42; "after" from `npm run test:slow`):

| stat | before (base) | after (final) | healthy (`HEALTHY_RANGES['full-ring']`) |
|---|---|---|---|
| VPIP | 14.7 | 14.2 | 13–20 |
| PFR | 11.2 | 11.2 | 9–16 |
| aggression | 65.2 | 65.0 | 50–66 |
| WTSD | 37.6 | 38.1 | 28–40 |
| W$SD | 52.1 | 52.3 | 47–57 |

All stats stay inside the healthy ranges. Both runs passed.

6-max, from the 10,000-hand seed-42 playtest that `tests/bots/tag-playtest.acceptance.test.ts` runs (`npm run playtest -- --hands 10000 --seed 42`, "Style: TAG" line; this run prints no WTSD or W$SD):

| stat | before (base) | after (final) | healthy (6-max) |
|---|---|---|---|
| VPIP | 22.0 | 21.2 | 20–28 |
| PFR | 16.3 | 16.1 | 14–22 |
| aggression | 65.2 | 65.2 | 50–66 |
