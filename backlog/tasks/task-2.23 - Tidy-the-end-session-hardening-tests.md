---
id: TASK-2.23
title: Tidy the end-session hardening tests
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-25T20:56:00Z'
updated_date: '2026-11-26T12:19:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-2.21
references:
  - doc-147
parent_task_id: TASK-2
priority: low
ordinal: 251000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-2.21 review (doc-147). Each case in tests/storage/end-recheck.acceptance.test.ts calls endSession twice (once per matcher); e2e/end-session-hardening.spec.ts casts started?.sessionId. TASK-2.7's locked new-game-confirm SPEC-08 stays weak; the stronger check lives in the new e2e.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the end-recheck unit cases, When they run, Then each calls endSession once and asserts both DOMException and the ConstraintError name, with no check lost
- [x] #2 Given the hardening e2e, When read, Then the sessionId cast is replaced by an asserted non-null value
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. end-recheck: one endSession promise per case, both matchers awaited on it
2. end-session-hardening e2e: runtime guard replaces the sessionId cast
3. grep checks that every assertion is kept

Full spec: doit/TASK-2.23/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: one endSession call per case with both matchers; runtime guard replaces the sessionId cast; greps confirm no check lost; gate PASS

Judge r1 PASS (4/4 SPEC items; mutation-checked)
<!-- SECTION:NOTES:END -->
