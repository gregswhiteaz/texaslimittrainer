---
id: TASK-1.48
title: Polish apt-lock's dpkg recovery messages and sandbox test checks
status: To Do
assignee: []
created_date: '2026-11-20T23:06:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.39
references:
  - doc-43
parent_task_id: TASK-1
priority: low
type: chore
ordinal: 209000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.39 review (code MINOR, judge J-1-02, security NIT, code NIT).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given sudo cannot start at all, When apt-lock tries the dpkg recovery, Then it prints one ::warning:: naming the real reason (no ::error:: line, no 'exit code 1') and still runs the install
- [ ] #2 Given /var/lib/dpkg/updates cannot be read (EACCES), When dpkgInterrupted runs, Then apt-lock reports a clear message instead of a stack trace
- [ ] #3 Given tests/support/sandbox-timeout.acceptance.test.ts, When it checks the normal run's output, Then the assertion cannot be satisfied by the probe's file name alone
<!-- AC:END -->
