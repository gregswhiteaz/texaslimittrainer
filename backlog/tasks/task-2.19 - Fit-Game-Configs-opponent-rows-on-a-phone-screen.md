---
id: TASK-2.19
title: Fit Game Config's opponent rows on a phone screen
status: Done
assignee:
  - '@claude'
created_date: '2026-11-23T02:46:00Z'
updated_date: '2026-11-25T19:21:00Z'
labels:
  - follow-up
  - bug
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-2.8
references:
  - doc-91
documentation:
  - doc-145
parent_task_id: TASK-2
priority: medium
ordinal: 222000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-2.9 judge (J-1-02, doc-91). Since TASK-2.8 added a Style select to each bot row, Game Config scrolls sideways at 320–375 px (scrollWidth 388).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given Game Config at 320 px and 375 px wide with 10 players, When it renders, Then the page does not scroll sideways and every bot row's name, seat and Style select are fully visible and usable
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. CSS only: bot rows wrap on narrow screens, Style control right-aligned on its own line; desktop unchanged
2. New e2e at 320 and 375 px (10 players): no sideways scroll, 16px gutter, every row's seat, name and 44px select visible and usable

Full spec: doit/TASK-2.19/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: CSS-only — bot rows wrap with the Style control right-aligned on narrow screens; new e2e at 320/375 px (fails without the fix). Game Config e2e 30 pass; gate PASS.

Judge r1 PASS 3/3, no findings: 30 cases (320/360/375/414/1280 px x 2/6/10 players, Chromium and WebKit) — no sideways scroll, rows in viewport, 44px selects usable by mouse and keyboard, Start game works; 1280 px boxes and screenshots byte-identical to main. CI 45682056212 green.

Follow-ups: none.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Game Config's opponent rows now fit phones: CSS-only (flex-wrap on rows, margin-left:auto on Style), so at 320/375 px the Style select wraps to its own right-aligned line (rows 61 -> 91 px) and the page no longer scrolls sideways. Desktop is pixel-identical. Verified by new e2e/config-phone-width.spec.ts (chromium+webkit), npm test 1410 passed, judge round 1 PASS. Review: Q-1 (wrapped layout), A-1..A-3. Known limitation: NIT placeholder box in the e2e. No follow-ups.
<!-- SECTION:FINAL_SUMMARY:END -->
