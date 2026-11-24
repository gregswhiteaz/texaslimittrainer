## BUILD (TASK-7.14)

- Extended `src/advice/golden.ts` (postflop spots, clear-cut rule, memoised A-1 advice, graded examples).
- Authored 120 postflop spots with a scratch measuring tool (deleted): generated candidate lines, kept only spots the
  real advice marks clear-cut, rejected ones whose answer is not sound poker, then wrote an original justification
  per spot. Authored 9 graded examples (exact-enumeration postflop spots).
- Changed the full-ring BTN `raise` chart cells 99/88 to raise (Q-1).
- Could not apply the AC#7–9 edits to `tests/golden/preflop-spots.json`: it is locked under TASK-7.11 (hash in
  `doit/TASK-7.11/state.json`) and the edit was refused. The verified replacement is in
  `doit/TASK-7.14/preflop-spots.proposed.json` (parses, all 110 spots agree with the engine, distinct
  justifications). Wrote `blocked.json`.
- Commands:
  - `npx vitest run tests/golden/` → 282 tests, 278 pass, 4 fail (all from the locked preflop file: preflop AC#3
    `fr-btn-raise-88`, suite AC#7, AC#8, AC#9); 1.1 s wall clock.
  - `npm test` → 1200 tests: 1155 pass, 41 skipped, 4 fail (the same four); no other test is affected by the chart change.
  - unit-only coverage of `src/advice/golden.ts` (`postflop-golden.test.ts` + `golden-spots.test.ts`): 99.6% lines.
  - `npm run typecheck` → clean; `npm run lint` → clean.
  - `npm run -s playtest -- --hands 10000 --seed 42` → `Invariant violations: 0`.

## FIX (block 1)

- Item 1: fixed — copied `doit/TASK-7.14/preflop-spots.proposed.json` over `tests/golden/preflop-spots.json` (AC#7–9),
  deleted the proposed file, listed the preflop file in `changes.md`.
- Commands: `npm run format`, `npm run lint` → clean, `npm run typecheck` → clean, `npx vitest run` → 1200 tests:
  1159 pass, 41 skipped, 0 fail.
