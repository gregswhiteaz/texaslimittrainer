---
id: TASK-3.26
title: Tidy the side-pot hand result layout and pin split-pot rendering
status: Done
assignee:
  - '@claude'
created_date: '2026-11-21T19:29:00Z'
updated_date: '2026-11-26T13:03:00Z'
labels:
  - follow-up
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-3.8
references:
  - doc-69
documentation:
  - doc-162
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
- [x] #1 Given a side-pot hand result at 1280x720, When it is shown, Then 'Hand over' stays on one line and every Pot winners / Shown hands line is readable without being squeezed into a narrow column (screenshot-checked)
- [x] #2 Given a split side pot, When the result renders, Then the Pot winners line reads exactly 'Side pot $81 · Ben wins $41, Ava wins $40' in a render test and in Chromium and WebKit, rendered from the view model's text
- [x] #3 Given the Game Config game-type radios, When the selection changes, Then both options keep the same height (no 2px jump from the 2px vs 1px border)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Side-pot result block stacks (CSS :has) so 'Hand over' stays on one line; single-pot unchanged
2. PotResultView potText/winnersText; Table renders view-model text (split pot line)
3. Game Config radios: border-box so checked/unchecked stay 44px
4. Render test + Chromium/WebKit e2e for the split side pot; geometry checks + attached screenshot

Full spec: doit/TASK-3.26/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-2.4 judge J-1-02 (UI polish)

Build: side-pot result stacks (Hand over one line); Table renders PotResultView potText/winnersText; Game Config radios border-box (44px); new render + Chromium/WebKit tests fail on old CSS; e2e 397 passed; gate PASS

Judge r1 PASS (7/7 SPEC items; screenshots checked in Chromium and WebKit)

Follow-ups: AC added to TASK-3.16 (side-pot result fits above the 720 px fold).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Side-pot hand result now stacks its rows so 'Hand over' stays on one line and no list is squeezed; the split side pot line is rendered from new view-model fields potText/winnersText and pinned in a render test and Chromium+WebKit e2e; game-type and line-up options are a constant 44 px (border-box). Verified: lint, typecheck, 1456 unit tests, e2e 397 passed 0 failed, judge round 1 PASS 7/7. Review assumptions A-1..A-4 (stack only with Pot winners list; crafted chip-reconciling split scene; border-box height; two VM string fields). Risk/follow-up: stacked block is ~169 px and runs below the 720 px fold in the harness; proposed AC for TASK-3.16.
<!-- SECTION:FINAL_SUMMARY:END -->
