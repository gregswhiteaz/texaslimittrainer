---
id: TASK-7.25
title: Switch bots to action-based opponent ranges
status: To Do
assignee: []
created_date: '2026-11-22T21:02:00Z'
labels:
  - follow-up
  - feature
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-7.5
references:
  - doc-86
parent_task_id: TASK-7
priority: medium
ordinal: 219000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.5 (doc-86, Q-1 (A)). TASK-7.5 gave only the user's hints and review the action-range model; bots still compute postflop equity against every unseen combo. REQ-029.2 intends bots to request advice with the typical-player basis. Switching changes bot decisions and needs the user's approval to re-baseline locked tests measured in TASK-7.5: TASK-7.3 tests/advice/postflop.acceptance.test.ts AC#1 (1,081 combos), TASK-6.3 tests/bots/calling-station.acceptance.test.ts Example B, likely TASK-9.1 review grades, plus a new playtest SHA (today 442dbf55…08fbc).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given any bot deciding after the flop, When it asks the advice engine, Then equity is computed against action-based opponent ranges (ACTION_RANGE_ADVICE), with no bot style or parameter reaching the engine
- [ ] #2 Given the locked tests that pin every-unseen-combo results (TASK-7.3 postflop AC#1, TASK-6.3 Example B, TASK-9.1 review grades if affected), When the user approves re-baselining, Then each is updated with the approval recorded and test-integrity clean for its owner
- [ ] #3 Given a 10,000-hand default playtest after the switch, When it runs, Then it reports zero invariant violations, the new output SHA is recorded, and per-style VPIP/PFR stay inside their documented bands
<!-- AC:END -->
