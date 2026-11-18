---
id: TASK-13.7
title: Keep my old data intact when a migration fails
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-13.6
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-13
priority: medium
type: feature
ordinal: 128000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want my existing data left untouched when a migration fails, so that a broken update never destroys my history and can be fixed by the next version.

If any migration step throws, the whole migration is rolled back so stored data stays exactly as it was before the launch, and instead of Home the app shows an error naming the failing version step (e.g. 'Could not update your data from version 2 to 3'). Home is not shown and no session can start, so nothing writes to the old data. A later build with a fixed migration migrates the same data normally.

## Requirements covered
- REQ-054 (Should): Data versioning and migration — The stored data shall carry a schema version, and when a new app version changes the schema it shall migrate existing data without loss before showing Home.

Covers: REQ-054

Plan key: E13-S05 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given version 1 data and a test build whose step 2→3 throws, When the app is launched, Then an error stating the failing step from version 2 to version 3 is shown and Home is not shown [REQ-054.3]
- [ ] #2 Given that failed launch, When the stored data is read, Then every store is byte-identical to the version 1 data before the launch and records version 1 [REQ-054.3]
- [ ] #3 Given that failed launch, When the same data is opened by a test build with a working step 2→3, Then migration completes to version 3 and Home opens [REQ-054.3]
- [ ] #4 Given the migration error screen, When it is checked, Then it offers no control that starts a session or writes data [REQ-054.3]
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
