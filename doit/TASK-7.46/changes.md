# TASK-7.46 changes

- `src/playtest/style-check.ts` — `STYLE_BANDS.TAG.aggression` `[45, 65]` -> `[45, 66]` (REQ-027.1, Q-1).
- `dreams/limit-holdem-trainer/requirements.md` — REQ-027.1 aggression 45–66%, REQ-027 source note, change-log row 1.16.
- `docs/stats/style-stats.md` — one sentence noting the TAG aggression ceiling of 66 since TASK-7.46.
- `tests/bots/style-bands.acceptance.test.ts` — locked (TASK-6.16/6.17/6.25), unlocked by Q-1/A-5: line 26 band copy -> `[45, 66]`.
- `tests/playtest/style-check.test.ts` — three `band 45.0-65.0%` strings -> `band 45.0-66.0%` (SPEC-01).
- `tests/bots/tag-short-handed.acceptance.test.ts` — locked (TASK-7.37), unlocked by AC#2: import BOT_ADVICE/BOT_EQUITY; postflop loop adds the advice-engine oracle and two non-vacuity counts (SPEC-04). No assertion removed.
- `tests/playtest/check-styles-three-seats.acceptance.test.ts` — new opt-in slow test (SPEC-02); per Q-2 (recorded deviation) asserts the band claim only (band 45.0-66.0%, 65 < TAG aggression <= 66, no `Outside band: TAG` line), not the exit code; logs the TAG line, exit code and check lines.
- `docs/advice/range-model.md` — new subsection `### TAG aggression band at 3 seats (TASK-7.46)` with before/after table and the 3-seat exit-1 note (SPEC-03).
- `package.json` — new slow test appended to `test:slow`.
- `doit/TASK-7.46/blocked-1.resolved.json` — earlier SPEC-02 block report (resolved by Q-2, renamed by the orchestrator).
- `doit/TASK-7.46/build-log.md` — build log.

No new dependencies.
