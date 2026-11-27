# TASK-1.53 Q&A

## Q-1 How AC#3 (and AC#1's "on main" clause) is proven
**Answer: Branch runs now, main later (Recommended).** Judge checks 2 pushed-branch CI runs; AC#3 stays unticked at Done; after merge the orchestrator records 2 main runs (ids, wall time, sweep ratio) in the task notes and ticks AC#3, opening a fix story if main exceeds ~3.5 min.

## Q-2 Design and locked-test edits
**Answer: Yes, as designed (Recommended).** E2E matrix chromium/webkit × 2 shards; sweeps 3 duration-weighted shards (weights file + sequencer); re-pin names/matrices/commands in tests/ci/ci-jobs.acceptance.test.ts, tests/ci/workflow.test.ts, tests/ci/branch-protection.acceptance.test.ts under their owners.

## Q-3 Check names
**Answer: Use these names (Recommended).** "E2E (chromium, shard 1 of 2)" … "E2E (webkit, shard 2 of 2)"; "Sweep tests (shard 1 of 3)" … "(shard 3 of 3)".
