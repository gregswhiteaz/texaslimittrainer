# TASK-7.10 changes

- `src/advice/explanations.ts` — new: authored explanation content (10 concepts with terms and one-clause definitions, postflop templates per rule id plus pot-odds-fold-implied, preflop context per situation, preflop action sentences, seat names, rank names).
- `src/advice/explain.ts` — new: formatPct, fillTemplate, handClassName, explainPreflop, explainPostflop.
- `src/advice/preflop.ts` — PreflopRecommendation gains explanation (last field), filled by explainPreflop at the end of recommendPreflop.
- `src/advice/postflop.ts` — PostflopRecommendation gains explanation (last field), filled by explainPostflop(rec, VALUE_THRESHOLD_PCT) at the end of recommendPostflop.
- `docs/advice/explanations.md` — new: what is explained, the concept list, numbers quoted per rule, preflop basis, exclusions, originality statement (REQ-061.2).
- `tests/advice/explanations.acceptance.test.ts` — new acceptance file (SPEC-01..SPEC-05); D-6 split in FIX round 1 (2,000 every push, 10,000 opt-in).
- `tests/advice/explain.test.ts` — new unit tests (SPEC-06..SPEC-08): exact copy, authored data hygiene, helpers.
- `tests/advice/postflop.acceptance.test.ts` — locked re-pin (TASK-7.3, Q-3): AC#1 expected object adds explanation: expect.any(String). No assertion dropped.
- `tests/advice/value-bet.acceptance.test.ts` — locked re-pin (TASK-7.8, Q-3): AC#9 expected key list adds explanation. No assertion dropped.

- `tests/advice/preflop.acceptance.test.ts` — locked (TASK-7.2, block 1 auto-accepted): AC#6 typecheck sandbox list gains explain.ts and its 7 imports. No assertion changed.

No new dependencies.

FIX round 1:
- `tests/advice/explanations.acceptance.test.ts` — D-6 split: same AC#1–AC#5 checks on the first 2,000 decisions every push and on 10,000 under TLH_SLOW_TESTS=1.
- `package.json` — test:slow gains tests/advice/explanations.acceptance.test.ts (D-6).
- `src/advice/explanations.ts` — now holds ADVICE_ING (authored text, D-4).
- `src/advice/explain.ts` — imports ADVICE_ING from explanations.ts.
