# TASK-7.48 changes

- `src/advice/ranges.ts` — `TYPICAL_VPIP` + `typicalVpip`; `relativePfrPct` renamed `relativeStatPct` (old name kept as an alias, A-1); `OBSERVED_LINE_STAT` maps open-raise/re-raises to `relative-pfr` and calling lines to `relative-vpip` (A-2); `o` is now `min(100, d × stat ÷ typical)` for every scaled line; doc comments.
- `tests/advice/observed-relative.acceptance.test.ts` — new acceptance test: AC#1, AC#2, AC#3, AC#7 (SPEC-01, 02, 03, 07).
- `tests/advice/observed-ranges.test.ts` — `TYPICAL_VPIP` drift test (SPEC-04); re-pinned `caps the observed hands at 100` and the renamed `scales each line relative to a typical player…` (SPEC-05).
- `tests/advice/observed-ranges.acceptance.test.ts` — locked re-pin AC#2 expected `o` (owners TASK-7.13, TASK-7.43).
- `tests/advice/observed-resize.acceptance.test.ts` — locked re-pin AC#1 typical stats, AC#2 relative wide target + VPIP 100 width + all-169 line, AC#3 PFR-5 narrow target (owner TASK-7.43).
- `tests/advice/observed-reraise.acceptance.test.ts` — locked re-pin AC#4 (renamed, relative expected), AC#5 (renamed, relative `o`, pinned widths), AC#6 open-raise doc row (owner TASK-7.44).
- `tests/advice/small-table-ranges.acceptance.test.ts` — locked re-pin AC#1 width 60 → 100 (owner TASK-7.35).
- `tests/ui/review-numbers.acceptance.test.tsx` — locked re-pin of two equity strings (owners TASK-9.3, TASK-7.43).
- `tests/golden/postflop-spots.json` — `6max-turn-bb-call-a6s` button stats 100/12/9 and reworded justification (Q-1; owner TASK-7.14).
- `docs/advice/range-model.md` — line-to-stat table, typical VPIP paragraph with examples, Known limits (per-seat assumption, cap thresholds).
- `doit/TASK-7.13/state.json`, `doit/TASK-7.14/state.json`, `doit/TASK-7.35/state.json`, `doit/TASK-7.43/state.json`, `doit/TASK-7.44/state.json`, `doit/TASK-9.3/state.json` — written by `doit.py unlock` for the approved re-pins (not edited by hand).

No new dependencies.
