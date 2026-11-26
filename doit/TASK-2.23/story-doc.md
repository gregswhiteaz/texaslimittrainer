# TASK-2.23: Tidy the end-session hardening tests

## Assumptions
None. Assumptions: 0, questions: 0, escalations: 0. One autopilot-accepted unlock of the TASK-2.21 locked tests (reason "TASK-2.23 AC#1-2"); all existing assertions were kept.

## What and why
A test-only tidy of two files from TASK-2.21. No product code changed and no new dependencies were added.

- `tests/storage/end-recheck.acceptance.test.ts`: the case "an already-ended session is not ended again" now calls `endSession` once. It asserts that call's promise with both `toBeInstanceOf(DOMException)` and `toMatchObject({ name: 'ConstraintError' })` (SPEC-01, SPEC-02).
- `e2e/end-session-hardening.spec.ts`: the `started?.sessionId as string` cast is now a `typeof id !== 'string'` guard that throws `no new session id` (SPEC-03).

## Verification
- Judge round 1 passed 4/4 (SPEC-01 to SPEC-04), with mutation checks.
- Review round 1 had no findings. There were 0 send-backs and 1 gate run.

## Non-blocking review notes
None.

## Decisions not asked
TASK-2.7's weak locked SPEC-08 in `e2e/new-game-confirm.spec.ts` was left alone on purpose. The end-session-hardening e2e already holds the stronger check.

## Lessons for the factory
Nothing went wrong or slow in this run.

## Follow-ups
None.
