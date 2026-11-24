# TASK-7.15 — recorded build deviations (orchestrator-approved, autopilot)

Judge on substance; spec.md is locked.
1. Test timeouts: AC#4 determinism test and the 100-hand --check-advice cases set to 300,000 ms (spec said 60 s). Plain runtime ~15-20 s; under coverage/contention 78-113 s. Speed targets in spec §9 still hold without coverage. One multiway flop advice costs ~14 ms (spec estimated a 2 ms average incl. preflop).
2. tests/playtest/cli.test.ts: besides the USAGE literal (108-114), the --check-styles regex for USAGE line 1 re-pinned one-for-one to end `[--check-styles] [--check-advice]`; check count kept; not hook-locked.
3. ActionHook view parameter is optional (view?: PlayerView) per D-2 so existing one-argument hooks typecheck; runner always passes it.
