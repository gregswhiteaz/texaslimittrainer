---
id: TASK-10.16
title: Pin the Hints used tile wording in e2e and reject hints without errors
status: Done
assignee:
  - '@claude'
created_date: '2026-11-25T07:28:00Z'
updated_date: '2026-11-26T18:15:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-10.7
references:
  - doc-132
documentation:
  - doc-169
parent_task_id: TASK-10
priority: low
ordinal: 243000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-10.7 review/judge (doc-132). e2e/report-hints.spec.ts derives its expected tile text from hintTile itself, so a wording regression would not fail it; and a stored report with hints but no errors validates yet shows no tile (the app never writes that combination).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the e2e Hints used check, When it compares the tile, Then the expected text is built from the stored counts with the literal 'N of M decisions (P%)' wording, not from hintTile
- [x] #2 Given a stored report with hints but no errors, When it is read, Then parseSessionReport rejects it with a RangeError naming hints
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. e2e Hints used check builds the literal expected text from stored counts
2. parseSessionReport rejects hints without errors (RangeError naming hints); older reports still parse

Full spec: doit/TASK-10.16/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: e2e Hints tile expected text built from stored counts with literal wording; parseSessionReport rejects hints without errors; gate PASS

Judge r1 PASS (2/2 SPEC items; mutation-checked)

Follow-ups: none.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Hints used e2e now builds its expected text from the stored counts with literal wording (singular for 1 decision), so a hintTile wording regression fails it. parseSessionReport now rejects hints without errors (RangeError 'Invalid session report: hints'); the app never wrote that combination. Verified: judge PASS 2/2 mutation-checked, CI 45873286030 green, no review findings. Review assumptions A-1..A-3 (singular wording, own percent arithmetic, check before parseHints). Risk: the e2e session has 1 decision, so only singular is e2e-pinned; plural is unit-covered.
<!-- SECTION:FINAL_SUMMARY:END -->
