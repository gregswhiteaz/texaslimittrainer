---
id: TASK-8.6
title: Keep observed opponent stats across Resume
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-24T10:52:00Z'
updated_date: '2026-11-26T07:45:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-8.1
  - TASK-2.6
references:
  - doc-114
parent_task_id: TASK-8
priority: medium
ordinal: 233000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-8.1 (doc-114, Q-3). Per-bot observed counts live in a useTableSession ref and restart at 0 after Resume, so a bot watched for 45 hands shows 'typical player' again after the user pauses and resumes. Persist the counts in the session record (or rebuild them from stored hand records on resume) so hints and stored decisions keep using them. This is a persisted-format change.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a session where a bot has been observed for 45 hands, When the user pauses, resumes and opens Hint on a postflop decision, Then that bot's basis reads 'based on 45 hands of this opponent' (counts carried across Resume)
- [ ] #2 Given a stored session record with observed counts that are malformed (non-integer hands, vpip/pfr outside 0-100, unknown bot id), When it is read, Then it is rejected with a RangeError naming the field and Home stays usable
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Optional observed[] on the session record (botId, hands, vpipHands, pfrHands), validated with RangeErrors naming the field
2. Write it with each hand record in the same transaction; DB stays v5
3. Resume restores the counts into the table session (restoreObserved), hints use them
4. Acceptance + e2e: 45-hand basis after Resume; malformed records rejected, Home usable
5. Docs: storage/sessions.md, ui/hint.md

Full spec: doit/TASK-8.6/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: optional observed[] on the session record written with each hand, validated, restored on Resume; e2e 381 passed; 824 lines vs 650 budget (warn); gate PASS
<!-- SECTION:NOTES:END -->
