# TASK-7.40 changes

## Files
- `src/advice/preflop-chart.ts` — `Situation` gains `re-raise-not-mine`; six 6-max spots (UTG, HJ, CO, BTN, SB, BB) placed after the six `re-raise` spots (D-2), 26 → 32.
- `src/advice/preflop.ts` — `situationOf` applies A-2 (D-1, D-3): two or more raises read `re-raise` when one is the viewer's, else `re-raise-not-mine` where the size's spot list has it.
- `src/advice/explanations.ts` — `PREFLOP_CONTEXT['re-raise-not-mine']` and `SITUATION_LABELS['re-raise-not-mine']` with the Q-1/Q-2 wording.
- `src/advice/charts/six-max.json` — 6 new `re-raise-not-mine` grids and justifications; the 6 `re-raise` justifications rewritten for own-raise routes only; CO re-raise A9o F → C*/F (D-8); chart-level "Once two raises are in…" sentence extended.
- `src/bots/styles/rock.json` — 6 Rock `re-raise-not-mine` ranges (AA AKs AKo KK QQ, A-5), after the re-raise ranges.
- `src/bots/tag.ts` — the mixed-spot lookup casts `preflop-${situation}` to `SpotType` (as `src/playtest/style-check.ts:119` already does). The spec's A-4 said no compile change was needed, but `mixedSpots.get` is keyed by `SpotType`, so typecheck failed without it. Behaviour unchanged: there is no `SPOT_TYPES` or `tag.json` entry, so TAG never mixes `re-raise-not-mine`.
- `tests/advice/re-raise-split.acceptance.test.ts` (new) — SPEC-01, 02, 04, 06, 09.
- `tests/advice/six-max-chart.test.ts` — Q-3 width bands for the 6 new spots.
- `tests/advice/preflop.test.ts` — the blind two-raise cases are now `re-raise-not-mine`; an own-raise SB case was added.
- `tests/advice/explain.test.ts` — the per-situation context list gains `re-raise-not-mine`.
- `tests/advice/preflop-chart.test.ts` (unit, not locked) — a 6-max spot list read as full ring now also reports the six 6-max-only spots as "does not apply"; the all-missing count goes from 26 to 32.
- `tests/bots/calling-station-draws.acceptance.test.ts` (not locked) — re-pinned the example indices to the same views: exampleC fold[0] → fold[1], exampleB fold[30] → fold[33].
- `tests/playtest/cli.test.ts` (not locked) — seed 42's first Mixed replacement now comes at hand 42, not 18 (17/18 → 41/42).
- Locked re-pins from the spec table:
  - `tests/advice/chart-print.acceptance.test.ts` (TASK-7.19): 26 → 32.
  - `tests/advice/six-max-chart.acceptance.test.ts` (TASK-7.19): `:119` 26 → 32.
  - `tests/advice/chart-print-sizes.acceptance.test.ts` (TASK-7.27): `checkReview('6-max', 32)`.
  - `tests/advice/preflop-chart-edges.acceptance.test.ts` (TASK-7.20): 26 → 32.
  - `tests/advice/preflop.acceptance.test.ts` (TASK-7.2): SB/BB `re-raise` scripts replaced with own routes R8/R9; 6 `re-raise-not-mine` scripts added in D-2 order.
  - `tests/advice/preflop-voided-raise.acceptance.test.ts` (TASK-10.17): `:74` → `re-raise-not-mine`.
  - `tests/advice/labels.acceptance.test.ts` (TASK-8.5): new label added to `expected` and to the key list.
  - `tests/bots/rock.acceptance.test.ts` (TASK-6.5): `COUNTS` gains `[5, 5, 5, 5, 5, 5]`, 26 → 32. Also `:257`, the spot count without BB limpers, goes 25 → 31. This is the same count re-pin on a line the table does not list. Unions unchanged.
  - `tests/bots/tag.acceptance.test.ts` (TASK-6.1): `re-raise-not-mine` added to the situation set.
  - `tests/golden/preflop-spots.json` (TASK-7.11): 3 spots appended: `6max-co-re-raise-not-mine-a9o` (fold), `6max-bb-re-raise-not-mine-88` (call), `6max-btn-re-raise-not-mine-aa` (raise). The existing entries are unchanged.
- Locked re-pins added under A-8 (seeded-play examples shifted by the new folds; no assertion dropped or loosened, each with a "before TASK-7.40" note):
  - `tests/bots/calling-station.acceptance.test.ts` (TASK-6.3): Example B, the flop 5c 3c view, is now fold[36]; it is read at point 216 (k = 1) so the draw is still u < 2^31. Code, seed and draw re-pinned.
  - `tests/bots/maniac.acceptance.test.ts` (TASK-6.4, TASK-6.25):
    - Example A: TAG now folds the 7h Qh hand preflop (BTN re-raise-not-mine), so its flop check no longer exists. Re-pinned to the flop check view 6d 9c, check[8], which keeps the same street, bet count and decision index.
    - Example D: Th 8c turn, now check[0], read at point 45.
    - Example E: 96o BB option, now check[7].
    - Example B: T8o facing a raise, now call[0]. The worker test uses the same view and keeps seed 1461725007, which still gives raise 12 / call 4.
    - Example C: Kd Ad turn, now call[22].
    - Example H: 8s 8d river, now call[28], read at point 98.
    - Example G: capped[0] (7h Qh owing 16) now has fold advice. Re-pinned to capped[5], 77 owing 4 with call advice, plus an added check that the advice is call. Hot draw code `handReplayCode(6403, 4)`; the cold draw code is still k = 1.
  - `tests/playtest/games.acceptance.test.ts` (TASK-1.16): AC#7 cash run seed 42 → 43. Seed 42 now has 0 side pots in 1,000 (and 2,000) hands; seed 43 has 2 in 1,000 and 14 in 10,000. All three `> 0` checks kept. The CLI check still uses seed 42.
- `doit/TASK-7.40/signoff.md` — the SPEC-12 sign-off package (12 chart:print blocks, changed re-raise cells, shares, D-8, widths).
- `doit/TASK-7.40/changes.md`, `doit/TASK-7.40/build-log.md`, `doit/TASK-7.40/blocked-1.resolved.json` — work-folder files.

No new dependencies.

## D-8 choice (CO A9o / A8o)
- `CO re-raise` (own): A9o is now `C*/F` (call, close to a fold). Under A-2 the TASK-9.1 route no longer reads this spot, and our own open of A9o, re-raised, gets one more bet at a good price. This makes the CO share 310/358 = 0.866. A8o stays `F` because it is dominated more often.
- `CO re-raise-not-mine`: A9o and A8o are `F` (the Q-3 subset rule: CO raise folds them).

## AC#8 before/after (TLH_SLOW_TESTS=1, tests/bots/tag-short-handed-playtest.acceptance.test.ts, 100,000 hands, seed 42)
| Stat | 3 seats before | 3 seats after | 4 seats before | 4 seats after | Healthy (6-max) |
|---|---|---|---|---|---|
| VPIP | 23.6 | 23.6 | 23.9 | 23.8 | 20–28 |
| PFR | 17.3 | 17.3 | 17.7 | 17.7 | 14–22 |
| Aggression | 65.2 | 65.2 | 64.7 | 64.9 | 50–66 |
| WTSD | 41.7 | 41.7 | 41.7 | 41.5 | 30–42 |
| W$SD | 52.4 | 52.4 | 51.9 | 52.2 | 47–57 |

"Before" came from a worktree of the base commit e8005a62, removed afterwards. Both runs passed (2/2).
