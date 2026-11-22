---
id: TASK-1.51
title: Keep GitHub Actions usage within the account's budget
status: To Do
assignee: []
created_date: '2026-11-22T04:36:00Z'
updated_date: '2026-11-22T18:28:00Z'
labels:
  - follow-up
  - spike
  - ci
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-1.50
references:
  - doc-78
parent_task_id: TASK-1
priority: high
ordinal: 216000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.50 (doc-78). ci.yml used about 2,680 wall-minutes over 164 runs since 2026-11-18, above the 2,000 min/month Free allowance for a private repo. TASK-1.50 cut minutes per run (~20 → ~15) but not the number of runs (every push to every doit branch plus main). If the allowance and spending limit run out, CI stops and autopilot's merge gate can't work. Billing usage can't be read with the current gh token (needs the user scope).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the account's actual Actions usage and spending limit (read by the user or with a user-scoped token), When the user reviews it, Then the user decides whether to reduce run volume (e.g. skip CI on doit-only/doc-only pushes, run branch CI only once per story stage, or make the repo public) and the decision is recorded
- [ ] #2 Given the user's budget decision, When it allows a run, Then million-lineups.yml (TASK-6.9) is dispatched once on main and its 27 shards finish within the job limit with zero violations, recorded in doc-83 — or the decision to skip it is recorded
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-6.9 follow-up (live dispatch evidence for AC#3)
<!-- SECTION:NOTES:END -->
