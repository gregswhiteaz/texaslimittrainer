---
id: TASK-1.21
title: Harden engine input validation found in review
status: To Do
assignee: []
created_date: '2026-11-18T07:03:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.4
references:
  - doc-7
  - doc-9
  - doc-10
parent_task_id: TASK-1
priority: medium
type: chore
ordinal: 166000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from the TASK-1.2, TASK-1.3 and TASK-1.4 security reviews (non-blocking MINORs). Engine entry points accept a few malformed inputs that a later caller (playtest CLI, session layer, saved data) could pass in.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given parseCard is called with a non-string or a string longer than 3 characters, When it rejects the input, Then it throws a typed error whose message echoes at most 10 characters of the input
- [ ] #2 Given createHand with any stake or stack that is not a safe integer, When the hand is created, Then it is rejected with the existing invalid-config error
- [ ] #3 Given createHand has returned, When the caller mutates the stakes or seats objects it passed in, Then the hand state is unchanged
- [ ] #4 Given nextIntUnbiased(n), When n is outside the range for which it is exactly unbiased, Then it either throws RangeError or is exactly unbiased for that n, and its doc comment states the supported range
<!-- AC:END -->
