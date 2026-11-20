---
id: TASK-3.23
title: Tighten the card visual checks and keep the Linux baselines current
status: To Do
assignee: []
created_date: '2026-11-20T03:45:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-3.20
references:
  - doc-38
parent_task_id: TASK-3
priority: low
type: chore
ordinal: 204000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-3.20 review (MINOR, NITs) and spec scope concerns: containment gap, duplicate decode, unasserted artifact steps, baseline regeneration on Playwright bumps, and an undigested container image.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a card part with no <path>, When partsOutsideCard runs, Then it reports that part
- [ ] #2 Given the card-back logo test, When it runs, Then the image is decoded once (via logoProblems) with no inline duplicate
- [ ] #3 Given tests/ci/visual-workflow.test.ts, When it runs, Then it asserts the card-visual-baselines and card-visual-report artifact names, paths and the failure() || inputs.update condition
- [ ] #4 Given a Dependabot Playwright bump that changes rendering, When Visual goes red, Then the README documents (or a workflow automates) regenerating baselines with gh workflow run visual.yml --ref <branch> -f update=true
- [ ] #5 Given visual.yml, When it is read, Then the Playwright container image is pinned by digest with a documented way to keep it current
<!-- AC:END -->
