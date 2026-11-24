# TASK-7.15 changes

- `src/playtest/advice-check.ts` — created: `AdviceCheck` (double advice + grade per decision, counters, first mismatch), `userAdvice`, `firstDifference` (deep compare with path), `observedSnapshot` (A-1 per-seat snapshot).
- `src/playtest/cli.ts` — modified: `--check-advice` flag (parse, errors, USAGE), Options echo, `Advice check:` / `First advice mismatch:` lines, `advise` seam parameter on `main`.
- `src/playtest/runner.ts` — modified: `playHand` passes the decision's `PlayerView` to the action hook; `ActionHook` gains an optional `view` parameter, forwarded by `composeChecks`.
- `src/table/advice-service.ts` — modified: optional `observed` snapshot on `recommend` and `grade` requests.
- `src/table/review.ts` — modified: `reviewEntries` grades with each decision's own `observed` snapshot when present (A-5).
- `src/table/session.ts` — modified: `UserDecision.observed?`; `applyUserAction(table, action, observed?)` stores a copy (A-4).
- `tests/playtest/check-advice.acceptance.test.ts` — created: SPEC-01, 02, 05, 07 (10,000-hand cases opt-in via `TLH_SLOW_TESTS=1`).
- `tests/advice/determinism.acceptance.test.ts` — created: SPEC-03, 04, 06.
- `tests/playtest/advice-check.test.ts` — created: unit SPEC-08, 09.
- `tests/table/decision-snapshot.test.ts` — created: unit SPEC-10.
- `tests/playtest/cli.test.ts` — modified: USAGE pins re-pinned one-for-one for `[--check-advice]` and its new line (D-4, Q-1).
- `package.json` — modified: `tests/playtest/check-advice.acceptance.test.ts` added to `test:slow`.
- `docs/advice/determinism.md` — created: determinism guarantee, seed, decision-time snapshot rule, playtest check.

No new dependencies.
