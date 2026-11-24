---
id: TASK-2.7
title: Confirm ending a paused session before starting a new game
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-24T18:15:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-2.6
  - TASK-10.1
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-2
priority: high
type: feature
ordinal: 71000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to be asked before a new game ends my paused session, so that I never lose a paused session by accident.

At most one paused session exists. When the user chooses Start game on Game Config while a paused session exists, a dialog asks the user to confirm ending the paused session. Confirm ends the paused session through the same session-end operation as Leave table (E10 saves its Session Report; a 0-hand session is discarded, REQ-044.8) and then starts the new session. Cancel closes the dialog and changes nothing: the paused session stays as stored and no new session starts. The confirmation is asked on Start game, not on New game, so cancelling Game Config never ends the paused session.

## Requirements covered
- REQ-004 (Must): Pause, resume and end a session — When the user goes Home or closes the app during a session, TLH Trainer shall keep that session as a paused session that can be resumed at the start of the next hand; when the user chooses Leave table, it shall end the session and open the Session Report.

Covers: REQ-004

## Notes
Report saving belongs to E10's session-end operation (E10-S01, REQ-044.7); this story calls it.

Plan key: E02-S09 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a paused session exists, When the user chooses Start game on Game Config, Then a dialog asks the user to confirm ending the paused session and no new session has started [REQ-004.4]
- [ ] #2 Given the confirmation dialog, When the user confirms, Then the paused session is ended, its Session Report is saved and the new session starts [REQ-004.4]
- [ ] #3 Given the confirmation dialog, When the user cancels, Then the paused session is stored unchanged, no new session exists and Game Config still shows the chosen values [REQ-004.4]
- [ ] #4 Given a paused session and a confirmed new game, When storage is read after the new game's first hand, Then exactly one session is not ended and it is the new one [REQ-004.1]
- [ ] #5 Given no paused session exists, When the user chooses Start game, Then no confirmation dialog is shown and the session starts [REQ-004.4]
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
1. Start game re-reads storage at click time (after tableWritesSettled); no paused session → Table opens as today
2. Paused session → confirmation dialog inside Game Config (endPrompt prop; values kept); Cancel/Escape change nothing
3. Confirm → endPausedSessions: confirmed session ended now (report saved, or removed if 0 hands); other valid unended sessions ended at their updatedAt; then the Table opens; exactly one session not ended afterwards
4. Tests: unit/store, render, e2e confirm/cancel/no-dialog flows in Chromium and WebKit with axe

Full spec: doit/TASK-2.7/spec.md
<!-- SECTION:PLAN:END -->
