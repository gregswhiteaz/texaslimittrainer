---
id: TASK-1.27
title: Tighten the playtest invariant checker and its messages
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-18T18:15:00Z'
updated_date: '2026-11-19T21:41:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.8
references:
  - doc-16
parent_task_id: TASK-1
priority: medium
type: chore
ordinal: 180000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.8 (doc-16) reviews and judge. Two violation messages can mislead (K2 reuses the board/burn wording for a hole-card error; the C3 awards message can read '$20 but players put in $20'). The deck order of dealt cards is not checked, checkState ignores an empty history or non-betting-street records (J-1-02), a runner that never stops a violating hand hangs the suite instead of failing it, and the CLI repeats describeAction's wording. Message wording was user-approved in TASK-1.8 D-2, so new wording needs the user's OK.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a player with other than two hole cards, When checkState runs, Then the cards violation names the seat and its hole-card count, with wording the user has approved
- [ ] #2 Given award shares that don't add up to an award's amount while totals balance, When checkState runs, Then the chips message names the mismatched award and cannot state equal amounts as a contradiction, with wording the user has approved
- [ ] #3 Given a dealt card that is not from its deck position (hole cards, burns, board per hand.ts D-5 layout), When checkState runs, Then a cards violation is reported
- [ ] #4 Given a state with an empty action history after the deal or a history record on a non-betting street, When checkState runs, Then it reports a legal-action violation
- [ ] #5 Given a runner that does not stop a hand at its first violation, When the playtest tests run, Then they fail within the test timeout instead of hanging
- [ ] #6 Given the CLI violation block, When an action is printed, Then its text comes from describeAction, and the unreachable null guard is removed with the P1 test row asserting a message rather than relying on a throw
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. invariants.ts: K2 split — hole-card count message (Q-1); C3 per-award message (Q-2); new deal-order check vs D-5 deck layout (A-3).
2. checkState: empty history after the deal and non-betting-street records -> legal-action (A-1/A-2).
3. Test fault engines cap actions per hand so a runner that never stops fails instead of hanging (A-4).
4. CLI: actions printed via describeAction; ViolatingHand type removes the null guard; P1 row asserts a message.
5. Update pinned message tests.

Full spec: doit/TASK-1.27/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Q-1..Q-3 (user): recommended wording for hole-card and award-split messages; new history and deal-order messages approved as drafted.
<!-- SECTION:NOTES:END -->
