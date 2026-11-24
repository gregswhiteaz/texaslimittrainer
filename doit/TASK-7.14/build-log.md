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

## FIX round 1
- Item 1 fixed: j7o "Bottom pair of sevens"; t7s and k7o "Third pair of sevens"; k3s "The nut flush draw"; 98o flush clause replaced with "the board already shows three clubs, so even that card may not be good"; k6o "missed clubs" -> "bluffs, weaker pairs".
- Item 2 fixed: graded example renamed `graded-postflop-fold-minor-6max-flop-gutshot`; text now "a gutshot to the four plus a few small pair outs". Grade, rule id, margin 4.6 unchanged.
- Orchestrator MINORs fixed: 92o adds "fours full"; a3o "only backdoor draws"; ajo "the button bet the turn after calling our flop bet"; q3s acknowledges the three-heart board.
- Programmatic re-check (temp script, deleted): computed for all 120 spots the best made hand, pair rank vs board ranks, pocket-pair over/under, suited counts with nut status, and one-card straight-out ranks; compared with each justification. One further misnaming found and fixed: fr-river-bb-check-52o "five-high with the board pair" (hand is the board's sevens with an ace kicker) -> "only the board's pair of sevens with an ace kicker". Graded-example texts also re-checked; no other issues.
- No recorded actions, spots or assertions changed. `npm run format` clean, `npm run lint` clean, `npx vitest run tests/golden`: 5 files, 282 tests passed.

## FIX round 2
- Item 1 fixed: 6max-turn-btn-bet-94o clause now "since the deuces, threes and weaker fours that call trail our hand"; hu-river-bb-call-tt now "bets missed straight draws, bluffs and weaker pairs here, though the river club completes some flushes". No action changed.
- Re-check: listed every spot whose text says hands trail/beat us, are worse/ahead, or names missed draws (53 spots), and checked each against hole cards and board (made hand, which named hands really beat or trail us, whether named missed flush/straight draws completed on the river). No further hits. Graded examples contain no such claims.
- Commands: `npm run format` clean; `npx vitest run tests/golden` → 5 files, 282 tests passed.
