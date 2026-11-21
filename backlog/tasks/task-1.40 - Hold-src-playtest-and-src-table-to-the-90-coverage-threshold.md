---
id: TASK-1.40
title: Hold src/playtest and src/table to the 90% coverage threshold
status: Done
assignee:
  - '@claude'
created_date: '2026-11-19T20:45:00Z'
updated_date: '2026-11-21T00:53:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.26
references:
  - doc-32
documentation:
  - doc-46
parent_task_id: TASK-1
priority: low
type: chore
ordinal: 200000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.26 (A-1): the two folders now get the headless lint rule but not the 90% coverage threshold, because HEADLESS_DIRS also drives TASK-1.1's locked coverage test. Both are near 100% today, so this pins it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given vite.config.ts, When coverage runs, Then src/playtest/** and src/table/** are held to the same 90% thresholds as engine, bots, advice and stats
- [x] #2 Given TASK-1.1's coverage test (unlocked with a recorded reason), When it runs, Then it checks the widened glob and LINT_ONLY_HEADLESS_DIRS is folded into HEADLESS_DIRS
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. HEADLESS_DIRS gains playtest, table; LINT_ONLY_HEADLESS_DIRS removed.
2. vite.config.ts 90% glob widened to src/{engine,bots,advice,stats,playtest,table}/**.
3. Update the two locked toolchain tests (stricter only) and the README.

Full spec: doit/TASK-1.40/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Autopilot: cross-story stricter edits to TASK-1.1 and TASK-1.26 locked tests, unlocks recorded under their owners.

Build: 90% coverage glob + HEADLESS_DIRS include playtest, table; LINT_ONLY_HEADLESS_DIRS removed; gate PASS

Judge R1 PASS 4/4: under-covered code in src/table or src/playtest fails npm test naming the widened glob; same file in src/ui does not.

Follow-ups (Step 6a): TASK-1.49 sandbox-timeout EPERM (recurring infra failure). J-1-01 per-file coverage: not tracked.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Widened the 90% line threshold to src/{engine,bots,advice,stats,playtest,table}/** and folded LINT_ONLY_HEADLESS_DIRS into HEADLESS_DIRS (40 lines, 5 files, no production code). Two locked tests (TASK-1.1 coverage, TASK-1.26 lint-dirs) were edited with recorded unlocks, stricter only. Verified: gate PASS, judge PASS round 1, npm test 101 files green, playtest and table at 100% lines. Review assumptions A-1 (literal glob) and A-2 (export deleted). Risk: threshold is combined across the six folders, not per file (J-1-01, not tracked). TASK-1.39 sandbox-timeout test hit EPERM in judge scratch copies again.
<!-- SECTION:FINAL_SUMMARY:END -->
