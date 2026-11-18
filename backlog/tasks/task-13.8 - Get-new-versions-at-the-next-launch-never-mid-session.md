---
id: TASK-13.8
title: Get new versions at the next launch, never mid-session
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-13.4
  - TASK-13.6
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-13
priority: medium
type: feature
ordinal: 129000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want new versions applied only when I next launch the app, so that an update never changes the app in the middle of my session.

When a newer version is deployed, the service worker downloads it in the background while the app runs; the new version waits and is activated only on the next launch (no skipWaiting while a client is open; no forced reload). On the first launch of the new version, migrations run first (E13-S04), then Home shows 'Updated to version <x>' (the version string from E12-S01) once; the last-run version is stored in app meta so the notice is not repeated.

## Requirements covered
- REQ-065 (Should): Install, offline and updates — After the first visit, TLH Trainer shall run fully offline, and when a newer version is deployed it shall apply the update at the next launch and tell the user which version they are on.

Covers: REQ-065

## Notes
E2E: serve build N, load, deploy build N+1 to the same origin, assert the waiting worker, relaunch.

Plan key: E13-S08 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given version N is running with a session at the table and version N+1 is deployed, When the service worker detects it, Then N+1 is downloaded in the background and the running app stays on version N with no reload until it is closed [REQ-065.2]
- [ ] #2 Given version N+1 was downloaded during a session, When the user plays 10 more hands, Then every hand is played by version N and the session continues without interruption [REQ-065.2]
- [ ] #3 Given version N+1 was downloaded, When the app is closed and launched again, Then version N+1 runs and Settings shows its version [REQ-065.2]
- [ ] #4 Given the first launch of version N+1 after an update from N, When Home opens, Then it shows "Updated to version N+1" with the actual version number [REQ-065.3]
- [ ] #5 Given the update notice was shown once, When the app is launched again on the same version, Then Home does not show the notice [REQ-065.3]
- [ ] #6 Given a fresh install of version N+1 with no earlier version, When Home opens, Then no update notice is shown [REQ-065.3]
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
