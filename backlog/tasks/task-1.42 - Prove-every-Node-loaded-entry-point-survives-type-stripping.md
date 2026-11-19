---
id: TASK-1.42
title: Prove every Node-loaded entry point survives type stripping
status: To Do
assignee: []
created_date: '2026-11-19T22:31:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.28
references:
  - doc-34
parent_task_id: TASK-1
priority: low
type: chore
ordinal: 202000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.28: tools/chart-print/main.ts also runs through the type-stripping loader but has no load test, and a dynamic import() outside the headless folders would slip past the single-run load proof.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given tools/chart-print/main.ts, When a test runs it through tools/playtest/resolve-ts.js, Then it exits 0 with no ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX or import-attribute error
- [ ] #2 Given a dynamic import() in any module reachable from a Node-loaded entry (playtest or chart-print), When npm run lint runs, Then it fails naming the file, or a test proves every dynamically imported module also loads under the loader
<!-- AC:END -->
