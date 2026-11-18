---
id: TASK-13
title: Rely on a private offline app
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:21:00Z'
labels:
  - epic
  - dream-limit-holdem-trainer
dependencies:
  - TASK-13.1
  - TASK-13.2
  - TASK-13.3
  - TASK-13.4
  - TASK-13.5
  - TASK-13.9
  - TASK-13.10
  - TASK-13.6
  - TASK-13.7
  - TASK-13.8
  - TASK-13.11
  - TASK-13.12
documentation:
  - doc-1
  - doc-2
type: feature
ordinal: 130
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The user installs TLH Trainer to the Dock, uses it offline with no data leaving the machine, gets updates safely and never silently loses history.

Done when: every child story is Done (this epic depends on all of its stories).

Plan key: E13 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Installs from Chrome and Safari and works fully offline after first visit [REQ-060.2, REQ-065.1]
- [ ] #2 No requests other than the app's own files; CSP restricts to own origin [REQ-058.1, REQ-058.3]
- [ ] #3 Storage failures, migrations and unexpected errors never lose completed hands [REQ-053.2, REQ-054.3, REQ-056.3]
<!-- AC:END -->
