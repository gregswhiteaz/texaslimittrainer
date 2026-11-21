# TASK-3.13 build log

## BUILD 1 (2026-11-21)
- Added `RAPID_BOT_DELAY_MS` / `botActionDelayMs` in `src/table/session.ts`; the bot step in `useTableSession` uses it (deal step keeps 0).
- Wrote `tests/table/pace.test.ts` (SPEC-01), `tests/table/pace.acceptance.test.ts` (SPEC-03), `e2e/rapid-pace.spec.ts` (SPEC-02, SPEC-04/05/06), `e2e/support/pace-harness.tsx` + `buildPaceHarness`/`openPaceHarness`, extended `e2e:slow`, README bullet.
- SPEC-02 meter: a reading that reaches the cap without the bot action showing is returned as cap + 1 (not "= cap"), so the `<= 100` check actually fails. As first written ("recorded as cap") the mutation `RAPID_BOT_DELAY_MS = 400` still passed; with cap + 1 it fails ("bot action 1: 101 ms of fake time"). The mutation also fails `tests/table/pace.test.ts`. Reverted to 0 afterwards.
- `npx vitest run tests/table/pace*.ts`: 3 passed.
- `npm run e2e -- e2e/rapid-pace.spec.ts`: 4 passed (SPEC-02, both projects), 6 skipped (opt-in reason).
- `npm run e2e:slow` (run once, Chromium, real timers; wall 6:07): 14 passed, 5 skipped, 1 failed.
  - SPEC-04 6-max: passed (test time 2.9 s).
  - SPEC-06 200 hands: passed, test time 6.1 min (so elapsed < 6.1 min, about 1,950+ hands/hour; at least 300 s of 1.5 s gaps asserted). The list reporter does not print annotations, so the exact elapsedMs/handsPerHour JSON was not captured.
  - SPEC-05 10-max: FAILED (timeout 180 s). The page error is "The 6-max chart needs 6 dealt-in seats, got 10" (`src/advice/preflop.ts:51`), so no 10-player hand can be played until full-ring charts exist (TASK-7.6). See `blocked.json`.
  - responsive-table timing checks: all passed.
- `npm run format`; `npm run lint`: 0 errors; `npm run typecheck`: 0 errors.
- `npm test`: 148 files passed, 1 skipped; 517 tests passed, 7 skipped; coverage 96.8% statements overall.
- `npm run e2e`: 130 passed, 12 skipped (17.0 s).
- Playtest 10,000 hands cash and sng (seed 42): Invariant violations: 0 for each.
- Blocked: SPEC-05 (AC#2) is infeasible with the current advice engine. Wrote `doit/TASK-3.13/blocked.json`.

## FIX 1 (2026-11-21) — fix brief: Option 4 for SPEC-05
- SPEC-05 blocked → fixed (recorded deviation): new test-only `e2e/support/pace-advice.worker.ts` (marker `tlh-test-pace-advice`) runs the production `installAdviceWorker` + `handleAdviceRequest` with a non-chart `decideBot` (first legal of raise, bet, call, check; deterministic). `pace-harness.tsx` creates the app-wide advice client with it, so 10-max bot turns still go useTableSession → `botActionDelayMs` → shared advice client → worker reply. Raising bots mean the user always owes chips preflop, so the scripted Fold is legal and no review (and no 10-seat grading) is triggered. SPEC-05 assertions unchanged (≤ 300 ms, ≥ 9 samples, user folds preflop). TASK-7.6 carries the re-run with real TAG bots.
- SPEC-02 cap + 1 correction kept (see BUILD 1).
- Deleted `doit/TASK-3.13/blocked.json`.
- `npm run build`, then grep: no `tlh-test-pace-advice` in `dist/`; exactly 1 `advice.worker-*` asset.
- `npm run format`; `npm run lint`: clean; `npm run typecheck`: clean.
- `npm run e2e`: 130 passed, 12 skipped (16.5 s).
- `npm run e2e:slow -- --reporter=list,json` (run once, wall 6.1 min): 15 passed, 5 skipped, 0 failed. Annotations:
  - SPEC-04 6-max: `{"samples":80,"max":16,"median":0.6}` ms (test 2.8 s).
  - SPEC-05 10-max (pace worker): `{"samples":235,"max":45.8,"median":0.2}` ms (test 7.9 s).
  - SPEC-06 200 hands: `{"hands":200,"elapsedMs":365769,"handsPerHour":1968.5}` (6.1 min; ≥ 300,000 ms of 1.5 s gaps included).
  - responsive-table frame times: `{"samples":290,"p95":16.7,"max":16.8}`.
- Gate: `doit.py gate TASK-3.13 --phase build` PASS (521 lines / 10 files; warnings: over line and file budget, `e2e/support/pace-advice.worker.ts` outside the spec's file list, both from the fix-brief deviation). Tests now locked.
