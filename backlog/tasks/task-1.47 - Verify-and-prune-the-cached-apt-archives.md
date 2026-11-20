---
id: TASK-1.47
title: Verify and prune the cached apt archives
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
priority: medium
type: chore
ordinal: 208000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.39 security review and judge (J-1-01, J-1-03): apt trusts a .deb already in /var/cache/apt/archives on name and size, not hash, so a .deb planted in the Actions cache by code in a main job would be installed as root on later runs for up to a month. restore-keys also carries old .debs forward month to month.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a restored .deb whose sha256 does not match the signed index (apt-cache show <pkg>=<ver> after apt-get update), When the restore step runs, Then that file is discarded before reaching /var/cache/apt/archives, and a test proves a tampered file is dropped
- [ ] #2 Given the job runs later steps (tests, E2E) after the installs, When the apt cache is saved, Then it is saved right after Collect (actions/cache/restore + actions/cache/save) so later steps cannot add files to it
- [ ] #3 Given last month's cache is restored via restore-keys, When Collect runs, Then .debs no longer needed by the current install are not carried forward (e.g. apt-get autoclean or collect only what this install used)
<!-- AC:END -->
