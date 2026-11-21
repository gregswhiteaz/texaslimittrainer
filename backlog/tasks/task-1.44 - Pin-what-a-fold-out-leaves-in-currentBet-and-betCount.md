---
id: TASK-1.44
title: Pin what a fold-out leaves in currentBet and betCount
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-20T04:07:00Z'
updated_date: '2026-11-21T01:44:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.22
references:
  - doc-39
parent_task_id: TASK-1
priority: low
type: chore
ordinal: 205000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.4 code review NIT fold-out-resets-bet-counters, still unowned after TASK-1.22 (doc-39): foldOut (src/engine/hand.ts ~320-321) zeroes the street's currentBet and betCount when a hand ends by fold-out. Either keep them or document the reset; either way pin it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a hand that ends because all but one player folded mid-street, When the final state is read, Then currentBet and betCount follow one documented rule (kept or reset) and a test pins it
- [ ] #2 Given that rule, When the code comment on foldOut is read, Then it states the rule and why
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Keep the reset: foldOut leaves currentBet and betCount at 0, same as endRound; document it on foldOut.
2. New tests/engine/fold-out.acceptance.test.ts: preflop and flop fold-outs end at 0/0 (asserting 8/2 just before).
3. hand.ts diff is comment-only; npm test green.

Full spec: doit/TASK-1.44/spec.md
<!-- SECTION:PLAN:END -->
