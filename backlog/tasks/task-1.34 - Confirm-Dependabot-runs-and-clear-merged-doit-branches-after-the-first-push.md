---
id: TASK-1.34
title: Confirm Dependabot runs and clear merged doit branches after the first push
status: To Do
assignee: []
created_date: '2026-11-19T04:51:00Z'
updated_date: '2026-11-20T01:06:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.36
references:
  - doc-30
parent_task_id: TASK-1
priority: medium
type: chore
ordinal: 194000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.24 (judge J-1-01). Dependabot and the cleanup script can only be checked against GitHub after main carrying .github/dependabot.yml is pushed. User-run verification; Claude cannot push.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given main with .github/dependabot.yml is pushed, When GitHub's Dependabot page (Insights > Dependency graph > Dependabot) is opened, Then both github-actions and npm show a successful last check with no config errors
- [ ] #2 Given the first weekly run has happened, When open pull requests are listed, Then any Dependabot PRs are grouped as configured and their CI runs
- [x] #3 Given main is pushed, When node tools/git/prune-merged-branches.js --apply is run, Then every merged doit/* branch is gone locally and on origin and a following dry run reports nothing to clean
- [x] #4 Given main carries TASK-1.36's dependabot.yml, When the next Dependabot run happens, Then no @types/node semver-major PR is opened and PR #2 is closed (by Dependabot or the user); then tick TASK-1.36 AC#1
- [x] #5 Given that run, When the npm_and_yarn update job finishes, Then it succeeds with no peer-dependency or ETARGET error and any typescript/typescript-eslint update arrives as one grouped PR; then tick TASK-1.36 AC#2
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-11-18: user ran prune --apply: deleted 26 local + 24 remote merged doit/* branches; follow-up dry run reports 0/0; only main and origin/main remain.

2026-11-19 check (gh): AC#1 not met — Dependabot github_actions update succeeded, npm_and_yarn failed (peer-dependency ETARGET on typescript/typescript-eslint; fix is TASK-1.36). AC#2 pending — first scheduled weekly run not yet happened; only PR #2 (@types/node 26 major, ungrouped as configured for majors) exists, its CI runs #69/#70 were cancelled. AC#3 done earlier. Now depends on TASK-1.36; re-check after it merges and the next Monday run.

AC#4-5 added from TASK-1.36 (Q-2): live proof of its AC#1/#2.

Dependabot run 2026-11-20T00:30Z after bf46598: github_actions success (44646369376); npm_and_yarn success (44646370481) with 0 ETARGET/peer-dependency errors; log: 'All updates for @types/node were ignored', 'All updates for typescript were ignored', 'No update needed for typescript-eslint 8.73.0'; PR #2 closed by Dependabot ('@types/node is no longer being updated'). AC#2 waits for the first scheduled Monday run that opens PRs.
<!-- SECTION:NOTES:END -->
