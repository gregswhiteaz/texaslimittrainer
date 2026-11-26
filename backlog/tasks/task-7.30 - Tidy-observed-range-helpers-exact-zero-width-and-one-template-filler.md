---
id: TASK-7.30
title: 'Tidy observed-range helpers: exact zero width and one template filler'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-23T19:21:00Z'
updated_date: '2026-11-26T15:11:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.13
references:
  - doc-104
documentation:
  - doc-165
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
- [x] #1 Given a CO open-raiser observed for 100 hands with PFR 0, When its scaled width is computed, Then the width is exactly 0 (toBe(0), not toBeCloseTo)
- [x] #2 Given basisText for 45 hands, When it is rendered, Then it is produced through fillTemplate and reads exactly 'based on 45 hands of this opponent', and no other template-filling helper remains in src/advice
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

Judge r1 PASS (5/5 SPEC items)

Follow-ups: none.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Moved exact-zero fix and single template filler: scaledWidthPct now returns the observed stat exactly from 100 hands (early return; below 100 unchanged), and basisText fills its placeholder through fillTemplate, now in explanations.ts and re-exported from explain.ts. Verified: npm test 1466 passed, typecheck/lint clean, playtest and --check-advice SHAs unchanged (0 mismatches over 26503 points), judge 5/5. Review assumptions A-1..A-3 (early return; phrase swap left alone; SHAs in build log). Risks: none; spec said 90 default ranges, actual 102.
<!-- SECTION:FINAL_SUMMARY:END -->
