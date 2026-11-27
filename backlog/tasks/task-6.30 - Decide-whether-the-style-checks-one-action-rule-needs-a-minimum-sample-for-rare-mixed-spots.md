---
id: TASK-6.30
title: >-
  Decide whether the style check's one-action rule needs a minimum sample for
  rare mixed spots
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-27T10:03:00Z'
updated_date: '2026-11-27T22:41:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
  - spike
milestone: m-1
dependencies:
  - TASK-7.46
references:
  - doc-185
parent_task_id: TASK-6
priority: low
ordinal: 272000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
From TASK-7.46 (doc-185, Q-2). REQ-027.5 fails --check-styles when any mixed spot used only one action. At 3 seats the TAG preflop-limpers spot occurs about once in 50,000-100,000 hands, so npm run playtest -- --size 3 --check-styles exits 1 even though every band holds. Options: a minimum sample before the rule applies; keep the rule; exclude spots below N occurrences. If the rule changes, restore the exit-0 assertion (or rename) in tests/playtest/check-styles-three-seats.acceptance.test.ts.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the options above, When the user decides, Then the decision is recorded and any change becomes a follow-up story that restores an exit-0 check (or renames the slow test) for 3-seat --check-styles
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Record decision-9 (one-action rule judged only at >= 10 decisions)
2. Reword the REQ-028.3 fit criterion; changelog 1.19
3. Create the follow-up build story (6 ACs, locked re-pins with owners)
4. No code change; tick AC#1

Full spec: doit/TASK-6.30/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Q-1 answered B with N = 10 (user, 2026-11-27): the one-action rule judges a mixed spot only when it came up at least 10 times (recommended + alternative >= 10); spots with 1 to 9 decisions are listed on a separate 'Not judged (fewer than 10 decisions): <style> <spot>' line and do not fail the check; 0/0 passes as today. Recorded as decision-9. REQ-028 fit criterion reworded in dreams/limit-holdem-trainer/requirements.md (changelog 1.19); REQ-027.5 and REQ-028.3 unchanged. Follow-up build story TASK-6.31 (depends on TASK-6.30): rule change, usage text, docs, re-pin of the TASK-6.11 never-mixing case and restore exit 0 in the TASK-7.46 3-seat slow test. Key numbers (seed 42): all-TAG 3 seats 100,000 hands, TAG preflop-limpers 1/0 is the only one-action failure; honest 75/25 bot P(one action) = 0.75^n + 0.25^n = 5.6% at n = 10 (0.32% at n = 20); smallest spot in the REQ-027 fit-criterion run (Mixed 6-max 100k) is preflop-raise-and-calls with 13 decisions (10/3), so all fit-criterion spots stay judged; at 100,000 hands N = 10 excludes only 3-seat all-TAG limpers (N = 20 would also drop 9-seat limpers (10) and fit-criterion raise-and-calls (13)). No product code changed. Evidence tables: doit/TASK-6.30/spec.md section 3.

Build: decision-9; REQ-028 fit criterion + changelog 1.19; follow-up TASK-6.31; gate PASS

Review r1 fix: tests/playtest/check-styles.acceptance.test.ts is locked by two tasks, TASK-6.11 and TASK-6.25 (its current sha matches TASK-6.25's lock); TASK-6.31's description and AC#4 now name both owners (unlock under both). The locked spec's sections 3 and 5 named only TASK-6.11 (spec not edited). Fit-criterion smallest spot under N = 10 on all three CI seeds (Mixed 6-max 100k): preflop-raise-and-calls 13 / 12 / 16 decisions at seeds 42 / 7 / 1234, so it stays judged on every seed. TASK-6.31 also now asks for the comments in tests/playtest/check-styles-three-seats.acceptance.test.ts:9 and docs/advice/range-model.md:294 to cite the REQ-028 fit criterion, not REQ-027.5.
<!-- SECTION:NOTES:END -->
