---
id: TASK-7.20
title: Pin the preflop chart validator's edge cases
status: Done
assignee:
  - '@claude'
created_date: '2026-11-18T16:24:00Z'
updated_date: '2026-11-21T03:03:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-7.2
references:
  - doc-14
documentation:
  - doc-53
parent_task_id: TASK-7
priority: low
type: chore
ordinal: 176000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.2 reviews: one mutant survived (word count accepts non-letter tokens) and two behaviours are unspecified.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a justification of 60 numeric or punctuation tokens, When the validator runs, Then it is rejected as missing its justification
- [x] #2 Given chartCell is called with an unknown hand class, When it throws, Then the RangeError and its message are documented in the module and covered by a test
- [x] #3 Given parseChart reports a bad token or spot name, When the message is built, Then the echoed value is cut to at most 20 characters
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Test that 60 numeric/punctuation tokens fail the justification rule (chart and spot level); shipped chart still parses (26 spots).
2. Document chartCell's RangeError('Unknown hand class <hc>') and test the exact message.
3. Local echo helper cuts bad tokens and spot names to 20 chars + '...'; tests incl. exactly-20 cases.

Full spec: doit/TASK-7.20/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: 20-char echo helper at the three echo sites; chartCell JSDoc names both RangeErrors; new edge acceptance tests (SPEC-01 proven against /\S+/ mutant); gate PASS

Judge R1 PASS 5/5; all 7 judge mutants caught.

Follow-ups (Step 6a): none — NITs only matter if parseChart ever accepts user-supplied charts (no planned story does); condition recorded in doc-53.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Cut echoed tokens and spot names in parseChart to 20 chars (+... when cut), documented chartCell's unknown-hand-class RangeError, and added acceptance tests (SPEC-01..05) that pin the letter-run word rule and both RangeErrors. Verified: npm test 376 passed/6 skipped, judge PASS round 1, no blocking review findings. Review assumptions A-1..A-6 (cut format, UTF-16 counting, local helper). Risk: NITs (uncut reference-size echo, UTF-16 cut, control chars) matter only if parseChart ever accepts user charts.
<!-- SECTION:FINAL_SUMMARY:END -->
