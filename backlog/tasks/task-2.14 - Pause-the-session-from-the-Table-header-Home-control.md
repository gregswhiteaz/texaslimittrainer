---
id: TASK-2.14
title: Pause the session from the Table header Home control
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T23:03:00Z'
updated_date: '2026-11-24T03:17:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-2.6
  - TASK-3.3
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-3
parent_task_id: TASK-2
priority: high
type: feature
ordinal: 66000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want a Home control in the Table header that pauses my session, so that I can step away to Home without ending the session I want to continue.

Adds a Home control to the Table header built by E03-S03 (next to Settings and Leave table); E03 does not provide it. Choosing Home pauses the session and opens Home with Resume session (E02-S08). Between hands nothing is lost. Used mid-hand, the unfinished hand is abandoned exactly as when the app is closed (REQ-004.2, REQ-004.6): it is never written, not counted in any statistic, and resuming deals a new hand with stacks as they were before it began. Home never ends the session and never creates a Session Report.

## Requirements covered
- REQ-004 (Must): Pause, resume and end a session — When the user goes Home or closes the app during a session, TLH Trainer shall keep that session as a paused session that can be resumed at the start of the next hand; when the user chooses Leave table, it shall end the session and open the Session Report.

Covers: REQ-004

Plan key: E02-S15 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the Table between hands after hand 10, When the user chooses Home in the Table header, Then Home opens with Resume session showing 10 hands and the session is not ended [REQ-004.9]
- [x] #2 Given the session was paused with the Home control after hand 10, When the user chooses Resume session, Then the Table deals hand 11 with every stack equal to its value at the end of hand 10 [REQ-004.9, REQ-004.2]
- [x] #3 Given hand 11 is in progress after 10 completed hands, When the user chooses Home in the Table header, Then Home opens with Resume session showing 10 hands and no Session Report is created [REQ-004.9]
- [x] #4 Given hand 11 was abandoned with the Home control, When the user resumes, Then a new hand 11 is dealt with every stack equal to its value at the end of hand 10 [REQ-004.9, REQ-004.2]
- [x] #5 Given hand 11 was abandoned with the Home control, When stored hand records and the style stats computed from them are read, Then no record of the abandoned hand exists and the stats equal those of hands 1 to 10 [REQ-004.9, REQ-004.6]
- [x] #6 Given the Home control on the Table header and paused sessions, When the user presses the browser Back or Forward button on Home, Game Config or the Table, Then the behaviour is decided, documented and covered by a test (e.g. history entries per screen, Back from the Table pauses to Home)
- [x] #7 Given a stored session whose nextBotName is above MAX_SESSION_COUNT (1,000,000,000), When it is read for Resume, Then parseSessionRecord rejects it with RangeError 'Invalid session record: nextBotName' and Home stays usable (no mid-session crash on a later bot bust)
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
1. Table header: 'Home' text button before Leave table (only when onHome is passed); focus moves to Home's h1
2. Home writes nothing: the stored session is the paused state; unmounting the Table abandons the hand in progress
3. tableWritesSettled(): Home waits for in-flight table writes before reading the paused session (Home control, Leave table, Back)
4. History: opening the Table pushes one keyed entry; Back on the Table pauses to Home; Forward never reopens it; in-app leave calls history.back(); docs/ui/navigation.md
5. parseSessionRecord caps nextBotName at MAX_SESSION_COUNT
6. Tests: unit/acceptance + Playwright pause flow (seeded hands 1-9, real hand 10, abandon hand 11) in Chromium and WebKit with axe

Full spec: doit/TASK-2.14/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-2.1 follow-up (doc-23).

AC added from TASK-2.6 follow-up (security MINOR next-bot-name-uncapped, doc-107).

Build: Table header Home button, tableWritesSettled before Home's read, keyed Table history entry + popstate pause, nextBotName cap; npm test 997 passed, e2e 204 passed; gate PASS

Judge r1 PASS 12/12; CI 45316910309 green on f560a64.
<!-- SECTION:NOTES:END -->
