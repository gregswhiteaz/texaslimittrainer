# TASK-6.22 changes

- `src/table/session.ts` — `stepBot(table, policy?)`: with no policy, decides with the seeded TAG decision `decideTag(turn.view, { random: botRandom(turn.seed) })`; an explicit policy decides as before. Imports `botRandom` and `decideTag` (replacing `tagPolicy`).
- `tests/table/session.acceptance.test.ts` — locked TASK-3.1 test, edited under Q-1: line 177 expects the exact seeded decision (one added import); assertions unchanged.
- `tests/table/bot-step-seeded.acceptance.test.ts` — new acceptance test for SPEC-01 (mixed spot, code 26 seat 3 raise vs unseeded fold) and SPEC-02 (every default bot step equals the app worker's decision, codes 26 and 46).

No new dependencies.
