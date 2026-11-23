# TASK-7.9 changes

- `src/advice/ranges.ts` — new exported `drawOuts(hole, board)` (flush draw 9 outs, open-ended straight draw 8, union for combos; [] on the river, without a draw or when made); `hasOpenEnder` now shares `rankMask`/`openEnderStart` with it (`classifyCombo` results unchanged); private `hasStraight`.
- `src/advice/postflop.ts` — rule id `implied-odds-call` between `pot-odds-call` and `pot-odds-fold`; `PostflopRecommendation` gains `impliedRequiredEquityPct` (call ÷ (pot + call + bigBet × opponents not all in), null when the rule can't apply) and `outs`.
- `docs/advice/postflop-rules.md` — "Draw and outs" and "Implied required equity" definitions, rounding note, new "Rule implied-odds-call" section (AC#1/AC#3 example + Why), `pot-odds-fold` condition, "Not applied yet" drops implied odds.
- `tests/advice/implied-odds.acceptance.test.ts` — new acceptance file (SPEC-01..SPEC-06).
- `tests/advice/postflop.test.ts` — `describe('rule implied-odds-call')` (SPEC-07); `stateAfter` takes an optional deck and stacks.
- `tests/advice/ranges.test.ts` — `describe('drawOuts')` (SPEC-08).
- `tests/advice/grade.test.ts` — unlocked re-pin: "recommendations are grader inputs…" stub equity 0.1 → 0.08 (below the 8.3% implied price), margin 6.7 → 8.7, still minor.
- `tests/advice/postflop.acceptance.test.ts` — locked re-pin (TASK-7.3, Q-3): AC#1 expects `impliedRequiredEquityPct: 8.3` and the 9 heart outs; AC#2 hero Ah5h → Ad5c. No assertion dropped.
- `tests/advice/value-bet.acceptance.test.ts` — locked re-pin (TASK-7.8, Q-3): AC#9 expected keys add `impliedRequiredEquityPct`, `outs`; `expectedRule` gains the `implied-odds-call` branch. No assertion dropped.

No new dependencies.
