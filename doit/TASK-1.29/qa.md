# Q&A — TASK-1.29

## Q-1 — Edit to TASK-1.19's locked workflow test (decided by the orchestrator, not asked)
The fix inserts `node tools/ci/apt-lock.js --wait-seconds 150 -- ` before each install command, so the exact-run-line assertion in tests/ci/workflow.test.ts:102-104 must gain that prefix. AC#3 requires the workflow test to assert the lock handling. This is a one-line additive change with no assertion removed. Precedent: TASK-2.1 Q-3, TASK-3.2 Q-1, TASK-3.3 D-5 and TASK-3.4 D-2. Approved on that basis.

## Diagnosis correction (recorded 2026-11-19)
The spec writer's log reading shows the lock holder was attempt 1's own `apt-get`, not unattended-upgrades. Attempt 1 timed out on a stalled mirror, and retry.js's group kill got EPERM against the root process under sudo, so it never died. The design therefore waits for the lock inside each attempt (D-1). A wait before the step would miss this case.

The deeper fix is to make retry.js actually stop a timed-out sudo'd apt-get. That is a follow-up, merged into TASK-1.23 (Harden CI child-process cleanup), which already owns the EPERM case.
