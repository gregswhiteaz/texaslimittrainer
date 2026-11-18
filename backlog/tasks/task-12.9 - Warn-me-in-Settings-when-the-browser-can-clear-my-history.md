---
id: TASK-12.9
title: Warn me in Settings when the browser can clear my history
status: To Do
assignee: []
created_date: '2026-11-17T22:47:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-12.3
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-12
priority: medium
type: feature
ordinal: 165000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to see a warning when my history is not protected by persistent storage, so that I know the browser could clear my training history and can decide how to use the app.

E13 requests persistent storage (navigator.storage.persist) on first launch and records whether it was granted. When the recorded value is 'not granted' (including when the API is unavailable), the 'Your data' section of Settings shows a one-line warning that the browser can clear history under storage pressure. When granted, no warning is shown. Tests set the recorded flag directly.

## Requirements covered
- REQ-053 (Should): Storage capacity and failure — TLH Trainer shall keep at least 100,000 hand records, and if a storage write fails it shall stop dealing and tell the user that history could not be saved.
- REQ-057 (Should): Accessibility and usability — Every screen shall meet WCAG 2.1 AA contrast and control-labelling rules, and every grade or status shown in colour shall also be shown as text.

Covers: REQ-053, REQ-057

## Notes
Uses the flag written by E13 (same wave, so no dependency edge); read it through one settings/meta accessor.

Plan key: E12-S09 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the recorded persistent-storage result is not granted, When the Settings screen is shown, Then the Your data section shows a single-line warning that the browser can clear history under storage pressure [REQ-053.3]
- [ ] #2 Given the recorded persistent-storage result is granted, When the Settings screen is shown, Then no storage warning is shown [REQ-053.3]
- [ ] #3 Given the recorded result is not granted, When Settings is opened as the overlay from the table, Then the same one-line warning is shown [REQ-053.3]
- [ ] #4 Given the Settings screen at 1280 x 720 with the warning shown, When its layout is measured, Then the warning occupies one line of text [REQ-053.3]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 axe reports zero serious or critical violations on Settings with the storage warning shown, in Chromium and WebKit [REQ-057.1]
- [ ] #2 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [ ] #3 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [ ] #4 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [ ] #5 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [ ] #6 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [ ] #7 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [ ] #8 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [ ] #9 No new network requests beyond the app's own files [REQ-058.1]
- [ ] #10 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [ ] #11 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [ ] #12 Story documentation is written and published to Backlog.md
- [ ] #13 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled
<!-- DOD:END -->
