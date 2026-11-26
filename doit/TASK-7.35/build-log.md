# TASK-7.35 — Build log

## BUILD (2026-11-26)

### What changed
- `src/advice/ranges.ts`: `rangesFor(dealtIn)` is now `DEFAULT_RANGES[referenceSizeOf(dealtIn)]` (2 heads-up, 3–7
  six-max, 8–10 full ring, RangeError otherwise). `OpponentRange.position` / `line` / `widthPct` are non-null and the
  `ranges !== null` branch in `estimateOpponentRanges` is gone; the fully-blocked fallback is unchanged.
- New fast acceptance file `tests/advice/small-table-ranges.acceptance.test.ts` (SPEC-01, 03, 04, 07; 4 tests).
- New opt-in slow file `tests/advice/small-table-ranges-playtest.acceptance.test.ts` (SPEC-06; one `it.runIf(SLOW)`
  per size), added to `npm run test:slow`.
- `tests/advice/postflop-ranges.test.ts`: the 5-seat block now pins the 6-max SB limp / BB check starts (SPEC-05).
- Docs: `docs/advice/range-model.md` (size table, positions, observed scaling, other sizes, new effect section) and
  `docs/advice/postflop-rules.md` (bullet and "Later work adds:" removed; `## Not applied yet` kept).
- No locked test or golden file needed an edit; no `blocked.json`.

### Measurements (SPEC-08)
All-TAG cash, seed 42, five stats summed over every seat. "Before" = base commit `d43ec6d` code (src untouched when
measured), "after" = this change. VPIP / PFR / Aggression / WTSD / W$SD; time is the in-process run time.

| Seats | Hands   | Before                           | After                            | Time before → after |
| ----- | ------- | -------------------------------- | -------------------------------- | ------------------- |
| 3     | 5,000   | 31.2 / 22.0 / 64.3 / 40.2 / 53.2 | 31.2 / 22.0 / 65.7 / 41.6 / 53.0 | 5.1 s → 3.8 s       |
| 4     | 5,000   | 28.0 / 20.2 / 63.1 / 44.7 / 51.5 | 28.0 / 20.2 / 64.6 / 42.7 / 51.8 | 6.2 s → 4.4 s       |
| 5     | 5,000   | 24.7 / 18.1 / 61.9 / 45.8 / 51.4 | 24.7 / 18.1 / 64.8 / 41.4 / 52.1 | 7.2 s → 4.9 s       |
| 7     | 5,000   | 20.4 / 14.9 / 60.9 / 45.2 / 50.7 | 20.3 / 14.9 / 63.9 / 39.6 / 51.6 | 9.1 s → 5.8 s       |
| 3     | 10,000  | 31.0 / 21.9 / 64.2 / 41.2 / 52.6 | 31.0 / 21.9 / 65.8 / 40.9 / 52.8 | 10.1 s → 7.3 s      |
| 4     | 10,000  | 27.9 / 20.1 / 63.2 / 44.4 / 51.6 | 27.9 / 20.1 / 65.0 / 42.5 / 51.7 | 12.5 s → 8.6 s      |
| 5     | 10,000  | 24.9 / 18.1 / 61.9 / 44.9 / 51.6 | 24.9 / 18.1 / 64.6 / 41.1 / 52.0 | 14.5 s → 9.7 s      |
| 7     | 10,000  | 20.4 / 14.8 / 60.8 / 46.5 / 50.6 | 20.4 / 14.8 / 63.9 / 40.0 / 51.5 | 18.7 s → 11.5 s     |
| 3     | 100,000 | —                                | 31.1 / 22.0 / 65.9 / 41.7 / 52.7 | 102.8 s (after)     |
| 4     | 100,000 | —                                | 28.1 / 20.4 / 65.2 / 41.5 / 52.2 | 123.8 s (after)     |
| 5     | 100,000 | —                                | 24.8 / 18.1 / 64.7 / 40.9 / 52.0 | 138.0 s (after)     |
| 7     | 100,000 | —                                | 20.4 / 14.9 / 63.7 / 40.3 / 51.2 | 165.0 s (after)     |

6-max healthy ranges (`HEALTHY_RANGES['6-max']`): VPIP 20–28, PFR 14–22, Aggression 50–66, WTSD 30–42, W$SD 47–57.

Before: WTSD was outside at 4, 5 and 7 seats (10k: 44.4, 44.9, 46.5) and VPIP at 3 seats (31.0). After, WTSD is
inside at every size over 100,000 hands.

Proposed follow-ups (healthy-range misses after the change; stat, size, value, range):
1. VPIP, 3 seats, 31.1 (100k) / 31.0 (10k) / 31.2 (5k), healthy 20–28. Preflop chart driven, unchanged by this story.
2. VPIP, 4 seats, 28.1 (100k), healthy 20–28 (inside at 10k 27.9 and 5k 28.0). Preflop, unchanged by this story.
3. WTSD, 4 seats, 42.5 (10k) / 42.7 (5k), healthy 30–42 (inside at 100k: 41.5).

`npm run -s playtest:million -- --lineups` wall time, run alone: before 537 s, after 511 s (TASK-7.26 after: 588.6 s).
No growth (not > 2×). Both PASS, 0 violations.

CLI `npm run -s playtest -- --hands 10000 --seed 42 --size <n>` after: 3 → 7 s, 4 → 9 s, 5 → 10 s, 7 → 12 s; 0
invariant violations each (before also 0 each).

### SPEC-09 byte-identical checks
`npm run -s playtest -- --hands 2000 --seed 42 --size <n>` before vs after, `cmp`: sizes 2, 6 and 9 identical.

### Commands and results
- `npx vitest run tests/golden tests/advice/size-ranges.acceptance.test.ts tests/advice/range-model.acceptance.test.ts
  tests/advice/small-table-ranges.acceptance.test.ts tests/advice/postflop-ranges.test.ts`: 10 files, 307 tests passed.
- `TLH_SLOW_TESTS=1 npx vitest run tests/advice/small-table-ranges-playtest.acceptance.test.ts` (run alone): 4 passed,
  529.8 s.
- `npm run format`: clean. `npm run lint`: pass. `npm run typecheck`: pass.
- `npm test`: 325 files passed, 7 skipped; 1454 tests passed, 52 skipped (182.1 s, coverage thresholds met).
- `npm run test:slow` as a whole and `npm run e2e` were not run in this build (not requested by the orchestrator);
  the new slow file was run on its own above.
