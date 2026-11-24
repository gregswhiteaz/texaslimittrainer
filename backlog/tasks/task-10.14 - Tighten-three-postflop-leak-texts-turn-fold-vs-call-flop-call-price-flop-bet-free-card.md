---
id: TASK-10.14
title: >-
  Tighten three postflop leak texts (turn fold vs call, flop call price, flop
  bet free card)
status: To Do
assignee: []
created_date: '2026-11-24T23:58:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-10.5
references:
  - doc-128
parent_task_id: TASK-10
priority: low
ordinal: 238000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-10.5 code review (doc-128). In src/stats/leak-categories.json: (1) the turn-fold fix says the pot 'has grown enough' to call while the turn-call justification says the doubled bet 'raises the required equity' — the accurate reason is that a draw has only one card to come; (2) the flop-call fix says your chance must 'beat' the price but the rule calls when it is at least the price; (3) the flop-bet fix promises a free turn after a check, which only holds when you act last.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the three leak texts, When they are revised, Then each is accurate against the advice rules, stays one original sentence with a justification, and the user approves the new wording
<!-- AC:END -->
