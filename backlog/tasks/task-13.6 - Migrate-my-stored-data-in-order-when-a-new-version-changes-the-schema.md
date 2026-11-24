---
id: TASK-13.6
title: Migrate my stored data in order when a new version changes the schema
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-24T09:39:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-3.9
  - TASK-3.10
  - TASK-10.1
  - TASK-2.12
  - TASK-2.10
  - TASK-4.3
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-13
priority: medium
type: feature
ordinal: 127000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want my stored history migrated to each new schema version at launch, so that app updates never wipe or corrupt my training history.

Every local store records its schema version: settings (E12), last configuration (E02-S10), sessions incl. the paused session (E03-S11), hand records (E03-S09), session reports (E10), UI preferences such as the action-log collapse state (E04-S02) and app meta (persistent-storage flag, last-run app version). At launch, while the splash shows (E02-S12) and before Home, the app compares stored versions with the current ones and runs each registered migration step in order (N to N+1, N+1 to N+2, ...). A store already at the current version runs no migration. Fit: a fixture of version N data migrates to N+1 with record counts and recomputed statistics unchanged.

## Requirements covered
- REQ-054 (Should): Data versioning and migration — The stored data shall carry a schema version, and when a new app version changes the schema it shall migrate existing data without loss before showing Home.

Covers: REQ-054

## Notes
IndexedDB's versionchange transaction is atomic: run all steps inside it so a failure rolls everything back (E13-S05). Each new app version that changes a store must add a migration step and a fixture test.

Plan key: E13-S04 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a fresh install, When the app has launched, Then each store (settings, last configuration, sessions, hand records, session reports, UI preferences, app meta) records a schema version equal to the current version [REQ-054.1]
- [ ] #2 Given a fixture of version 1 data with 1,000 hand records, 5 sessions and 4 reports and a test build at version 3 with migrations 1→2 and 2→3, When the app is launched, Then step 1→2 runs before step 2→3, each runs exactly once, and every store records version 3 [REQ-054.2, REQ-054.1]
- [ ] #3 Given the migrated fixture, When record counts and the style stats, BB/100 and error rates are recomputed, Then the counts are 1,000, 5 and 4 and every value equals the value computed before migration [REQ-054.2]
- [ ] #4 Given stores already at the current version, When the app is launched, Then no migration step runs and Home opens [REQ-054.2]
- [ ] #5 Given a test build whose migrations run while the splash is shown, When the app is launched with version 1 data, Then Home opens only after all steps have completed [REQ-054.2]
- [ ] #6 Given a stored hand record written before TASK-3.12 (no decisions field), When the schema migration runs, Then the record gains a decisions list consistent with its actions (or is marked unreviewable) so parseHandRecord accepts it and no completed hand is lost from history or stats
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
AC added from TASK-3.12 follow-up (doc-113, Q-4: such records are rejected on read until migrated).
<!-- SECTION:NOTES:END -->
