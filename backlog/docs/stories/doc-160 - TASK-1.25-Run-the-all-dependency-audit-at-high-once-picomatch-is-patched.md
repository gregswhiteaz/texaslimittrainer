---
id: doc-160
title: 'TASK-1.25: Run the all-dependency audit at high once picomatch is patched'
type: other
created_date: '2026-11-26T11:46:00Z'
updated_date: '2026-11-26T11:46:00Z'
---
# TASK-1.25: Run the all-dependency audit at high once picomatch is patched

Status: Done · Completed: 2026-11-26 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-1 · Requirements: n/a · Branch: doit/TASK-1.25

## What was asked
CI's "Audit all dependencies" step ran `npm audit --audit-level=critical`, a level chosen in TASK-1.1 (Q-3) only to tolerate the dev-only picomatch advisory GHSA-fc5q-39xc-vjpf. AC#1: when a patched picomatch is available, CI runs the all-dependency audit at `--audit-level=high` and passes. Spec: doit/TASK-1.25/spec.md.

**Important: the advisory was withdrawn on 2026-11-18, not patched.** picomatch 4.0.7 is still a dev dependency (vite → tinyglobby). The GitHub advisory API shows it as withdrawn, with `first_patched_version: null`. `npm audit` stopped reporting it for that reason. Q-1 (auto-accepted) approved tightening the gate anyway.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Keep both audit steps. Only the all-deps level changes. | yes | The shipped step costs about 1 s, runs first, and its name shows a failure is in shipped code. Keeping it makes this a one-line change. | Merge into one `Audit dependencies` step at `high`; edit the step-order arrays and the named-step test. |
| A-2 | Keep the step name "Audit all dependencies". | yes | The name is still accurate, and the step-name assertions stay valid. | Rename the step and update the tests. |
| A-3 | Update README text in place: both audits now read "no high or critical advisory". | yes | The README must match CI. | Reword the README. |

## Clarifications and decisions
- Q-1 (auto-accepted, recommended option a): tighten now, even though the advisory was withdrawn and not patched. The alternatives were to wait for a patch that will never come, or to close the task and keep `critical`. The same answer approved the cross-story edits to locked tests. Only the expected all-deps audit string changed, and the locks were released under TASK-1.7, 1.8, 1.19, 1.29 and 1.50.
- D-1: all-deps level becomes `high`; the shipped step stays.
- D-2: proceed although picomatch is unpatched. The tolerance has no reason left.

## What was built
One config line plus the text that pins it (26 changed lines, 4 files, no dependency changes):
- `.github/workflows/ci.yml` — "Audit all dependencies" now runs `npm audit --audit-level=high`.
- `tests/ci/workflow.test.ts` — expected string changed in the step-order test and the named-step test.
- `tests/ci/ci-jobs.acceptance.test.ts` — expected string changed in the `checks` job run-command list.
- `README.md` — CI job table row and the "Local equivalent" command. Prettier re-padded the table.

Effect: a high or critical advisory in any dependency, dev or shipped, now fails CI.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | acceptance `ci-jobs.acceptance.test.ts` (exact run-command list) | PASS | build-log, gate build-1 |
| SPEC-02 | AC#1 | unit `workflow.test.ts` named-step test | PASS | gate build-1 |
| SPEC-03 | AC#1 | `npm audit --omit=dev --audit-level=high && npm audit --audit-level=high` | PASS, both `found 0 vulnerabilities` | build-log |
| SPEC-04 | AC#1 | GitHub run for the branch head | PASS, CI run 45812549642 green | judge round 1 |
| SPEC-05 | AC#1 | grep for `--audit-level=critical` plus `npm run lint` | PASS | build-log |

- `npm test`: 325 files passed, 7 skipped; 1454 tests passed, 52 skipped. `npm run test:tooling`: 120 passed, 6 skipped. Lint and typecheck pass.
- Judge round 1: PASS (5/5), no failed items.

## Review
No blocking findings. The security review found nothing: the change only makes a gate stricter, with no permission, pin or dependency changes.

### Non-blocking review notes (deliberately not fixed)
- NIT: the acceptance test has no direct assertion for "no `--audit-level=critical` line". The exact run-command list and the SPEC-05 grep cover it.
- NIT: `doit/TASK-1.7/state.json` has duplicate `relock_pending` entries. This is doit-tool bookkeeping and has caused no failure (see "Not tracked").

## How to try it
`npm audit --omit=dev --audit-level=high && npm audit --audit-level=high`, then `npm run test:tooling`.

## Run metrics
Questions 1 (auto-accepted) · assumptions logged 3 · review rounds 1 · judge rounds 1 · gate runs 1 · escalations 0 · changed lines 26.

## Known limitations and follow-ups
- If the withdrawn advisory is reinstated, "Audit all dependencies" fails. That is the intended behaviour. It would need a new task at that point.
- Not tracked (infra, below the value bar): duplicate `relock_pending` entries in `doit/TASK-1.7/state.json`. It is tool bookkeeping and has caused no real failure.

## Lessons for the factory (proposals — not applied)
- Follow-up tasks that wait on an external event ("once X is patched") should record the trigger's source, such as the advisory ID. The task could then be re-checked when the advisory status changes. Here the trigger was a withdrawal, not a patch, which the task wording did not anticipate.
