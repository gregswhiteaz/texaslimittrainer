---
id: TASK-1.24
title: Protect main and keep CI action pins current
status: Done
assignee:
  - '@claude'
created_date: '2026-11-18T07:03:00Z'
updated_date: '2026-11-26T00:07:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.7
references:
  - doc-6
documentation:
  - doc-30
parent_task_id: TASK-1
priority: medium
type: chore
ordinal: 169000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.7. Pushes to main are not gated on CI, the SHA-pinned actions will silently age, and merged doit/* branches pile up on the remote. Branch protection is a GitHub repo setting the user applies; the task documents and verifies it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given .github/dependabot.yml, When Dependabot runs, Then it opens weekly update PRs for github-actions and npm
- [x] #2 Given doit branches that are already merged into main, When the cleanup step in README is followed, Then they are deleted locally and on origin
- [x] #3 Given the README's branch-protection steps for main (required check = the CI job, admins exempt so direct pushes keep working), When the repository is public or on GitHub Pro and the user runs them, Then GitHub blocks merging a pull request whose CI check has not passed and the documented verify command shows the rule; until then the README states the setting is unavailable (HTTP 403) on a private free-plan repo
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. .github/dependabot.yml: weekly github-actions + npm updates (grouped), with a text test.
2. tools/git/prune-merged-branches.js: fetch --prune, list doit/* branches merged into main/origin main, dry run by default, --apply deletes locally and on origin; tested against temp repos only.
3. README: Dependabot workflow note, branch-protection gh commands (required check = CI job, admins exempt) + verify command + 403 note, cleanup steps; acceptance test pins the job name.

Full spec: doit/TASK-1.24/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Q-1 (user): AC#2 reworded to 'document now, apply later' — branch protection returns 403 on a private free-plan repo. Applying it becomes a follow-up task.

Build: dependabot.yml (weekly, grouped), tools/git/prune-merged-branches.js (dry run default, --apply deletes local+origin), README Dependency updates / Branch protection / Branch cleanup; 4 new test files; gate PASS

Judge R1 PASS 9/9. J-1-02 (AC numbering swapped) is a false alarm: judge read the pre-Q-1 task snapshot; live AC#2=cleanup, AC#3=protection match the spec. AC#1 live check (Dependabot PRs appear on GitHub) needs the user's push of main.

Follow-ups (Step 6a): TASK-1.33 apply branch protection once public/Pro; TASK-1.34 confirm Dependabot + run cleanup --apply after push; TASK-1.35 harden/tidy cleanup script (lease, missing-ref test, renames).

Locked test unlocked for TASK-1.50 Q-6 (user-approved CI split).

Locked test(s) unlocked for TASK-7.18 Q-3: one vi.setConfig({ testTimeout: 30_000 }) line added after the global testTimeout was removed; no assertion touched.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added .github/dependabot.yml (weekly grouped github-actions and npm updates), tools/git/prune-merged-branches.js (dry-run-by-default cleanup of merged doit/* branches locally and on origin) and README sections for Dependabot, branch protection and branch cleanup. Branch protection is documented but not applied: GitHub returns 403 on this private free-plan repo (Q-1). Verified: npm test 292 passed, lint and typecheck clean, judge PASS on all 9 SPEC items, review round 1 had no blocking findings, and the real-repo dry run matched git branch --merged. Please review assumptions A-1..A-8 in the doc. Follow-ups: apply branch protection once public or Pro; confirm Dependabot opens PRs after main is pushed; run the script with --apply after the push; minor fixes (force-with-lease, rename helpers, missing-ref test).
<!-- SECTION:FINAL_SUMMARY:END -->
