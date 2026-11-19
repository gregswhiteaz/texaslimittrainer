---
id: TASK-1.24
title: Protect main and keep CI action pins current
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-18T07:03:00Z'
updated_date: '2026-11-19T04:43:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.7
references:
  - doc-6
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
- [ ] #1 Given .github/dependabot.yml, When Dependabot runs, Then it opens weekly update PRs for github-actions and npm
- [ ] #2 Given doit branches that are already merged into main, When the cleanup step in README is followed, Then they are deleted locally and on origin
- [ ] #3 Given the README's branch-protection steps for main (required check = the CI job, admins exempt so direct pushes keep working), When the repository is public or on GitHub Pro and the user runs them, Then GitHub blocks merging a pull request whose CI check has not passed and the documented verify command shows the rule; until then the README states the setting is unavailable (HTTP 403) on a private free-plan repo
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
<!-- SECTION:NOTES:END -->
