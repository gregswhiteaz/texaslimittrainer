---
id: TASK-6.27
title: Close the remaining bot import gaps (type-position imports, advice path)
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-25T23:03:00Z'
updated_date: '2026-11-26T21:24:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-6.21
references:
  - doc-149
parent_task_id: TASK-6
priority: low
ordinal: 252000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-6.21 judge (doc-149). A type-position import('../engine/hand').HandState in src/bots passes lint and tsc (types only; cannot reach hidden cards at runtime). Bots may also import src/advice, which imports engine runtime — an indirect path outside TASK-6.21's scope.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a src/bots file using a type-position import('../engine/…') outside the allow-list, When lint runs, Then it fails with the REQ-025.1 boundary message (TSImportType selector), and allowed PlayerView types still pass
- [ ] #2 Given the indirect src/bots → src/advice → engine path, When the user decides whether bots may import src/advice, Then the decision is recorded and, if barred, a lint test enforces it
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Bot lint rule also catches type-position import('../engine/...') outside the allow-list (TSImportType); PlayerView types still pass
2. New adviceHiddenStateConfig: advice code (except golden.ts) can't import engine hand state; bots can't import advice/golden
3. Tests in a new tooling acceptance file (sandbox lint)
4. Record Backlog decision (Q-1 = a)

Full spec: doit/TASK-6.27/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
doit autopilot skipped (2026-11-26): AC#2 needs a user decision (may bots import src/advice?). AC#1 is buildable on its own once that is decided or the AC is split out.
<!-- SECTION:NOTES:END -->
