---
id: TASK-1.25
title: Run the all-dependency audit at high once picomatch is patched
status: To Do
assignee: []
created_date: '2026-11-18T07:03:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-1.7
references:
  - doc-5
parent_task_id: TASK-1
priority: low
type: chore
ordinal: 170000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.1 (Q-3): the dev/build-only picomatch advisory GHSA-fc5q-39xc-vjpf is tolerated, so the all-deps audit runs at --audit-level=critical. Revisit when a patched picomatch ships.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a patched picomatch is available through our dev dependencies, When CI runs the all-dependency audit, Then it uses --audit-level=high and passes
<!-- AC:END -->
