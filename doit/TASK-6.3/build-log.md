## BUILD (TASK-6.3)
- Implemented `deviations` in the style format (`src/bots/style.ts`), `calling-station.json`, `decideCallingStation`, and the worker dispatch (D-3).
- Examples A–C verified against the real code; all spec values match (A: seed 3757549955, u 1339328068, call 2 vs TAG raise 8; D-5 point 0: seed 3761756536, u 3312332681, both raise 8; B: fold[30] flop 5c3c, k=1, seed 2826725471, u 523750097, call 4 vs TAG fold; C: fold[0] CO 97o, seed 4053618777, u 2247995765, fold). Asserted in `tests/bots/calling-station.acceptance.test.ts`.
- `npx vitest run tests/bots/calling-station.acceptance.test.ts` → 6 passed; `tests/bots/calling-station.test.ts` → 2 passed; `style.test.ts` + `advice-service.test.ts` → 7 passed.
- `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256` → `aacd5e94dccba90b4b50936ba1bb2b08aff2bda37d427efdfb56a6b07e488e01` (Player actions 88920, violations 0): unchanged.
- `npm test` → 157 files passed / 1 skipped; 548 tests passed / 7 skipped; coverage all files 96.96% stmts, `style.ts` 100%.
- `npm run lint`, `npm run typecheck` → clean. `npm run format` run. `npm run e2e` → 130 passed, 12 skipped.
- Gate build #1: PASS (840 changed lines vs budget 650: warn; most of it is the 6-test acceptance file and the SPEC-07 validator cases).
