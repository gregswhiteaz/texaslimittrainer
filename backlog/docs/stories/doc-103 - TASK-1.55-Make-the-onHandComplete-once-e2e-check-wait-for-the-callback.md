---
id: doc-103
title: 'TASK-1.55: Make the onHandComplete-once e2e check wait for the callback'
type: other
created_date: '2026-11-23T15:42:00Z'
updated_date: '2026-11-23T15:42:00Z'
---
# TASK-1.55: Make the onHandComplete-once e2e check wait for the callback

Status: Done (judge pending at doc time) · Completed: 2026-11-23 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-1 · Requirements: n/a · Branch: doit/TASK-1.55

## What was asked
Main CI #249 (run 45204245680) failed in WebKit: the test 'onHandComplete fires exactly once per hand even with the same replay code' in `e2e/hand-records.spec.ts` read the records-harness call log once, right after the result appeared, and saw 0 calls. `onHandComplete` fires only after the real IndexedDB write resolves, so an immediate read races it. Fix: wait for the callback, keep the assertions exact. Spec: doit/TASK-1.55/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Use Playwright's default `expect.poll` timeout (5 s) as the bound | yes | Same bound as the existing `storedCount` poll in the file | add `{ timeout: 10_000 }` |
| A-2 | The "still exactly 1 after the 1450 ms advance" check stays an immediate exact read (after a poll reached 1) | yes | Strongest no-second-call check once count is 1 | poll it too |

No questions were asked (red-main fix, unattended).

## What was built
Test-only change, 11 lines, 1 file: `e2e/hand-records.spec.ts`. The four immediate `calls` reads in the onHandComplete-once test became `expect.poll(async () => (await harnessLog(page)).calls)` with the same matchers (`toHaveLength` 1, 1, 2; `toEqual` of three `PINNED_CODE`). Because `calls` only grows, an exact-count poll still fails on overshoot, so no assertion is loosened. The assertion count is unchanged. No `src/`, harness or config changes. The locked TASK-3.9 test was made timing-robust this way (unlock/relock recorded in doit/TASK-3.9/state.json).

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | the acceptance test plus a diff review that every exact-count assertion remains | pass | review round 1 (code), gates/build-1.json |
| SPEC-02 | AC#2 | `npx playwright test e2e/hand-records.spec.ts --repeat-each 20 --project=chromium --project=webkit` | 360 passed, 0 failed (target test 20/20 in each browser) | build-log.md |

Gates build-1 and fix-2: PASS (npm test, lint, typecheck, spec unchanged, scope 11/15 lines, 1/1 files). Judge: see doit/TASK-1.55/judge/.

## Review
Round 1: code and security reviewers returned 0 findings.

### Non-blocking review notes
None.

## How to try it
`npx playwright test e2e/hand-records.spec.ts --repeat-each 20 --project=chromium --project=webkit`

## Run metrics
Questions 0 · assumptions 2 · review rounds 1 · judge rounds 0 at doc time · gate runs 2 · escalations 0 · changed lines 11.

## Known limitations and follow-ups
- None. Other harness-log reads in the file were checked and are not racy (spec §3).

## Lessons for the factory
- None; the run went smoothly.
