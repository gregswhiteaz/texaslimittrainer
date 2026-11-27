---
id: TASK-12.12
title: >-
  Show an error instead of loading forever when a second tab opens during a
  blocked upgrade
status: Done
assignee:
  - '@claude'
created_date: '2026-11-27T11:43:00Z'
updated_date: '2026-11-27T13:02:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-12.10
references:
  - doc-188
documentation:
  - doc-191
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
- [x] #1 Given an old connection blocks the upgrade and a second app tab is opened, When that tab's store open gets no response within a bounded time, Then it rejects with UpgradeBlockedError so the tab shows its existing failure state instead of loading forever, and a test covers it
- [x] #2 Given docs/storage/hand-records.md and src/storage/hand-store.ts, When the version table is corrected to 5 and the redundant reset, dead guard and long docblock line are tidied, Then all storage tests still pass
- [x] #3 Given a settings save is held (not yet settled) after a previous failure showed the message, When the user makes the next change, Then the message is gone before that save settles (e2e with a held write), pinning TASK-12.11 A-3
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. OPEN_TIMEOUT_MS 10 s to the first open event; a timed-out open follows the blocked-open path (UpgradeBlockedError, retry, late success closes)
2. Tidy-ups: docs version table 5, remove redundant reset and dead guard, wrap long docblock
3. hold-writes helper can hold a settings write; new e2e: message clears at the next change before that save settles

Full spec: doit/TASK-12.12/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-12.11 follow-up (review MINOR / judge J-1-01)

Build: OPEN_TIMEOUT_MS 10 s to first open event (A-1) via blocked-open path; tidy-ups; hold-writes can hold settings; new held-write e2e; gate PASS

Step 6a: none created (docs rewrap NIT has no behaviour change; slowed-upgrade test MINOR is covered by design per spec D-2).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Every database open now waits at most 10 s (OPEN_TIMEOUT_MS) for its first event; a second tab queued behind a blocked v5 upgrade rejects with UpgradeBlockedError so Home leaves loading, and the next call retries. Also corrected the docs version table to 5, removed the redundant reset, dead guard and long docblock line, and added a held-write e2e pinning that the save-failed message clears before the next save settles. Verified: npm test 1545 passed, full Playwright 413 passed, judge PASS 5/5, reviews clean. Review: A-1 (10 s timeout is user-visible timing). Follow-ups: rewrap docs/storage/hand-records.md:28 (134 chars); optional test for a missing clearTimeout in onupgradeneeded.
<!-- SECTION:FINAL_SUMMARY:END -->
