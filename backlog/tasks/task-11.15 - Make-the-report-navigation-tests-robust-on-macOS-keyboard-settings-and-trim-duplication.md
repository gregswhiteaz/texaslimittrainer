---
id: TASK-11.15
title: >-
  Make the report navigation tests robust on macOS keyboard settings and trim
  duplication
status: Done
assignee:
  - '@claude'
created_date: '2026-11-25T14:22:00Z'
updated_date: '2026-11-28T00:55:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-11.6
references:
  - doc-139
documentation:
  - doc-200
parent_task_id: TASK-11
priority: low
ordinal: 246000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-11.6 review/judge (doc-139). e2e/report-navigation.spec.ts presses Alt+Tab in WebKit everywhere and its comment says WebKit needs it in general; it is a macOS Full Keyboard Access setting, so the test could fail on a Mac with that setting on. tests/ui/report-navigation.acceptance.test.tsx:67-74 repeats a check the loop already makes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the WebKit Tab-order step, When it runs on Linux CI and on macOS with or without Full Keyboard Access, Then it passes (Alt+Tab only where needed) and its comment states the macOS cause
- [x] #2 Given e2e/back-focus.spec.ts, e2e/settings.spec.ts and e2e/error-recovery.spec.ts, When their WebKit Tab steps run, Then they use the same buttonTabKey helper instead of a hard-coded WebKit Alt+Tab, their comments name the macOS Full Keyboard Access cause, and no assertion is changed
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. e2e/support/keyboard.ts: chooseButtonTabKey (pure) + buttonTabKey (probe page): Tab first, Alt+Tab fallback, throw if neither
2. Use it in report-navigation, back-focus, settings and error-recovery specs; comments name macOS Full Keyboard Access; no assertion changed
3. Helper tests; verify on this Mac (setting on) + Linux CI run

Full spec: doit/TASK-11.15/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC#2 dropped 2026-11-28 (user decision): the duplicate placement check in the locked tests/ui/report-navigation.acceptance.test.tsx:67-74 stays — deleting assertions from a locked test is refused by the safeguard and the check is harmless.

AC#2 added 2026-11-28 (Q-2, user: include the other three files).

Locked e2e edits unlocked under owners: report-navigation (TASK-11.6), back-focus (TASK-12.10), settings (TASK-12.1, 12.10, 12.2), error-recovery (TASK-13.1).

Build: buttonTabKey helper (Tab first, Alt+Tab fallback, probe page); four e2e files switched, assertion counts 30/8/22/41 unchanged; gate PASS

Step 6a: none (optional manual off-setting run is the user's choice; tabOrder merge is a tidy-up below the bar).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added e2e/support/keyboard.ts buttonTabKey (plain Tab, else Alt+Tab, else throw; probe on a separate page) and used it in report-navigation, back-focus, settings and error-recovery e2e specs, replacing hard-coded WebKit Alt+Tab; comments name macOS Full Keyboard Access. No assertion changed (30/8/22/41); locked e2e edits under owners TASK-11.6, 12.10, 12.1, 12.2, 13.1. Verified: 32 passed locally on chromium+webkit (Keyboard navigation ON, setting untouched), full gate 421 passed, lint/typecheck clean, CI 46089401147 green, judge PASS r1 (7/7). Review: NIT only (comment says 'holds Alt only then'). Risk: Keyboard-navigation-OFF case is covered only by the injected fake-page test, not run on real hardware. Original AC#2 dropped by user. Assumptions A-1..A-4 to review in the doc.
<!-- SECTION:FINAL_SUMMARY:END -->
