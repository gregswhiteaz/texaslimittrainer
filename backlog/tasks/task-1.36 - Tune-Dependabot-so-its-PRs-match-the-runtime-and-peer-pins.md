---
id: TASK-1.36
title: Tune Dependabot so its PRs match the runtime and peer pins
status: To Do
assignee: []
created_date: '2026-11-19T04:55:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.24
references:
  - doc-30
parent_task_id: TASK-1
priority: medium
type: chore
ordinal: 196000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from the first Dependabot run after TASK-1.24 (2026-11-19): it opened PR #2 bumping @types/node 22.20.5 -> 26.6.6 although the app runs on Node 22, and its npm job failed updating typescript because typescript-eslint is a peer that must move with it (ETARGET for @typescript-eslint/eslint-plugin@8.73.0 inside the cooldown window). Revisits assumption A-3 (no ignore rules).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given .github/dependabot.yml, When Dependabot evaluates @types/node, Then it ignores semver-major updates so @types/node stays on the Node major used by CI and engines (22)
- [ ] #2 Given a new typescript release, When Dependabot runs, Then typescript and typescript-eslint packages are updated in the same grouped PR (or typescript waits until typescript-eslint supports it) and the npm update job completes without a peer-dependency error
- [ ] #3 Given the config change, When tests/ci/dependabot.acceptance.test.ts runs, Then it pins the @types/node ignore rule and the typescript grouping
<!-- AC:END -->
