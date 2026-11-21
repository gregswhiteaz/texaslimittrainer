---
id: TASK-1.41
title: Clarify naming and comments in the invariant checker
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-19T21:53:00Z'
updated_date: '2026-11-21T01:30:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.27
references:
  - doc-33
parent_task_id: TASK-1
priority: low
type: chore
ordinal: 201000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.27 (code MINOR) and TASK-1.8 (L4 raise-clause comment, excluded from TASK-1.27). Readability only; no behaviour change.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given checkStep in src/engine/invariants.ts, When it is read, Then the arrays formerly named rest and others are named stateChecks and afterChips
- [ ] #2 Given the L4 legal-action check, When it is read, Then a comment explains why its raise clause is written as it is (with a reference to the rule it enforces)
- [ ] #3 Given the change, When npm test and npm run playtest -- --hands 10000 --seed 42 run, Then all tests pass and the output is byte-identical to before
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Rename rest -> stateChecks, others -> afterChips in checkStep.
2. Comment the L4 raise clause: REQ-016.1, independent of legalActions, revisit in TASK-1.14.
3. npm test green; 10,000-hand playtest output byte-identical.

Full spec: doit/TASK-1.41/spec.md
<!-- SECTION:PLAN:END -->
