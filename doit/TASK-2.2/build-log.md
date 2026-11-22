# TASK-2.2 build log

## BUILD
- Implemented `TABLE_SIZES` / `configForPlayers` (session.ts), heads-up `positionName`, the Game Config players select + approximate note + `.config-note` style.
- Wrote SPEC-01..04 (`tests/ui/game-config-players.acceptance.test.tsx`), SPEC-05..09 (`tests/table/table-size.acceptance.test.ts`), SPEC-10/11 (`e2e/players-choice.spec.ts`), SPEC-12 unit test, 2-seat `positionName` unit lines.
- Applied only the Q-5 dropdown count/selection edits to the 5 locked tests.
- SPEC-11 replay words: SCENARIO_CODE (9e3779b9 1 2 3); the heads-up button bot calls/raises (pinned in SPEC-06).
- Commands:
  - `npm run format` — ok; `npm run lint` — 0 errors, prettier clean; `npm run typecheck` — ok.
  - `npm test` — 187 files passed / 2 skipped; 676 tests passed / 14 skipped; coverage 97.51% stmts overall.
  - `npm run e2e` ×2 — 146 passed / 12 skipped both runs (Chromium + WebKit).
  - `npm run playtest -- --hands 10000 --seed 42 [--size 2|--size 10]` — 0 invariant violations at 2, 6 and 10.
- Scope: 629 changed lines vs budget 560 (warn band) — mostly the three new acceptance test files and the axe worker-timer helper copied into the e2e spec (same pattern as review/next-hand/table-display specs).
- Gate build #1: PASS (629 lines, 14 files; scope lines warn).

## FIX (judge R1)
- J-1-01: fixed — `e2e/players-choice.spec.ts` first test now asserts the `You` row reads `Seat ${Math.min(5, n)}` after each size pick. Mutant (row uses `config.userSeat`) fails in Chromium and WebKit (expected `Seat 2`, got `Seat 5`); source restored byte-for-byte (git diff clean). `npm run format`; `npx playwright test e2e/players-choice.spec.ts` → 4 passed (chromium + webkit).
