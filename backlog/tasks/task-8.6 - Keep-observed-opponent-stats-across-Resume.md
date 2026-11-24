---
id: TASK-8.6
title: Keep observed opponent stats across Resume
status: To Do
assignee: []
created_date: '2026-11-24T10:52:00Z'
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
