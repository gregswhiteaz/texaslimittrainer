# Fix brief — TASK-3.12 (build block 1, resume BUILD)

The locked spec stays; this brief records an approved correction. Judge on substance.

## 1. Correct SPEC-01 / SPEC-05 expected values (stored advice = hint, ACTION_RANGE_ADVICE)
- SPEC-01 (REVIEW_FOUR): recommended [raise, bet, bet, call]; grades [correct, correct, minor, correct]. Compute the expected values independently in the test through the worker's grade path (handleAdviceRequest grade), not by calling decisionRecord.
- SPEC-05: assert the margin-graded entry on entry 2 (turn): ruleId aggression-margin with a numeric marginPts equal to the worker's result.

## 2. Finish the remaining build work
- tests/table/decision-record.test.ts (SPEC-07, SPEC-08), docs/storage/hand-records.md update.
- List the two out-of-list files already changed (tests/support/table-scenarios.ts, tests/storage/hand-store.test.ts) in changes.md with the reason.
- npm run format, lint, typecheck, full npm test (0 failures), 10,000-hand playtest (0 invariant violations), then the gate.
Never drop or loosen an assertion.
