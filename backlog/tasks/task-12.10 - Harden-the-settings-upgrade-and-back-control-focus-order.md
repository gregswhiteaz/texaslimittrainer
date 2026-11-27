---
id: TASK-12.10
title: Harden the settings upgrade and back-control focus order
status: Done
assignee:
  - '@claude'
created_date: '2026-11-25T15:55:00Z'
updated_date: '2026-11-27T11:43:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-12.1
references:
  - doc-141
documentation:
  - doc-188
parent_task_id: TASK-12
priority: low
ordinal: 247000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-12.1 review and judge (doc-141). The v3->v4 upgrade unit test checks defaults only via readSettings(), which returns defaults even when no record exists; there is no onblocked handler, so a tab holding the old DB leaves store calls pending; in Chromium the first Tab from the Settings/Statistics heading leaves the page because the back control precedes the h1.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a v3 database upgraded to v4, When the raw 'settings' record is read, Then a unit test asserts it equals the defaults
- [x] #2 Given another tab holds the old database version open, When the app upgrades, Then the blocked upgrade is handled (the user sees a clear message or the other connection closes on versionchange) instead of hanging
- [x] #3 Given Settings or Statistics opened with the heading focused, When the user presses Tab once, Then focus reaches the back control without leaving the page
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Unit test: raw settings record equals defaults after upgrade through v4
2. Blocked upgrade rejects with UpgradeBlockedError, next call retries, late connection closed
3. Back control after h1 in DOM on Settings/Statistics (CSS keeps visual order); re-pin locked e2e Tab order (TASK-12.1)
4. Docs

Full spec: doit/TASK-12.10/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: UpgradeBlockedError + retry; raw settings record test; back control after h1 in DOM with CSS order; locked e2e/settings.spec.ts Tab order re-pinned (TASK-12.1, Q-2); gate PASS

Judge r1 FAIL (J-1-01: second call hung behind the pending blocked open). Fixed: calls while a blocked open is pending wait at most 100 ms (BLOCKED_GRACE_MS, assumption) then reject with UpgradeBlockedError; late success closes its connection (tested).

Step 6a: created follow-up (second tab during blocked upgrade + small cleanups).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Blocked IndexedDB upgrades now reject with UpgradeBlockedError (retry on next call, 100 ms grace for calls during a pending block) instead of hanging; v3 upgrade test asserts the raw settings record; on Settings and Statistics one Tab from the h1 reaches Back to Home (DOM reorder + CSS order:-1). Verified: npm test, e2e back-focus and settings, gates PASS, judge r2 PASS 8/8 (r1 failed J-1-01, fixed). Review assumptions: Q-1 (no UI text) and Q-2 (locked settings e2e re-pinned) were auto-accepted; A-6 100 ms grace is the builder's choice. Risks/follow-ups: a second tab opened during a block stays on loading Home until the blocker closes (J-2-01); hand-records.md version table says 4 vs DB_VERSION 5; MINOR/NIT cleanups in hand-store.ts.
<!-- SECTION:FINAL_SUMMARY:END -->
