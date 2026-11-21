---
id: TASK-3.26
title: Tidy the side-pot hand result layout and pin split-pot rendering
status: To Do
assignee: []
created_date: '2026-11-21T19:29:00Z'
updated_date: '2026-11-21T20:08:00Z'
labels:
  - follow-up
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-3.8
references:
  - doc-69
parent_task_id: TASK-3
priority: low
ordinal: 212000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-3.8 judge (doc-69). J-1-01: with side pots the hand-over block has four columns, so 'Hand over' wraps and 'Ava shows · Pair of queens' is squeezed (no overflow, still readable). J-1-02: no render/browser test shows a split pot line; Table.tsx joins winner names itself instead of rendering PotResultView text, so a separator change goes unnoticed.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a side-pot hand result at 1280x720, When it is shown, Then 'Hand over' stays on one line and every Pot winners / Shown hands line is readable without being squeezed into a narrow column (screenshot-checked)
- [ ] #2 Given a split side pot, When the result renders, Then the Pot winners line reads exactly 'Side pot $81 · Ben wins $41, Ava wins $40' in a render test and in Chromium and WebKit, rendered from the view model's text
- [ ] #3 Given the Game Config game-type radios, When the selection changes, Then both options keep the same height (no 2px jump from the 2px vs 1px border)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-2.4 judge J-1-02 (UI polish)
<!-- SECTION:NOTES:END -->
