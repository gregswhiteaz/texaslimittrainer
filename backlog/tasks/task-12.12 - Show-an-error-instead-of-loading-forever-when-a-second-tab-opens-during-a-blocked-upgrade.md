---
id: TASK-12.12
title: >-
  Show an error instead of loading forever when a second tab opens during a
  blocked upgrade
status: To Do
assignee: []
created_date: '2026-11-27T11:43:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-12.10
references:
  - doc-188
parent_task_id: TASK-12
priority: low
ordinal: 275000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
From TASK-12.10 (doc-188, judge J-2-01 MEDIUM). With an old-version connection blocking the upgrade, the first app tab rejects with UpgradeBlockedError, but a second app tab opened in the same browser stays on the loading Home menu with no error until the blocker closes: its open request queues behind the first tab's blocked request and never gets its own blocked event. Also bundles small cleanups: docs/storage/hand-records.md version table says 4 while DB_VERSION is 5; in src/storage/hand-store.ts the redundant blockedOpen reset (~:262), the dead db===opening guard (~:268) and an unwrapped 170-char docblock line (~:240).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given an old connection blocks the upgrade and a second app tab is opened, When that tab's store open gets no response within a bounded time, Then it rejects with UpgradeBlockedError so the tab shows its existing failure state instead of loading forever, and a test covers it
- [ ] #2 Given docs/storage/hand-records.md and src/storage/hand-store.ts, When the version table is corrected to 5 and the redundant reset, dead guard and long docblock line are tidied, Then all storage tests still pass
<!-- AC:END -->
