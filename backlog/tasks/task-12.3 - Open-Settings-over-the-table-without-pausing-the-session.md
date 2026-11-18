---
id: TASK-12.3
title: Open Settings over the table without pausing the session
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-12.2
  - TASK-3.10
  - TASK-3.4
  - TASK-4.9
  - TASK-3.18
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-12
priority: medium
type: feature
ordinal: 138000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to open Settings from the Table header as an overlay, so that I can change an option mid-session without leaving or pausing my game.

The Table header (E03-S03) gets a Settings control. It opens the same Settings content as an overlay above the table; the session is neither paused (no Resume entry is created, unlike the header Home control of REQ-004.9) nor ended (no report). While the overlay is open play is frozen: bots do not act, the auto-deal timer (E03-S04) and the session clock (E04-S09) pause; closing the overlay resumes from the same point, so the table returns to exactly the same state. Changes made in the overlay apply from the next screen update (e.g. hiding style labels takes effect as soon as the overlay closes or immediately behind it). The overlay is a modal dialog: focus moves into it and returns to the Settings control on close.

## Requirements covered
- REQ-050 (Should): Settings options — The Settings screen shall offer default speed, auto-open Hand Review, show opponent styles and four-colour deck, and each change shall take effect immediately and persist across launches.
- REQ-057 (Should): Accessibility and usability — Every screen shall meet WCAG 2.1 AA contrast and control-labelling rules, and every grade or status shown in colour shall also be shown as text.

Covers: REQ-050, REQ-057

Plan key: E12-S03 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a session during the user's turn on the turn street, When the user chooses Settings in the Table header, Then Settings is shown as an overlay above the table and the table remains rendered behind it [REQ-050.5, REQ-050.7]
- [ ] #2 Given the overlay was opened during the user's turn on the turn street, When the user closes it, Then the same hand number, street, board, stacks, pot and seat to act are shown, the user is still to act and no action was taken for the user [REQ-050.7]
- [ ] #3 Given the Settings overlay is open over a session, When the stored session is read, Then its status is active (not paused, not ended) and no Session Report exists for it [REQ-050.7]
- [ ] #4 Given style labels are shown and the overlay is open mid-hand, When the user turns 'Show opponent styles' off and closes the overlay, Then the table shows no style labels without waiting for the next hand [REQ-050.5]
- [ ] #5 Given the overlay is open, When the user presses Tab repeatedly, Then focus stays within the overlay; and When the overlay closes, Then focus returns to the Settings control in the Table header [REQ-050.7, REQ-057.2]
- [ ] #6 Given bot Ben is about to act at Realistic speed, When the user opens the Settings overlay and keeps it open for 10 s, Then no bot acts while it is open; When the overlay closes, Then Ben's action follows with the normal pacing from that point [REQ-050.8]
- [ ] #7 Given a hand ended with the Hand Review panel closed and 0.5 s of the 1.5 s auto-deal delay elapsed, When the user opens the overlay for 10 s and then closes it, Then no hand is dealt while it is open and the next hand is dealt 1.0 s after closing [REQ-050.8]
- [ ] #8 Given the header session clock shows 12:00 of playing time, When the overlay is open for 60 s and then closed, Then the clock still shows 12:00 on closing and the stored elapsed playing time excludes those 60 s [REQ-050.8]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 axe reports zero serious or critical violations on the table with the Settings overlay open, in Chromium and WebKit [REQ-057.1]
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
