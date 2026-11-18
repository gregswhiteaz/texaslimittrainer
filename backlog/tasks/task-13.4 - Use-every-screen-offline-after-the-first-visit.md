---
id: TASK-13.4
title: Use every screen offline after the first visit
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-1.18
  - TASK-8.1
  - TASK-9.1
  - TASK-10.1
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-13
priority: medium
type: feature
ordinal: 110000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want every screen to work with no network after installing, so that I can train anywhere, including on a plane.

A service worker (scope = the deployed base path) precaches every file in the build output at install: HTML, JS bundles including the advice and bot Web Workers, CSS, strategy data (charts, ranges, golden-spot data if loaded at runtime), banter lines, the logo and icons, and the manifest. The precache list is generated from the build output, so screens added later (Statistics, Settings, sit-and-go) are cached without changing this story; their own offline behaviour is guaranteed by the precache-completeness check (AC4). All app requests are served from the cache when offline. The app makes no other requests (REQ-058). Playwright runs with the network disabled after a first online load.

## Requirements covered
- REQ-063 (Should): Test commands — The project shall provide npm scripts that run each check with one command.
- REQ-065 (Should): Install, offline and updates — After the first visit, TLH Trainer shall run fully offline, and when a newer version is deployed it shall apply the update at the next launch and tell the user which version they are on.

Covers: REQ-063, REQ-065

## Notes
Statistics (E11), Settings (E12) and sit-and-go (E05) are in the same wave and are not exercised here by name; they are covered because the precache list is generated from the build output (AC4).

Plan key: E13-S07 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the app was loaded once online and the service worker is active, When the network is disabled and the app is relaunched, Then the splash loads the rules engine and strategy data and Home opens [REQ-065.1, REQ-063.4]
- [ ] #2 Given the network is disabled, When the user starts a 6-max cash game, plays 20 hands using Hint and the Hand Review panel and leaves the table, Then Game Config, the Table, the hint card, the Hand Review panel and the Session Report all open, hints and reviews show their numbers and the report is saved [REQ-065.1]
- [ ] #3 Given the network is disabled, When a session of 20 hands is played, Then the Playwright network log shows zero failed requests and every app request was answered by the service worker cache [REQ-065.1]
- [ ] #4 Given `npm run build`, When the generated precache list is compared with the files in the build output, Then every app file (HTML, JS including worker bundles, CSS, strategy and banter data, logo, icons, manifest) is in the list and the check fails naming any file that is missing [REQ-065.1, REQ-063.4]
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
