---
id: TASK-12.11
title: Tell me when a Settings change could not be saved
status: Done
assignee:
  - '@claude'
created_date: '2026-11-25T17:01:00Z'
updated_date: '2026-11-27T12:12:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-12.2
references:
  - doc-142
documentation:
  - doc-189
parent_task_id: TASK-12
priority: low
ordinal: 248000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-12.2 (doc-142). A failed settings save is only logged (console.error 'Settings could not be saved'); the screen keeps the new value until the app closes, so the user can believe a change was saved when it was not.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a settings save that fails, When the user changes a setting, Then Settings shows a short visible message that the change was not saved (approved wording) and the stored record is unchanged
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Pure createSettingsSaver (latest save drives the screen; revert to last saved on failure)
2. Settings shows role=alert message after the header on failure; clears on next change / reopen
3. Unit, acceptance and e2e tests (e2e makes settings put fail via init script)
4. Docs

Full spec: doit/TASK-12.11/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: createSettingsSaver (latest save wins, revert on failure); role=alert message after Settings header; unit/acceptance/e2e tests; docs; gate PASS

Step 6a: TASK-12.12 AC added (clear-on-next-change e2e).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Failed Settings saves now show a role=alert message ('Your change could not be saved, so the setting is unchanged.') and the control reverts to the stored value; the record is untouched. A pure saver (settings-save.ts) makes only the latest write decide the outcome. Verified: npm test 1543 pass, Playwright Chromium+WebKit pass, judge PASS 5/5, reviews clean, 323 lines/9 files. Review: the message wording (auto-accepted Q-1) and assumptions A-1..A-6. Follow-up: no test distinguishes clear-on-change from clear-on-success (held-write e2e) -> AC on TASK-12.12.
<!-- SECTION:FINAL_SUMMARY:END -->
