---
id: TASK-1.43
title: >-
  Lift the temporary Dependabot major-version ignores when they are no longer
  needed
status: To Do
assignee: []
created_date: '2026-11-20T00:29:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.36
references:
  - doc-36
parent_task_id: TASK-1
priority: low
type: chore
ordinal: 203000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.36 (security MINOR, code MINOR). The semver-major ignores for @types/node and typescript are an interim workaround: they also suppress major-only security PRs. They should be removed once typescript-eslint supports the next TypeScript major or the project moves off Node 22, and the pinning test should match the block exactly.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given .github/dependabot.yml, When it is read, Then a comment next to each major-version ignore names this task and the condition for removing it
- [ ] #2 Given typescript-eslint publishes support for the next TypeScript major (or .nvmrc/engines move off Node 22), When that is noticed, Then the matching ignore is removed and the test updated
- [ ] #3 Given the TASK-1.36 assertion in tests/ci/dependabot.acceptance.test.ts (approved cross-story edit, unlock under TASK-1.24), When it runs, Then it compares the whole npm groups/ignore tail to the exact expected block instead of fragments
<!-- AC:END -->
