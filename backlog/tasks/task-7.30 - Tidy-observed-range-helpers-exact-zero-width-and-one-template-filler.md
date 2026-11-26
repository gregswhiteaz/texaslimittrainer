---
id: TASK-7.30
title: 'Tidy observed-range helpers: exact zero width and one template filler'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-23T19:21:00Z'
updated_date: '2026-11-26T14:51:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.13
references:
  - doc-104
parent_task_id: TASK-7
priority: low
ordinal: 229000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.13 (doc-104). scaledWidthPct can return about 3.55e-15 instead of exactly 0 when the observed PFR/VPIP is 0 (judge J-2-01; the range is still AA). basisText fills its placeholder with String.replace instead of the existing fillTemplate (code review MINOR basis-text-reimplements-fill-template).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a CO open-raiser observed for 100 hands with PFR 0, When its scaled width is computed, Then the width is exactly 0 (toBe(0), not toBeCloseTo)
- [ ] #2 Given basisText for 45 hands, When it is rendered, Then it is produced through fillTemplate and reads exactly 'based on 45 hands of this opponent', and no other template-filling helper remains in src/advice
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. scaledWidthPct returns the observed stat exactly from 100 hands (early return); below 100 unchanged
2. Move fillTemplate into explanations.ts; basisText uses it; explain.ts re-exports
3. Acceptance + unit tests (exact zero, basis text, single template filler)
4. Playtest SHAs unchanged

Full spec: doit/TASK-7.30/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: scaledWidthPct exact from 100 hands; fillTemplate moved to explanations.ts and used by basisText; playtest SHAs unchanged; gate PASS
<!-- SECTION:NOTES:END -->
