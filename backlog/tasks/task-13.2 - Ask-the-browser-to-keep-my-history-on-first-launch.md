---
id: TASK-13.2
title: Ask the browser to keep my history on first launch
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-25T18:42:00Z'
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
  - doc-144
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
- [x] #1 Given a fresh install in Chromium, When the app is launched, Then navigator.storage.persist is called exactly once and its result is stored as the persistent-storage flag [REQ-052.4]
- [x] #2 Given a test browser in which navigator.storage.persist resolves false, When the app is launched the first time, Then the stored flag is not granted [REQ-052.4]
- [x] #3 Given a test browser in which navigator.storage.persist is undefined or rejects, When the app is launched the first time, Then the stored flag is not granted and Home opens [REQ-052.4]
- [x] #4 Given the flag was stored on first launch, When the app is closed and relaunched, Then navigator.storage.persist is not called again and the stored flag is unchanged [REQ-052.4]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [x] #2 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [x] #3 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [x] #4 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [x] #5 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [x] #6 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [x] #7 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [x] #8 No new network requests beyond the app's own files [REQ-058.1]
- [x] #9 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [x] #10 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [x] #11 Story documentation is written and published to Backlog.md
- [x] #12 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled
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

Judge r1 PASS 11/11, no findings: real upgrade from a main-build v4 profile (played hands, report, paused session, changed setting) to v5 — all data byte-identical, meta store holds {granted}; Resume, Statistics and Settings work; persist stubs (true/false/reject/throw/missing/never-settling) never block Home and are asked once across reloads; full e2e 357 pass. CI 45675284876 green.

Follow-ups: TASK-12.4 AC (Delete all clears meta); TASK-12.9 note (read via readPersistentStorage, warn on null).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
On first launch the app now calls navigator.storage.persist() once and stores {granted} in a new IndexedDB meta store (DB v5, key 'persistentStorage'); missing API, rejection or non-true result means not granted, and relaunch doesn't ask again. Verified: npm test 1410 pass, e2e 357 pass (Chromium+WebKit), judge PASS 11/11 incl. real v4->v5 upgrade. Review: assumptions A-1..A-7 and Q-1 (format). Follow-ups: TASK-12.9 should warn on null too; E12 Reset all data must clear meta. Minor: duplicated unit test, scope 693 vs 520 lines.
<!-- SECTION:FINAL_SUMMARY:END -->
