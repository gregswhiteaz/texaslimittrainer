---
id: TASK-10.18
title: Keep the engine's bet-voiding rule in one place (liveLevels and voidedBets)
status: To Do
assignee: []
created_date: '2026-11-27T09:11:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-10.17
references:
  - doc-184
parent_task_id: TASK-10
priority: low
ordinal: 271000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
From TASK-10.17 (doc-184, review r1 MINOR). voidedBets (src/engine/hand.ts) copies liveLevels' forced-fold voiding walk; nothing keeps the two in step, so a later rule change could make bots/advice disagree with the engine's amount to match.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given src/engine/hand.ts, When liveLevels and voidedBets are refactored to share one voiding walk (or a property test over random forced-fold hands asserts they agree), Then a change to the rule in one place cannot silently diverge, all engine/advice tests pass, and the 10,000-hand seeded playtest stays byte-identical
<!-- AC:END -->
