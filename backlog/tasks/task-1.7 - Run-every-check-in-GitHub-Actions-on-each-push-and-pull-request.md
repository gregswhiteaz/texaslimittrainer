---
id: TASK-1.7
title: Run every check in GitHub Actions on each push and pull request
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:21:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-0
dependencies:
  - TASK-1.1
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-1
priority: high
type: chore
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a project owner, I want every push and pull request checked automatically in GitHub Actions, so that a broken change is caught before it reaches main.

Built immediately after the toolchain story E01-S01 so that every later story can meet the global DoD item 'CI workflow is green on the story's branch'. GitHub Actions workflow runs lint, typecheck, tests, the build and `npm run e2e` (Playwright plus axe in Chromium and WebKit, REQ-064.4) on every push and pull request; any failing check fails the workflow. The 10,000-hand playtest step is added by E01-S08, the nightly 1,000,000-hand run by E01-S17 and deployment to GitHub Pages by E01-S18. Actor 'project owner' = the single Learner in the role of the person who builds and maintains the trainer (requirements.md has only the Learner user class).

## Requirements covered
- REQ-064 (Should): Continuous integration and deployment — On every push to GitHub, a GitHub Actions workflow shall run lint, typecheck, tests, a 10,000-hand playtest and the build, and on the main branch shall deploy the build to GitHub Pages when all pass.

Covers: REQ-064

## Notes
Cache npm dependencies; pin the Node LTS version used locally.

Plan key: E01-S02 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a push to any branch or a pull request on GitHub, When the workflow triggers, Then it runs `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` and `npm run e2e` (Playwright and axe tests in Chromium and WebKit) [REQ-064.1, REQ-064.4]
- [ ] #2 Given a push in which any one of lint, typecheck, tests or build fails, When the workflow finishes, Then the workflow is reported as failed [REQ-064.2]
- [ ] #3 Given a push in which all checks pass, When the workflow finishes, Then the workflow is reported as successful [REQ-064.2]
- [ ] #4 Given a push in which a Playwright or axe test fails in Chromium or in WebKit, When the workflow finishes, Then the workflow is reported as failed [REQ-064.4, REQ-064.2]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [ ] #2 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [ ] #3 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [ ] #4 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [ ] #5 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [ ] #6 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [ ] #7 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [ ] #8 No new network requests beyond the app's own files [REQ-058.1]
- [ ] #9 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [ ] #10 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [ ] #11 Story documentation is written and published to Backlog.md
- [ ] #12 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled
<!-- DOD:END -->
