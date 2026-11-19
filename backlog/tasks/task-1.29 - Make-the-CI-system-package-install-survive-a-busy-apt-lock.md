---
id: TASK-1.29
title: Make the CI system-package install survive a busy apt lock
status: To Do
assignee: []
created_date: '2026-11-19T02:21:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.19
references:
  - doc-11
  - doc-26
parent_task_id: TASK-1
priority: high
type: chore
ordinal: 188000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by the TASK-9.1 judge (2026-11-19): CI run 44441353985 attempt 1 and main's run 44434902016 both failed at 'Install Playwright system dependencies' because the Ubuntu runner's dpkg lock was held by another apt-get (unattended upgrades at boot). apt exits 100 in seconds, so TASK-1.19's three retries (10 s apart) all hit the same lock. A re-run fixed both, but every push risks a false red.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given another apt process holds the dpkg lock when the step starts, When the system-package install runs, Then it waits for the lock to clear (or uses apt's lock timeout) for up to a set limit before installing, instead of failing with exit 100
- [ ] #2 Given the lock never clears within the limit, When the step gives up, Then it fails with a clear ::error:: line naming the lock, within the step's existing timeout
- [ ] #3 Given the workflow test, When it checks the install step, Then it asserts the lock handling is present
<!-- AC:END -->
