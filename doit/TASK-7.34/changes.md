# Changes — TASK-7.34

- `tests/advice/equity.perf.test.ts` — opt-in gate `OPT_IN` (TLH_SLOW_TESTS=1 or EQUITY_PERF_SCALE set) on the timed test via `it.runIf`; timeout moved to the options argument (same 120 s); header comment updated.
- `tests/advice/postflop.perf.test.ts` — `OPT_IN` (TLH_SLOW_TESTS=1 or ADVICE_PERF_SCALE set) replaces `SLOW` on all tests; describe-level 120 s timeout; `limpedPreflop(seats)` replaces the literal 10-seat sequence; new `HU_FACING_BET` / `NINE_SEAT_FACING_BET` views and `HEADROOM_SCENARIOS` (9-seat vs 8 opponents at 200 ms timed first, then HU facing a bet at 25 ms) and the `headroom: …` test (calling-range check, opponents 1/8, p95 ≤ 0.75 × target × scale); header comment updated.
- `package.json` — `test:slow` now also runs `tests/advice/equity.perf.test.ts`.
- `README.md` — Speed targets: both advice perf files are opt-in; headroom command added.

No new dependencies. No `src/` change.
- `doit/TASK-7.34/build-log.md` — build log.
- `doit/TASK-7.34/changes.md` — this file.
- `tests/advice/postflop.perf.test.ts` — review NIT: comment states the measured 6 of 17 (orchestrator)
