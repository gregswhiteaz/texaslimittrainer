---
id: TASK-1.35
title: Harden and tidy the merged-branch cleanup script
status: Done
assignee:
  - '@claude'
created_date: '2026-11-19T04:51:00Z'
updated_date: '2026-11-20T06:02:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.24
references:
  - doc-30
documentation:
  - doc-42
parent_task_id: TASK-1
priority: low
type: chore
ordinal: 195000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.24 reviews: security MINOR (remote delete without lease), code MINORs (helper name shadowing, untested missing-ref path) and a NIT (fail() does not fail).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a remote doit/* branch moves after the script lists it, When --apply runs, Then the remote delete uses --force-with-lease=<ref>:<listed sha>, is refused for that branch, and the script exits 1 naming it
- [x] #2 Given a repository with no main or no origin/main, When the script runs, Then a test proves it exits 1 with 'missing ref' and deletes nothing
- [x] #3 Given tools/git/prune-merged-branches.js, When it is read, Then the lines() helper is named outputLines and fail() is named reportError, with all tests still passing
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Record each remote branch SHA when listing; delete all in one push with --force-with-lease=refs/heads/<b>:<sha> per branch; report porcelain refusals and exit 1.
2. Pure helpers remoteDeleteArgs / refusedBranches (unit-tested).
3. Rename lines -> outputLines, fail -> reportError.
4. New acceptance tests (temp repos only): moved branch refused via a PATH git shim; missing main / origin/main exit 1 with nothing deleted.

Full spec: doit/TASK-1.35/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: leased remote deletes (SHA per branch, one porcelain push, refusals reported, exit 1), outputLines/reportError renames, hardening + lease tests in new files; gate PASS. Real git porcelain for a stale lease is '!<TAB>(delete):refs/heads/<b><TAB>[rejected] (stale info)'.

Judge R1 PASS 4/4; pre-change script deletes the moved branch (exit 0), new one refuses (exit 1).

Follow-ups (Step 6a): TASK-1.45 refspec + shared failure reporting; TASK-1.46 local timing-test flakes.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Hardened tools/git/prune-merged-branches.js: remote deletes now use --force-with-lease=refs/heads/<b>:<listed sha> in one porcelain push, so a branch that moved after listing is refused, named on stderr, and the script exits 1. Added tests for the missing main/origin/main path (exit 1, nothing deleted) and renamed lines->outputLines, fail->reportError. Verified: npm test 347 passed/6 skipped, lint and typecheck clean, judge PASS round 1, locked TASK-1.24 tests unchanged. Assumptions to review: A-1..A-3 (single porcelain push, refusal message format, PATH git shim in tests). Risks/follow-ups: refspec should use refs/heads/<b>; duplicated failure reporting; local perf tests flake under load; 271 lines vs 230 budget.
<!-- SECTION:FINAL_SUMMARY:END -->
