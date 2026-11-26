---
id: TASK-6.24
title: Decide TAG aggression headroom against its 65% band ceiling
status: Done
assignee:
  - '@claude'
created_date: '2026-11-23T15:21:00Z'
updated_date: '2026-11-26T21:07:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
  - spike
milestone: m-1
dependencies:
  - TASK-6.11
documentation:
  - doc-174
parent_task_id: TASK-6
priority: medium
ordinal: 226000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
From TASK-6.11 (and TASK-6.16/6.17/7.9 judge notes): TAG aggression measures 63.5–64.2% over 100k hands against the REQ-027.1 band 45–65%, and short --check-styles runs (2k hands) read 67.2% and fail with no tuning problem. A later advice change could push the 100k value out. Options: widen the band (requirements change), tune TAG postflop (e.g. a small value bar like the Rock's), or document a minimum run length for --check-styles.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the options (widen band / tune TAG / document minimum run length), When the user decides, Then the decision is recorded on this task and any resulting change is a follow-up story
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Measurements (TASK-6.24, 100k at seed 42; 2k at seeds 1–20 per line-up; code at main a08251c):
| Run | TAG VPIP | TAG PFR | TAG aggression | Room below 65% | Style check | Time |
|---|---|---|---|---|---|---|
| All-TAG (`--hands 100000 --check-styles`) | 22.2% | 16.2% | **64.3%** | 0.7 pts | passed (exit 0) | 1 min 49 s |
| Mixed (`--lineup mixed`), the REQ-027 setting | 20.4% | **14.6%** | **59.5%** | 5.5 pts | passed (exit 0) | 3 min 13 s |
| Line-up | TAG aggression range (mean) | Runs with TAG aggression > 65% | Runs failing the style check | Why they failed |
|---|---|---|---|---|
| All-TAG | 63.2–64.9% (64.3) | **0 / 20** | 20 / 20 | Every one: "One action only" on a rare mixed spot (`preflop-limpers` or `preflop-raise-and-calls`, 0–3 hands each). No band was missed. |
| Mixed | 54.3–63.6% (59.2) | **0 / 20** | 12 / 20 | 7 from "One action only". Band misses: Rock VPIP 7.7–7.9% (5 seeds, floor 8%), TAG PFR 13.7/13.9% (seeds 20 and 5, floor 14%), Rock aggression 56.1/56.2% (seeds 9 and 10, ceiling 55%). |

Judge r1 PASS (5/5 SPEC items)

Follow-ups: TASK-6.28 (document the 100,000-hand run length for --check-styles).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Decision (Q-1, user 2026-11-26): option B. TAG's REQ-027.1 aggression band stays 45–65%. On today's code TAG aggression is 59.5% over 100,000 Mixed hands (5.5 points under the ceiling) and 64.3% over 100,000 all-TAG hands; in 40 runs of 2,000 hands (seeds 1–20, all-TAG and Mixed) it never exceeded 65%. The short-run failures the task described now come from other small-sample effects: rare mixed spots used only one way, and stats near their floors. Note: two Mixed 100k values pass with little room, TAG PFR 14.6% (floor 14%) and Rock VPIP 8.7% (floor 8%); they dip below their floors only in 2k runs. No tuning task is opened for them; revisit if a 100k run misses. Decision decision-2 recorded. Follow-up TASK-6.28 documents that --check-styles is judged over 100,000 hands. No project files changed in this task.
<!-- SECTION:FINAL_SUMMARY:END -->
