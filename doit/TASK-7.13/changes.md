# Changes — TASK-7.13

- `src/advice/ranges/hand-order.json` — new authored hand order: 169 classes ranked by preflop all-in equity against one random hand, with a justification (D-1).
- `src/advice/ranges.ts` — hand-order loader/validation (`parseHandOrder`, `HAND_ORDER`), `ObservedOpponent`, `OpponentBasis`, width and scaling functions, observed-stat scaling and `basis`/`widthPct` in `estimateOpponentRanges` (a non-array `observed` is ignored).
- `src/advice/postflop.ts` — `observedOpponents` option (actions mode only) and `opponentBasis` on the recommendation.
- `src/advice/explain.ts` — `basisText` and the opponent-type lead clause in `explainPostflop`.
- `src/advice/explanations.ts` — authored basis texts and the opponent-type lead clause.
- `tests/advice/observed-ranges.acceptance.test.ts` — new acceptance tests AC#1–AC#7 (SPEC-01..07).
- `tests/advice/observed-ranges.test.ts` — new unit tests SPEC-08..10 (hand order, snapshot validation incl. non-array snapshot, bots/unseen mode).
- `tests/advice/explain.test.ts` — `opponentBasis` in the fixture plus basis-text and lead-clause cases.
- `tests/advice/postflop.acceptance.test.ts` — locked re-pin D-4: `opponentBasis` added to the AC#1 literal.
- `tests/advice/value-bet.acceptance.test.ts` — locked re-pin (block 1, a): `opponentBasis` added to the AC#9 expected key list.
- `tests/advice/preflop.acceptance.test.ts` — locked re-pin (block 1, b): `src/advice/ranges/hand-order.json` added to the AC#6 typecheck sandbox file list.
- `docs/advice/range-model.md` — "Adjusting to observed play" section (threshold, formula, stats per line, hand order, AA floor, basis, bots excluded).
- `docs/advice/explanations.md` — opponent-type lead described.
- `docs/advice/postflop-rules.md` — TASK-7.13 "later work" note replaced.

No new dependencies.

## FIX (review round 1)

- `src/advice/explanations.ts` — now holds `basisText` (fills the authored basis strings) and `OBSERVED_MIN_HANDS`, so neither ranges.ts nor explain.ts imports the other (breaks the ranges ↔ explain cycle, including via preflop.ts).
- `src/advice/explain.ts` — `basisText` moved out (re-exported from explanations.ts); `OBSERVED_MIN_HANDS` read from explanations.ts instead of ranges.ts.
- `src/advice/ranges.ts` — imports `basisText` and `OBSERVED_MIN_HANDS` from explanations.ts and re-exports `OBSERVED_MIN_HANDS`.
- `src/advice/postflop.ts` — imports `basisText` from explanations.ts.
- `src/advice/ranges/hand-order.json` — justification notes the known limits (Q2o above 76s; PFR scaling widens re-raise ranges) and the follow-up TASK-7.29. Order and equities unchanged.
- `docs/advice/range-model.md` — "Known limits" paragraph with the same note.
- `tests/advice/observed-ranges.acceptance.test.ts` — AC#2 pins the UTG open-raise typical `widthPct` to the default classes' combo count / 1326 × 100 counted in the test, on a view whose dead cards cut the default range.
- `tests/advice/observed-ranges.test.ts` — `rangeWidthPct` against a hand-computed value, the min(n, 100) cap (formula and an estimate at 150 hands), and the PFR/VPIP stat choice for limp, open-raise, call-raise, three-bet, call-three-bet and four-bet.
