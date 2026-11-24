---
id: doc-106
title: 'TASK-1.56: Keep postflop-ranges unit tests inside the coverage-run time limit'
type: other
created_date: '2026-11-24T02:14:00Z'
updated_date: '2026-11-24T02:14:00Z'
---
# TASK-1.56: Keep postflop-ranges unit tests inside the coverage-run time limit

Status: Done · Completed: 2026-11-23 · Epic: TASK-1 · Milestone: m-1 · Requirements: n/a · Branch: doit/TASK-1.56

## What was asked
Two tests in `tests/advice/postflop-ranges.test.ts` run real equity calculations (30,000-trial runs). Coverage instrumentation slows them about 5x. On CI the property test took 36.0 s and timed out at 30 s (the other took 18.4 s) in the "Unit tests with coverage" job (run 45306421540). The acceptance criteria require 3x headroom under coverage. Spec: doit/TASK-1.56/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Move the heavy checks to the uncovered sweep job. Do not raise timeouts or cut equity work. | yes | The property block is 8.1 s of the 8.2 s test locally under coverage. A timeout alone would need 110 s or more. Reduced-trial equity would weaken the determinism check. Excluding the whole file still meets every coverage threshold (lines 92.65 %). | Add per-test timeouts of 120 s / 60 s |
| A-2 | The 3x headroom AC applies to the tests that stay in the coverage file. The moved tests are held to the same bar in the sweep log. | yes | Moving is an allowed fix in the story. | Hold only the coverage file to the bar |
| A-3 | New names: `actions mode falls back on scripted lines and heads-up` (stays) and `actions mode is total and deterministic` (moved). The describe name is unchanged. | yes | Splitting one `it` into two needs two names. | Rename back |
| A-4 | `STAKES_4_8` and `ALL_CARDS` are copied into the new file. No shared helper. | yes | Two constants don't justify a module. | Add a fixtures helper |

## Clarifications and decisions
No questions asked. A-1 to A-4 were accepted as written.

## What was built
- `tests/advice/postflop-ranges.property.test.ts` (new): holds the fast-check property block and `default advice stays on every unseen combo`, with code unchanged. It runs in the sweep job, which has no coverage.
- `tests/advice/postflop-ranges.test.ts`: keeps the scripted-fallback loop and heads-up block as their own test, plus the other cheap tests. Unused imports were removed.
- No change to `src/**`, `vite.config.ts`, `package.json` or CI config.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..04 | Heavy tests moved verbatim. Coverage file is cheap. Thresholds hold. | `npm run test:unit` plus the property file run | PASS | 62 files, 299 passed, 1 skipped. Coverage lines 92.65 %. |
| Headroom | 3x under coverage | Coverage run of the file | PASS | Remaining tests 98 ms and 91 ms, against a 30 s limit |
| Moved tests | Same bar in the sweep | Plain run of the property file | PASS | 1684 ms and 1596 ms (2 of 2 passed) |

- Lint, typecheck and prettier are clean. The test-integrity check exited 0.
- Judge round 1 passed. Gate runs: 2.

## Review
Both reviews had zero findings.

### Non-blocking review notes (deliberately not fixed)
None.

## How to try it
`npx vitest run --coverage --coverage.thresholds=false tests/advice/postflop-ranges.test.ts && npx vitest run tests/advice/postflop-ranges.property.test.ts`

## Run metrics
Questions 0 · assumptions 4 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · changed files 2 (test files only).

## Known limitations and follow-ups
- Not confirmed on CI yet: the sweep job log should show the moved tests inside the time limit. This is a check on the next CI run, not a new task.
- Other slow test files (e.g. `tests/advice/postflop.test.ts`) were left alone on purpose.

## Lessons for the factory (proposals — not applied)
None. The run was clean.
