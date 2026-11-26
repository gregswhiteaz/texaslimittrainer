# TASK-1.25 — Questions and answers (autopilot, 2026-11-26)

## Q-1 — Tighten the all-deps audit to high now? (picomatch advisory GHSA-fc5q-39xc-vjpf was withdrawn 2026-11-18, not patched; picomatch@4.0.7 is still a dev dependency via vite → tinyglobby)
Recommended (a): proceed now; the final summary says the advisory was withdrawn, not patched. Alternatives: (b) wait for a patch that will never come; (c) close and keep critical.
**Answer: auto-accepted (recommended)**

## Cross-story locked edits
- tests/ci/workflow.test.ts (owners TASK-1.7, TASK-1.8, TASK-1.19, TASK-1.29) and tests/ci/ci-jobs.acceptance.test.ts (owner TASK-1.50): the expected all-deps audit command changes from --audit-level=critical to --audit-level=high (stricter; no check removed). Unlocked under each owner with reason "TASK-1.25 Q-1 …".
**Answer: auto-accepted (recommended)**
