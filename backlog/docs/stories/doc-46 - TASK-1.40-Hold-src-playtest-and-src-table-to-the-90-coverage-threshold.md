---
id: doc-46
title: 'TASK-1.40: Hold src/playtest and src/table to the 90% coverage threshold'
type: other
created_date: '2026-11-21T00:52:00Z'
updated_date: '2026-11-21T00:52:00Z'
---
# TASK-1.40: Hold src/playtest and src/table to the 90% coverage threshold

Status: Done · Completed: 2026-11-20 · Epic: TASK-1 · Milestone: m-0 · Requirements: REQ-059.2 (via the headless set) · Branch: doit/TASK-1.40

## What was asked
`src/playtest` and `src/table` were under the headless lint rule (TASK-1.26) but outside the 90% line-coverage threshold. This chore puts them under both. The two locked toolchain tests that depended on the old split get a recorded unlock and a stricter edit. Spec: doit/TASK-1.40/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | `HEADLESS_DIRS` is `['engine','bots','advice','stats','playtest','table']` and the glob is the literal `'src/{engine,bots,advice,stats,playtest,table}/**'` | yes | Appends to the existing order. Vitest prints the literal key, so a literal is easiest to assert | Build the glob from `HEADLESS_DIRS` in `vite.config.ts` |
| A-2 | `LINT_ONLY_HEADLESS_DIRS` is deleted, not kept as an empty array | yes | AC#2 says "folded into". The only importer was the TASK-1.26 test, which was edited | Re-export an empty array |

## Clarifications and decisions
- Questions asked: none (qa.md).
- D-1: edit the locked `tests/toolchain/coverage.test.ts` (owner TASK-1.1) and `tests/toolchain/headless-lint-dirs.acceptance.test.ts` (owner TASK-1.26) under recorded unlocks. The edits only make the tests stricter (two more folders, a longer expected message). Auto-accepted in the autopilot run (qa.md).
- D-2: fold the lists, so `HEADLESS_FILES` derives from `HEADLESS_DIRS` only.

## What was built
- `vite.config.ts`: the 90% lines threshold glob now covers all six folders.
- `tools/lint/headless-boundary.js`: `HEADLESS_DIRS` has six entries. `LINT_ONLY_HEADLESS_DIRS` is removed. `HEADLESS_FILES` is derived from `HEADLESS_DIRS`. Comments updated.
- `tests/toolchain/coverage.test.ts` (unlocked): expects the widened threshold message and asserts `HEADLESS_DIRS` includes playtest and table.
- `tests/toolchain/headless-lint-dirs.acceptance.test.ts` (unlocked): drops the removed import. The list test asserts the exact six-folder list and `HEADLESS_FILES`.
- `README.md`: the conventions bullet lists all six folders as headless. The separate lint-only sentence is removed.
- No production code and no new dependencies. 40 changed lines in 5 files, which is exactly the scope budget.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1, AC#2 | `coverage.test.ts`: sandbox `npm test` with a half-covered probe in each of six folders prints the widened 90% message and not `global threshold` | PASS | judge round 1, gate build-1 |
| SPEC-02 | AC#2 | `headless-lint-dirs.acceptance.test.ts` list test | PASS | judge round 1 |
| SPEC-03 | AC#1 | `npm test` on the real repo | PASS: 101 files, 362 passed, 6 skipped, no coverage error. playtest 100% and table 100% lines | gate build-1 |
| SPEC-04 | AC#2 | `boundary.test.ts`, unchanged, loops over the six folders | PASS | judge round 1 |

- Gate build-1: PASS (test, lint, typecheck, spec unchanged, scope budget 40 vs 40).
- Judge: 1 round, PASS. Both ACs proven, no blocking findings, no escalation.

## Review
No findings in review round 1.

### Non-blocking review notes (deliberately not fixed)
- J-1-01 (LOW, judge): the 90% glob threshold is measured across all six folders combined, not per file. A small under-covered file in playtest or table fails only if it pulls the combined figure below 90%.

## How to try it
- `npm test` (coverage thresholds are enforced)
- `npx vitest run tests/toolchain/coverage.test.ts tests/toolchain/headless-lint-dirs.acceptance.test.ts tests/toolchain/boundary.test.ts`
- `grep -rn LINT_ONLY_HEADLESS_DIRS tools tests src vite.config.ts` prints nothing.

## Run metrics
Questions 0 · assumptions 2 · review rounds 1 (no findings) · judge rounds 1 · gate runs 1 · escalations 0 · changed lines 40 (5 files).

## Known limitations and follow-ups
- Per-file 90% enforcement is not in place (J-1-01). It is a trainer-quality idea. Vitest's `perFile` option would apply to all files, not just the glob, so it is not cheap. Recommendation: not tracked.
- [infra] TASK-1.39's sandbox-timeout acceptance test failed with EPERM in the judge's scratch copies. This is the second occurrence, after TASK-1.46's gate. It is a real failure of a check, not a hypothetical one. Owner: TASK-1.39. The orchestrator is tracking it separately.

### Not tracked (infra, below the value bar)
- None.

## Lessons for the factory (proposals — not applied)
- The TASK-1.39 sandbox-timeout test fails with EPERM when run from the judge's scratch copies, in two runs now. Proposal: make the test, or the judge's scratch-copy setup, tolerate or avoid the permission problem, so a PASS verdict does not depend on knowing it is a known flake.
