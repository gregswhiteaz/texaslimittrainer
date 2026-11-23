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
