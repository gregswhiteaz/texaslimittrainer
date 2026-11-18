# Changes — TASK-1.2

- `src/engine/cards.ts` — new: `Card` encoding (rank * 4 + suit), `makeCard`, `cardRank`, `cardSuit`, `parseCard`, `parseCards`, `formatCard`.
- `src/engine/hand-evaluator.ts` — new: table-driven 5–7 card evaluator (`evaluate`, `compareHands`, `handCategory`, `HAND_CATEGORIES`, `HAND_RANK_COUNT`, `buildEvaluatorTables`). 13-bit flush table plus a quinary (rank-count) index into a non-flush table; tables built at module load.
- `tests/engine/reference-ranking.ts` — new: independent oracle ranking the 7,462 five-card classes from first principles (imports only `cardRank`/`cardSuit`).
- `tests/engine/hand-evaluator.acceptance.test.ts` — new: AC#1–AC#5 acceptance tests (SPEC-01..04, 06, 07), including the exhaustive 2,598,960-hand check.
- `tests/engine/hand-evaluator.property.test.ts` — new: fast-check properties for AC#3 (SPEC-05) and AC#5 (SPEC-07).
- `tests/engine/cards.test.ts` — new: card helper unit tests (SPEC-09).
- `tests/engine/hand-evaluator.test.ts` — new: error messages, `compareHands`, table size/shape, multi-hand 6/7-card cases (SPEC-08, SPEC-10).
- `tests/engine/hand-evaluator.perf.test.ts` — new: throughput and table-build timing with env-configurable thresholds (SPEC-11, SPEC-12).

No new dependencies.
