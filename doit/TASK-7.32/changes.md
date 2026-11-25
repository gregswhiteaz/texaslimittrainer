# TASK-7.32 changes

No new dependencies.

## Source
- `src/advice/postflop.ts` — `VALUE_RAISE_THRESHOLD_PCT = 65`; the turn price counts one river big bet R (A-1);
  new `requiredCountsRiverBet` and `valueThresholdPct` fields (optional in the type so hand-built inputs in locked
  tests still type-check; always set by `recommendPostflop`); the explanation gets the applied threshold.
- `src/advice/explain.ts` — `explainPostflop` swaps in the Q-3 river-bet clause when `requiredCountsRiverBet`.
- `src/advice/explanations.ts` — `POT_ODDS_LEAD` / `POT_ODDS_RIVER_BET_LEAD` copy constants (Q-3 inline clause).
- `src/advice/grade.ts` — `EquityGradeInput.valueThresholdPct`; `aggression-margin` measures from
  `valueThresholdPct ?? 50` (A-3).
- `src/advice/golden.ts` — the clear-cut rule passes the engine's `valueThresholdPct` to the grader, so a golden spot
  is clear-cut under the same grading the learner gets (A-3).
- `src/bots/tag.ts` — exports `BOT_ADVICE = { opponentRanges: 'actions' }`; `decideTag` spreads it before
  `adviceOptions(options)` (A-5).
- `src/bots/calling-station.ts`, `src/bots/maniac.ts`, `src/bots/rock.ts` — same `BOT_ADVICE` spread.

## Docs and requirements
- `docs/advice/postflop-rules.md` — turn price, 65% value-raise threshold, worked examples, bots on action ranges,
  and the "Why bots almost never folded (TASK-7.32)" investigation section (SPEC-01).
- `docs/advice/range-model.md` — "Who uses it": bots now use action ranges with the typical-player basis.
- `docs/advice/explanations.md` — value-raise line is 65.0%; the Q-3 river-bet clause.
- `docs/advice/golden-spots.md` — clear-cut rule names the applied threshold; "Changes from TASK-7.32 (WTSD fix)"
  re-pin log.
- `dreams/limit-holdem-trainer/requirements.md` — REQ-033.1 and REQ-033.2 amended (Q-1); changelog row 1.10.
- `package.json` — `tests/advice/postflop-folding.acceptance.test.ts` added to `test:slow`.

## Tests
- `tests/advice/postflop-folding.acceptance.test.ts` — new: SPEC-02, 03, 04, 06, 07 (2,000-hand fast check) and
  SPEC-08 (100,000-hand slow check).
- `tests/advice/postflop.test.ts` — unit re-baselines for the turn price and the 65% raise threshold; new SPEC-05
  explanation test.
- `tests/bots/maniac.test.ts`, `tests/bots/rock.test.ts` — expected advice uses `BOT_ADVICE`.
- Locked re-baselines (TASK-7.32 Q-1, values replaced one-for-one, check counts kept):
  `tests/advice/grade.acceptance.test.ts`, `tests/advice/implied-odds.acceptance.test.ts`,
  `tests/advice/postflop-coverage.acceptance.test.ts`, `tests/advice/postflop.acceptance.test.ts`,
  `tests/advice/value-bet.acceptance.test.ts`, `tests/bots/calling-station.acceptance.test.ts`,
  `tests/bots/maniac.acceptance.test.ts`, `tests/bots/tag-mixing.acceptance.test.ts`,
  `tests/bots/tag.acceptance.test.ts`, `tests/golden/postflop-spots.json`, `tests/golden/graded-examples.json`,
  `tests/playtest/games.acceptance.test.ts`, `tests/playtest/style-bots.acceptance.test.ts`,
  `tests/table/next-hand.acceptance.test.ts`, `tests/table/short-stack.acceptance.test.ts`,
  `e2e/short-stack.spec.ts` (side pot $124 → $44, same seed as the unit test).

Note: the gate also lists TASK-10.5 files (`docs/stats/leaks.md`, `src/stats/leaks.ts`, report UI, …) because
`state.json` `base_commit` (65771305) predates the merge of main into this branch (a64e78d); this build did not touch
them.
- `tests/advice/explanations.acceptance.test.ts` — value-raise threshold 65.0% (TASK-7.10 locked; unlocked; orchestrator edit)
- `tests/table/review.acceptance.test.ts` — REVIEW_FOUR river grade Minor (TASK-9.1 locked; unlocked; orchestrator edit)
