## BUILD (TASK-6.4)
- Widened the deviation format (`src/bots/style.ts`), added `maniac.json` (text verbatim from spec §5), `decideManiac`, and the worker dispatch (D-3).
- Examples A–G verified against the real code; every spec value matches (codes, seeds, first draws u, hole cards, streets, bets, and actions: A bet 4 vs TAG check; D check; E raise 8 vs check; B raise 12 vs call 4; C raise 16 vs call 8; F call 14 vs TAG fold; G call 16 under both codes). All pinned in `tests/bots/maniac.acceptance.test.ts`.
- SPEC-07 note: `postflop/call` has only one supported `instead` (`raise`), so "repeated with different `instead` values" is shown with `preflop/fold` (`raise` then `call`) in addition to the repeated `postflop/call` case.
- `npx vitest run tests/bots/maniac.acceptance.test.ts` → 6 passed (5.9 s); `tests/bots/maniac.test.ts` → 2 passed (~4.5 s incl. 200-hand seated run); `style.test.ts` + `advice-service.test.ts` → pass.
- `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256` → `aacd5e94dccba90b4b50936ba1bb2b08aff2bda37d427efdfb56a6b07e488e01` (Player actions 88920, violations 0): unchanged.
- `npm test` → 159 files passed / 1 skipped; 557 tests passed / 7 skipped; coverage all files 96.98% stmts.
- `npm run lint`, `npm run typecheck` → clean. `npm run format` run. `npm run e2e` → 130 passed, 12 skipped.
- Gate build #1: PASS (762 changed lines vs budget 750: warn; mostly the 6-test acceptance file).
