---
id: TASK-4.9
title: See my session's playing time and hands-per-hour pace in the header
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-3.3
  - TASK-3.10
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-4
priority: low
type: feature
ordinal: 137000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a player, I want to see my session's elapsed playing time with its hands-per-hour pace, so that I can see my progress toward 200 hands an hour (G-5).

The Table header (E03-S03) shows the session's elapsed playing time and hands-per-hour pace. Elapsed time counts only time spent at the table, excluding time while the session is paused (app closed or user went Home, REQ-004). Elapsed time is stored with the session state (E03-S11) so a resumed session continues from it (resume flow is E02). Pace = hands completed / elapsed hours, shown once 10 hands are complete. The Session Report total (REQ-072.3) is E10 and reads the stored elapsed time.

## Requirements covered
- REQ-072 (Could): Session clock and pace — The Table header shall show the session's elapsed playing time and its hands-per-hour pace.

Covers: REQ-072

## Notes
Use a monotonic clock while the table is shown; persist elapsed milliseconds after each hand and when the app is hidden/closed.

Plan key: E04-S09 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a new session, When 5 minutes pass at the table, Then the header shows an elapsed time of 5 minutes [REQ-072.1]
- [ ] #2 Given a session with 20 minutes of elapsed playing time at the end of hand 30, When the app is closed for 2 hours and the session is resumed, Then the header shows an elapsed time of 20 minutes, not 2 hours 20 minutes [REQ-072.1]
- [ ] #3 Given a session at the end of hand 30, When the stored session is read, Then it holds the elapsed playing time at that moment [REQ-072.1]
- [ ] #4 Given 9 hands are complete, When the header is shown, Then no hands-per-hour value is shown [REQ-072.2]
- [ ] #5 Given 10 hands completed in an elapsed time of 5 minutes, When the header is shown, Then it shows a pace of 120 hands per hour [REQ-072.2]
- [ ] #6 Given 50 hands completed in 15 minutes of play before a 1-hour pause and 15 minutes after it, When the header is shown, Then it shows a pace of 100 hands per hour [REQ-072.1, REQ-072.2]
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
