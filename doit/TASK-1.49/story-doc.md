# TASK-1.49: Stop the sandbox-timeout test failing with EPERM

Status: Done · Completed: 2026-11-20 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-0 · Requirements: n/a (infra follow-up from TASK-1.46 / TASK-1.40) · Branch: doit/TASK-1.49

## What was asked
The locked test `tests/support/sandbox-timeout.acceptance.test.ts` failed intermittently on macOS (AC#1: make it pass; AC#2: stable under load). Spec: doit/TASK-1.49/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | EPERM from `kill(-pgid, SIGKILL)` in test support is ignored silently, with no log. | yes | Only tests use it. The CI log line on stdout was the bug, and the tests assert the grandchild's death directly. | Log to stderr in `killGroupQuietly`. |
| A-2 | Fix the cause in `process-group.ts`, not by parsing only the last stdout line in `sandbox.ts`. | yes | Removes the stdout pollution instead of hiding it. | Change the parse in `sandbox.ts`. |

Decision D-1 (not material): `runProcessGroup` no longer imports `killGroup` from `tools/ci/retry.js` and uses a local quiet kill. No questions were asked (qa.md: none).

## What was built
Root cause: on EPERM, `killGroup` in `tools/ci/retry.js` writes `retry: could not send SIGKILL ... (EPERM)` to stdout. That text went in front of the JSON that `process-group-cli.ts` prints. `JSON.parse` then failed in `sandbox.ts` and `timedOut` fell back to `false`. macOS returns EPERM when the group still has zombie or exiting members, and the kill itself had worked.
- `tests/support/process-group.ts`: new module-private `killGroupQuietly(pid)`. It sends SIGKILL to `-pid`, ignores ESRCH and EPERM, rethrows anything else and writes nothing. Both call sites (timeout and after `close`) use it. The doc comment is updated.
- `tests/support/process-group.test.ts`: new unit test for SPEC-01.
- Unchanged: `tools/ci/retry.js` (CI keeps its log line and sudo path), `sandbox.ts`, the CLI, and the locked test.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | Unit test: every group kill throws EPERM after the real kill. The test checks that the run resolves `timedOut: true`, nothing is printed, and the grandchild dies. | pass | gates/build-1.json |
| SPEC-02 | AC#1 | Locked sandbox-timeout test, unchanged (sha 41ab930e…) | pass | gates/build-1.json, gates/fix-2.json |
| SPEC-03 | AC#2 | 10 runs under 3x-core CPU load, expecting `passed 10/10` | pass | judge/verdict-1.json |

- `npm test`: 101 files passed, 363 tests passed, 6 skipped. Lint, typecheck and format passed in both gate runs.
- Judge round 1: PASS, with no failed items and no unproven AC.

## Review
One review round with no findings. No blocking findings.

### Non-blocking review notes (deliberately not fixed)
None.

## How to try it
`npx vitest run tests/support/sandbox-timeout.acceptance.test.ts tests/support/process-group.test.ts`

## Run metrics
Questions 0 · assumptions 2 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · changed lines 56 (2 files).

## Known limitations and follow-ups
None. EPERM is now ignored silently in test support. A real permission denial would still show up as a grandchild that survives, which the tests assert.

Not tracked (infra, below the value bar): none.

## Lessons for the factory (proposals — not applied)
None. The run was clean.
