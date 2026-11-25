---
id: TASK-6.22
title: Make the headless bot step use the seeded TAG decision
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-21T22:26:00Z'
updated_date: '2026-11-25T23:14:00Z'
labels:
  - follow-up
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-6.2
references:
  - doc-73
parent_task_id: TASK-6
priority: medium
ordinal: 213000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-6.2 (doc-73). src/table/session.ts stepBot still defaults to the pure tagPolicy, so headless bot play never mixes while the app worker and playtest do. Aligning it changes the locked TASK-3.1 session acceptance test (tests/table/session.acceptance.test.ts:177), which needs its owner's approval (exact-equality edit only).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a bot turn stepped headlessly with stepBot's default policy, When it is a mixed spot, Then the action equals the seeded decision decideTag(view, {random: botRandom(botDecisionSeed(code, view))}) — the same as the app worker
- [ ] #2 Given the locked TASK-3.1 session test, When it is updated with its owner's approval, Then it compares to the exact seeded decision with no widened assertion
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. stepBot(table, policy?) defaults to the seeded decideTag decision using the seed botTurn already computes
2. Re-pin the locked TASK-3.1 session test's expected action to the seeded decision (Q-1)
3. New acceptance test comparing headless steps with the real advice worker on the two hands that differ

Full spec: doit/TASK-6.22/spec.md
<!-- SECTION:PLAN:END -->
