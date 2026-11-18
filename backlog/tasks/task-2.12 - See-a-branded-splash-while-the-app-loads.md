---
id: TASK-2.12
title: See a branded splash while the app loads
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-18T20:51:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-2.1
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-2
priority: medium
type: feature
ordinal: 113000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to see a branded splash screen while the app loads, so that I know the app is starting and reach Home without extra clicks.

On launch the splash shows the TLH logo (brand/tlh-logo.jpg) and a loading indicator until the rules engine and strategy data (charts, ranges) have loaded, then opens Home with no click or key press. If loading fails, the splash shows an error message and a Retry button that restarts loading. Test with a test build in which the strategy data is unloadable. Launch-time limit (REQ-055.4) and migration errors (REQ-054.3) are E13.

## Requirements covered
- REQ-001 (Should): Splash screen on launch — When the app launches, TLH Trainer shall show the splash screen with the TLH logo until the rules engine and strategy data have loaded, then open the Home screen without user input.
- REQ-060 (Should): Compatibility and look — TLH Trainer shall run and install as a PWA in the latest two major versions of Chrome and Safari on macOS at window sizes of 1280 × 720 and larger, using the branded dark theme.
- REQ-061 (Should): Legal and content — TLH Trainer shall use play money only and shall contain only strategy text and data written for this project.

Covers: REQ-001, REQ-060, REQ-061

Plan key: E02-S12 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the app is launched, When the rules engine and strategy data are loading, Then the splash shows the TLH logo image and a loading indicator [REQ-001.1, REQ-061.3, REQ-060.3]
- [ ] #2 Given the splash, When loading completes, Then the Home screen opens with no click or key press [REQ-001.2]
- [ ] #3 Given a test build with unloadable strategy data, When the app is launched, Then the splash shows an error message and a Retry button and Home does not open [REQ-001.3]
- [ ] #4 Given the load error is shown and the strategy data has become loadable, When the user chooses Retry, Then loading restarts and Home opens without further input [REQ-001.3]
- [ ] #5 Given the load error is shown and the strategy data is still unloadable, When the user chooses Retry, Then loading restarts and the error message and Retry are shown again [REQ-001.3]
- [ ] #6 Given the splash and Home screens, When they show the logo, Then they reuse src/assets/tlh-logo.jpg and add no other copy of the logo image
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-3.5 follow-up (doc-20).
<!-- SECTION:NOTES:END -->
