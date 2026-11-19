---
id: TASK-1.26
title: Pin the playtest summary and policy-lifetime tests
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-18T17:24:00Z'
updated_date: '2026-11-19T20:39:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.6
references:
  - doc-15
parent_task_id: TASK-1
priority: medium
type: chore
ordinal: 179000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.6 (doc-15): the judge's J-1-01 (MEDIUM) and code review found that no test checks a real 'Largest pot' value — two mutants survive (last hand's pot instead of the max; summing the pot index instead of the amount). Also untested: each seat's policy is created once per hand. src/playtest is not covered by the headless-boundary lint.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a playtest summary over at least two hands where the larger pot comes first, When summarize runs, Then Largest pot equals the largest per-hand sum of award amounts
- [ ] #2 Given a real multi-hand run, When the report is built, Then the Largest pot line matches an independent recomputation from the played hands
- [ ] #3 Given a hand with several decisions per seat, When the runner plays it, Then each seat's policy is created exactly once for that hand
- [ ] #4 Given src/playtest imports a UI or browser module, When npm run lint runs, Then the headless-boundary rule fails naming the file
- [ ] #5 Given src/table imports a UI or browser module, When npm run lint runs, Then the headless-boundary rule fails naming the file, and the TASK-3.1 import-scan test (SPEC-10) is removed
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. tools/lint/headless-boundary.js: add LINT_ONLY_HEADLESS_DIRS = [playtest, table] to the boundary rule (coverage glob unchanged).
2. tests/playtest/summary.acceptance.test.ts: hand-built awards kill the last-hand / pot-index / single-award mutants; a seeded 20-hand run matches an independent recomputation from totalContribution.
3. runner.test.ts: each seat's policy created exactly once per hand.
4. tests/toolchain/headless-lint-dirs.acceptance.test.ts: probe imports in src/playtest and src/table fail lint naming the file.
5. Remove TASK-3.1 SPEC-10 import-scan test from tests/table/session.test.ts; README names the new folders.

Full spec: doit/TASK-1.26/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-3.1 follow-up (doc-21).

Cross-story test edit (AC#5): removes TASK-3.1 SPEC-10 'session module imports no UI code' in tests/table/session.test.ts (not locked), replaced by the lint rule as TASK-3.1's spec planned (doit/TASK-3.1/spec.md:449).
<!-- SECTION:NOTES:END -->
