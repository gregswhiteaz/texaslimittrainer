# Build log — TASK-1.12

## BUILD
- Engine cap in `legalActions` via exported `STREET_BET_CAP`; policy filter removed; preflop advice reads the engine constant; `fifthBet` fixture per A-4; D-3 stake edit in the locked chip-safety test (only line changed).
- New acceptance file `tests/engine/bet-cap.acceptance.test.ts` (7 tests); invariants unit test added; policy and runner unit tests updated.
- Spec note: SPEC-02's prose says "call 12 on the flop, 24 on turn/river", which contradicts its own §5 worked example ("seat 3 gets call 16" on the turn) and the engine's call = owed rule. In the 3-seat script the seat to act (seat 3, who made the first raise) owes 8 on the flop and 16 on turn/river; the test asserts those values (matches §5).
- `npm run format` ok; `npm run lint` ok; `npm run typecheck` ok.
- `npm test`: 118 files, 418 passed, 6 skipped; coverage thresholds met (all files 96.84% stmts, 94.27% branches).
- `npm run playtest -- --hands 10000 --seed 42 --size 6`: fold 5470, showdown 4530, actions 88831, capped 244, Largest pot $70, violations 0 (byte-identical to baseline).
- `npx playwright test e2e/action-bar.spec.ts e2e/table.spec.ts`: 22 passed (Chromium + WebKit).
