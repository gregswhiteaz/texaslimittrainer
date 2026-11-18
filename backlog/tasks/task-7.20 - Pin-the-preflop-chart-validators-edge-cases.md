---
id: TASK-7.20
title: Pin the preflop chart validator's edge cases
status: To Do
assignee: []
created_date: '2026-11-18T16:24:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-7.2
references:
  - doc-14
parent_task_id: TASK-7
priority: low
type: chore
ordinal: 176000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.2 reviews: one mutant survived (word count accepts non-letter tokens) and two behaviours are unspecified.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a justification of 60 numeric or punctuation tokens, When the validator runs, Then it is rejected as missing its justification
- [ ] #2 Given chartCell is called with an unknown hand class, When it throws, Then the RangeError and its message are documented in the module and covered by a test
- [ ] #3 Given parseChart reports a bad token or spot name, When the message is built, Then the echoed value is cut to at most 20 characters
<!-- AC:END -->
