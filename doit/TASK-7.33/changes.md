# TASK-7.33 changes

- `src/advice/postflop.ts` — `requiredCountsRiverBet` and `valueThresholdPct` are required on `PostflopRecommendation`; doc comments updated (SPEC-01).
- `src/advice/explanations.ts` — `{riverBet}` slot after `{def:pot-odds}` in the 5 owed-bet templates; new `POT_ODDS_RIVER_BET_CLAUSE`; `POT_ODDS_LEAD` and `POT_ODDS_RIVER_BET_LEAD` removed (SPEC-02, SPEC-03).
- `src/advice/explain.ts` — `explainPostflop` fills `riverBet` from the clause template; no `.replace` (SPEC-04).
- `src/advice/grade.ts` — `finitePct` accepts `valueThresholdPct`; aggression-margin path validates a present threshold after the calling-range equity (SPEC-05, SPEC-06, A-4).
- `src/advice/golden.ts` — `GoldenNumbers` keeps `valueThresholdPct` optional (A-1).
- `tests/advice/advice-hardening.acceptance.test.ts` — new acceptance tests for SPEC-01, SPEC-02, SPEC-03, SPEC-05, SPEC-06.
- `tests/advice/explain.test.ts` — factory gains the two fields; placeholder `values` gains `riverBet`; new SPEC-04 unit test.
- `tests/advice/value-copy.acceptance.test.ts` — (locked, TASK-8.1) factory gains `requiredCountsRiverBet: false`, `valueThresholdPct: 50` only.
- `tests/table/hint.test.ts` — hand-built recommendation gains the two fields.
- `tests/advice/value-bet.acceptance.test.ts` — (locked, TASK-7.8) AC#6 title 50.1% → 65.1% only (SPEC-07).
- `tests/golden/postflop-spots.json` — (locked, TASK-7.14) id `6max-flop-co-raise-jj` → `6max-flop-co-raise-jj-3way` only (SPEC-08).
- `docs/advice/golden-spots.md` — new "Changes from TASK-7.33" section logging the id re-pin (D-3).
- `docs/advice/explanations.md` — one sentence: the clause is its own template filled into `{riverBet}`.

No new dependencies.
