## BUILD (Code Builder) — blocked on SPEC-02

Done: band 65 -> 66 in `STYLE_BANDS`, REQ-027.1, source note, change-log 1.16, style-stats.md sentence; band copies in
`tests/playtest/style-check.test.ts` and in locked `tests/bots/style-bands.acceptance.test.ts:26` (owner-unlocked
edit, Q-1/A-5, for user review); AC#2 strengthening of locked `tests/bots/tag-short-handed.acceptance.test.ts`
exactly as spec §5 (owner-unlocked edit under TASK-7.37 by AC#2, for user review); new slow test + `test:slow` entry.

Commands:
- `npx vitest run tests/bots/tag-short-handed.acceptance.test.ts tests/playtest/style-check.test.ts` -> 2 files, 6 tests passed.
- `npm run -s playtest -- --hands 2000 --seed 42 --size 3 --check-styles` -> exit 0, aggression 65.5% (band 45.0-66.0%), Style check: passed.
- `TLH_SLOW_TESTS=1 npx vitest run tests/playtest/check-styles-three-seats.acceptance.test.ts` (the one permitted 100k run) -> 1 failed, at `expect(code).toBe(0)` (71.9 s).
- `npm run -s playtest -- --hands 20000 --seed 42 --size 3 --check-styles` -> exit 0 (limpers 0/0).
- `npm run -s playtest -- --hands 50000 --seed 42 --size 3 --check-styles` -> exit 1: `One action only: TAG preflop-limpers, recommended 1, alternative 0`; TAG aggression 65.3% inside 45–66.

Blocked: SPEC-02's exit-0 claim is infeasible within scope (REQ-027.5's one-action rule trips on a rare 3-seat
limpers spot), see `blocked.json`. Not done pending the decision: the range-model.md subsection (SPEC-03; the 100k
"after" exit cell depends on it), the SPEC-05 mutation check, the SPEC-06 base comparison and the full gates.
