---
id: TASK-11.15
title: >-
  Make the report navigation tests robust on macOS keyboard settings and trim
  duplication
status: To Do
assignee: []
created_date: '2026-11-25T14:22:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-11.6
references:
  - doc-139
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
- [ ] #1 Given the WebKit Tab-order step, When it runs on Linux CI and on macOS with or without Full Keyboard Access, Then it passes (Alt+Tab only where needed) and its comment states the macOS cause
- [ ] #2 Given the report navigation unit test, When read, Then the redundant placement block is removed with no check lost
<!-- AC:END -->
