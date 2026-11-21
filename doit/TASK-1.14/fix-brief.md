# Fix brief — TASK-1.14 (code review round 1 MINOR, applied in-story)

No blocking findings. One test gap to close (test-only; no src change):

1. **Checker all-in size exemptions untested** (`src/engine/invariants.ts` ~line 106): removing the checker's
   `amount === allInTo` condition from the bet clause or the raise clause leaves every test green, because only a faulty
   engine can reach those clauses. Add unit tests in `tests/engine/short-all-in.test.ts` (unlocked) that hand
   `checkStep`/`checkState` a crafted state/step (or use the faulty-engine pattern in `tests/support/faulty-engine.ts`)
   where (a) a short **bet** that is NOT all-in and (b) a short **raise** that is NOT all-in are recorded, and assert the
   exact bet-size violation for each; also assert a genuine short all-in bet/raise produces no violation. Prove each new
   test fails when its exemption condition is removed (exact text replacement, then restore).

Don't touch locked files. Run `npm run format` before the gate. Never push.
