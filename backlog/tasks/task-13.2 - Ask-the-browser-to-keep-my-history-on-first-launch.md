---
id: TASK-13.2
title: Ask the browser to keep my history on first launch
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-25T18:25:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-3.9
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-13
priority: high
type: feature
ordinal: 86000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want the app to request persistent storage when I first launch it, so that the browser does not silently clear my training history under storage pressure.

On first launch (no stored record of a previous request) the app calls navigator.storage.persist() once and stores the result (granted true/false) in the local app-meta store. If the API is missing or the call rejects, the result is stored as not granted. E12-S09 shows a Settings warning when the stored result is not granted. Stored in IndexedDB next to the stores created by E03-S09.

## Requirements covered
- REQ-052 (Must): Local persistence — TLH Trainer shall store settings, last configuration, sessions, hand records and session reports in the browser's IndexedDB, writing each hand record when its hand ends.

Covers: REQ-052

## Notes
Reset all data (E12) clears stores; on the next launch the request is made again because no record exists.

Plan key: E13-S01 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a fresh install in Chromium, When the app is launched, Then navigator.storage.persist is called exactly once and its result is stored as the persistent-storage flag [REQ-052.4]
- [ ] #2 Given a test browser in which navigator.storage.persist resolves false, When the app is launched the first time, Then the stored flag is not granted [REQ-052.4]
- [ ] #3 Given a test browser in which navigator.storage.persist is undefined or rejects, When the app is launched the first time, Then the stored flag is not granted and Home opens [REQ-052.4]
- [ ] #4 Given the flag was stored on first launch, When the app is closed and relaunched, Then navigator.storage.persist is not called again and the stored flag is unchanged [REQ-052.4]
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. DB v5 adds a meta store; read/write the {granted} record under 'persistentStorage'; readPersistentStorage() for TASK-12.9
2. On first launch (main.tsx, after render) call navigator.storage.persist() once and store granted = result === true; never rejects, never blocks Home
3. Missing API, rejection or non-true result stored as not granted; read/write failures logged
4. Re-pin locked DB-version/store-name tests and e2e helpers to v5; e2e with persist() stubbed by init scripts

Full spec: doit/TASK-13.2/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: DB v5 adds an empty meta store (additive; tested upgrade from v4 with hands, sessions, reports, settings); requestPersistenceOnce on first launch stores {granted} and never rejects; readPersistentStorage for TASK-12.9; six version/store-name pins re-pinned (Q-1). Full e2e 357 pass; gate PASS.
<!-- SECTION:NOTES:END -->
