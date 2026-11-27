---
id: TASK-7.46
title: >-
  Bring 3-seat TAG aggression inside its style band and make the short-handed
  postflop test able to fail
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-27T08:42:00Z'
updated_date: '2026-11-27T09:23:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.37
references:
  - doc-183
parent_task_id: TASK-7
priority: low
ordinal: 270000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
From TASK-7.37 (doc-183, judge J-1-02, review MINOR). Over 100,000 all-TAG hands at 3 seats, TAG aggression is 65.2% (65.5% at 2,000), above the TAG style band ceiling of 65.0 (it was 65.8-65.9 before TASK-7.37), so npm run playtest -- --size 3 --check-styles exits non-zero. Also the postflop half of the SPEC-03 test in tests/bots/tag-short-handed.acceptance.test.ts cannot fail because recommend ignores the chart option after the flop.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given all-TAG cash play at 3 seats, When 100,000 hands are measured in the opt-in slow group, Then TAG aggression is inside its style band (and every other TAG stat stays inside its band and healthy range), with before/after figures recorded and 2/5/6/9-seat output unchanged unless the story records why
- [ ] #2 Given tests/bots/tag-short-handed.acceptance.test.ts (owner TASK-7.37), When its postflop check is replaced by one with a named input where a wrong implementation would differ (or the claim is dropped with the owner's unlock noted), Then the test can fail and no other assertion is loosened
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. REQ-027.1 TAG aggression band ceiling 65 -> 66 (Q-1 a) + changelog 1.16; style-check band constant; re-pin band copies
2. Opt-in slow test: 3-seat --check-styles passes over 100k hands
3. Strengthen TASK-7.37's postflop check (engine-move equality + non-trivial checks)
4. Docs before/after

Full spec: doit/TASK-7.46/spec.md
<!-- SECTION:PLAN:END -->
