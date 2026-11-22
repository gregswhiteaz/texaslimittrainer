## BUILD (TASK-6.4)
- Widened the deviation format (`src/bots/style.ts`), added `maniac.json` (text verbatim from spec §5), `decideManiac`, and the worker dispatch (D-3).
- Examples A–G verified against the real code; every spec value matches (codes, seeds, first draws u, hole cards, streets, bets, and actions: A bet 4 vs TAG check; D check; E raise 8 vs check; B raise 12 vs call 4; C raise 16 vs call 8; F call 14 vs TAG fold; G call 16 under both codes). All pinned in `tests/bots/maniac.acceptance.test.ts`.
- SPEC-07 note: `postflop/call` has only one supported `instead` (`raise`), so "repeated with different `instead` values" is shown with `preflop/fold` (`raise` then `call`) in addition to the repeated `postflop/call` case.
- `npx vitest run tests/bots/maniac.acceptance.test.ts` → 6 passed (5.9 s); `tests/bots/maniac.test.ts` → 2 passed (~4.5 s incl. 200-hand seated run); `style.test.ts` + `advice-service.test.ts` → pass.
- `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256` → `aacd5e94dccba90b4b50936ba1bb2b08aff2bda37d427efdfb56a6b07e488e01` (Player actions 88920, violations 0): unchanged.
- `npm test` → 159 files passed / 1 skipped; 557 tests passed / 7 skipped; coverage all files 96.98% stmts.
- `npm run lint`, `npm run typecheck` → clean. `npm run format` run. `npm run e2e` → 130 passed, 12 skipped.
- Gate build #1: PASS (762 changed lines vs budget 750: warn; mostly the 6-test acceptance file).

## FIX (judge round 1)
Local timings with `npx vitest run tests/bots/maniac --coverage` (the mode `npm test` uses on CI; CI ran about 3x slower):

| Test | Before | After |
|---|---|---|
| maniac.test.ts: Maniac draws once only at deviating decisions | 7962 ms | 981 ms |
| maniac.test.ts: seated Maniacs among seeded TAGs break no invariant (200 hands → 20-hand smoke) | 15288 ms | 1717 ms |
| maniac.test.ts: ... over 200 hands (new name; runs only with TLH_SLOW_TESTS=1, 2907 ms without coverage) | n/a | skipped |
| maniac.test.ts: checked to on every postflop street an aggressive Maniac bets (new, J-1-01) | n/a | 15 ms |
| maniac.acceptance.test.ts (locked, not changed): check / call / probability / capped / worker | 10319 / 1505 / 1959 / 353 / 440 ms | same |

- Item 1 (SPEC-11) / item 2 (J-1-02): partly fixed in `tests/bots/maniac.test.ts`. Equity is now memoized for TAG and the advice. Views come from the first 50 hands of the D-5 run, which hold every example plus the postflop fold (hand 41). The seated run plays 20 hands every push, and the 200-hand run is opt-in. Most of the remaining cost is in the locked acceptance file's `collect()`: 9.0 s of the 10.3 s check-point test under coverage. It runs 156 equities, each computed twice, because seat 1 plays `seededTagPolicy` without the memo. A probe of `collect()` measured 9.0 s → 5.1 s with memoized TAG, and → 0.94 s with memoized TAG and 40 hands. That needs the file unlocked, so it's written up in `blocked.json`.
- Option 1 (approved, file unlocked): in `collect()`, seat 1 now plays `decideTag(view, {random: botRandom(botDecisionSeed(code, view)), equity})` with the shared memo instead of `seededTagPolicy(code)`. It's still 200 hands, and no assertion changed. A one-off check (a temporary test, now deleted) ran the 200-hand seed-61 collection both ways. Both gave 423 seat-1 decisions, and the JSON of every (view, action) pair (795,895 bytes) and the run summary were byte-identical. With coverage, the check-point test went from 10319 ms to 6543 ms; the others are about the same (call 1489, probability 1915, capped 345, worker 421 ms). The `blocked.json` file was deleted.
- J-1-01: fixed. The new test asserts that the aggressive Maniac bets at every flop, turn and river check point with a legal bet, and that river points exist. With the mutant (`street === 'river' && owed === 0` → advice move) in `src/bots/maniac.ts`, the new test fails. The mutant was reverted.
- `npm test` (after option 1) → 159 files passed, 1 skipped; 558 tests passed, 8 skipped; coverage 96.98% stmts. `npm run lint` and `npm run typecheck` clean. `npm run format` run.
