---
id: TASK-3.23
title: Tighten the card visual checks and keep the Linux baselines current
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-20T03:45:00Z'
updated_date: '2026-11-21T02:35:00Z'
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
- [ ] #3 Given a Dependabot Playwright bump that changes rendering, When Visual goes red, Then the README documents (or a workflow automates) regenerating baselines with gh workflow run visual.yml --ref <branch> -f update=true
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. partsOutsideCard reports a part with no <path> (paths.length === 0 guard) + test removing Qs rank paths and the 3h suit group.
2. Logo test: drop the inline decode; logoProblems already checks it.
3. README: regenerate baselines after a rendering-changing Playwright bump; unit test pins the paragraph.

Full spec: doit/TASK-3.23/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Infra ACs removed 2026-11-20 under the user's value filter (artifact-step assertions, container digest pin); trainer-test and baseline-regeneration ACs kept.

Autopilot D-1: strengthen-only edit to e2e/cards.spec.ts, unlocks recorded under TASK-3.20 and TASK-3.5.
<!-- SECTION:NOTES:END -->
