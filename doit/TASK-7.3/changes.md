# Changes — TASK-7.3

- `src/advice/postflop.ts` — new: `recommendPostflop`, `POSTFLOP_RULE_IDS`, `toPct`, result/option types; every-unseen-combo opponent ranges, pot and call amount, the three rules.
- `src/advice/recommend.ts` — new: `Recommendation` union, `RecommendOptions`, `recommend(view)` dispatcher by street (Q-1).
- `docs/advice/postflop-rules.md` — new: postflop rules design document (inputs, rules `check-free`, `pot-odds-call`, `pot-odds-fold`, worked examples, justifications, rules not yet applied).
- `tests/advice/postflop.acceptance.test.ts` — new: AC#1–AC#6 acceptance tests (SPEC-01..06), including the `ruleProblems` consistency helper.
- `tests/advice/postflop.test.ts` — new: unit tests per rule, `toPct`, ranges/pot/call amount, errors and dispatcher (SPEC-07..09), including the rounded-comparison pot-odds-call case (fix round 1).
- `tests/advice/postflop.perf.test.ts` — new: postflop advice latency test (SPEC-10).

No new dependencies.
