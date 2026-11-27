---
id: TASK-7.44
title: >-
  Scale observed three-bet and four-bet ranges by PFR relative to a typical
  player
status: To Do
assignee: []
created_date: '2026-11-27T03:28:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.43
references:
  - doit/TASK-7.29/spec.md
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-104
parent_task_id: TASK-7
priority: medium
type: enhancement
ordinal: 267000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.29 (decision: Q-3 C). Today every three-bet and four-bet line scales toward raw PFR, so a 22/18 player's 6-max UTG four-bet range goes 2.56% to 18% at 100 hands and even a 12/9 player's goes to 9%. Apply REQ-035.6 as reworded by TASK-7.29: for three-bet and four-bet lines o = min(100, d x observed PFR / typical PFR), typical PFR = midpoint of the healthy PFR band in src/stats/healthy-ranges.json (heads-up 57.5, 6-max 18, full ring 12.5); open-raise keeps raw PFR and calling lines raw VPIP; blend formula and 30-hand threshold unchanged. No new stat, no persisted-format change; no locked test should need a re-pin (observed-ranges AC#2 covers only open-raise and call-raise). Expected values: doit/TASK-7.29/spec.md §5. Re-verify the 4 observed golden postflop spots.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a 6-max UTG four-bettor seen for 100 hands with PFR 18, When the range is estimated, Then its scaled width is 2.56% (the default), within 0.01
- [ ] #2 Given the same seat with PFR 45 or PFR 9 at 100 hands, When the range is estimated, Then the width is 6.41% or 1.28% respectively, within 0.01
- [ ] #3 Given heads-up and full-ring tables, When a three-bet or four-bet range is scaled, Then the typical PFR is 57.5 and 12.5 respectively, and o is capped at 100
- [ ] #4 Given open-raise and calling lines, When ranges are scaled, Then they are unchanged from FU-A (raw PFR and raw VPIP)
- [ ] #5 Given the 4 observed golden postflop spots, When npm test runs, Then each still agrees and is clear-cut, or each changed one is re-justified with the user's sign-off
- [ ] #6 Given docs/advice/range-model.md, When the story is done, Then its line-to-stat table and Known limits state the relative re-raise rule
<!-- AC:END -->
