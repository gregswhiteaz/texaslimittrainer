# Changes — TASK-1.8

- `src/engine/invariants.ts` — new: `checkState`, `checkStep`, `describeAction`, `INVARIANTS`, `MAX_BETS_PER_STREET`, `Violation`/`ActionStep` types (chips, legal-action, bet-cap, pot-eligibility, cards).
- `src/playtest/runner.ts` — `PlaytestSeams` (`makePolicy`, `onAction` default `checkStep`, `engine`), per-hand `violation` (hand stops at first violating action), `violationCounts` and `firstViolation` in the summary; A-4 interim checks removed; `MAX_BETS_PER_STREET` re-exported.
- `src/playtest/cli.ts` — violation block appended after `Invariant violations: N` only when N > 0 (run and replay variants); `main(argv, io, seams)`.
- `.github/workflows/ci.yml` — `Playtest` step (`npm run playtest -- --hands 10000 --seed 42`) after `Test`.
- `tests/engine/invariants.test.ts` — new: SPEC-02 sub-check corruption cases plus ordering/robustness and `describeAction` wording.
- `tests/engine/invariants.perf.test.ts` — new: SPEC-09 checker overhead per action.
- `tests/playtest/invariants.acceptance.test.ts` — new: SPEC-01, SPEC-03, SPEC-04, SPEC-05 acceptance tests.
- `tests/support/faulty-engine.ts` — new test-only helper: five fault engines and their policies.
- `tests/ci/workflow.test.ts` — D-5: playtest command added to the ordered list; new SPEC-08 test.
- `tests/playtest/runner.test.ts` — D-6: interim-violation test replaced by SPEC-06; `playHand` call uses seams.
- `tests/playtest/cli.test.ts` — seams signature, new summary/hand fields, SPEC-07 violation-block test.

No new dependencies.
