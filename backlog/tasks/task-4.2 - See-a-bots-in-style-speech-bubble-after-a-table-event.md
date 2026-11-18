---
id: TASK-4.2
title: See a bot's in-style speech bubble after a table event
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-3.13
  - TASK-6.8
  - TASK-3.18
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-4
priority: low
type: feature
ordinal: 120000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a player, I want to see bots occasionally say a short line that fits their style after table events, so that the table feels like a live game with characters.

Banter is on by default; the Settings toggle "Bot banter" (REQ-071.5) is E12. Trigger events: the bot wins a pot of 10 big bets or more ($80 or more at $4/$8), the bot loses at showdown, the bot is raised, a new player sits down; when a new bot sits down, the new bot is the one that speaks (REQ-071.7). Each style (TAG, Calling station, Maniac, Rock) has its own authored set of at least 10 original lines that never insult the user. A bubble shows for 3 seconds at Realistic and 1.5 seconds at Rapid and never covers the action bar or the user's cards. Frequency limit and no-leak rules are E04-S08.

## Requirements covered
- REQ-071 (Could): Bot banter — Where banter is turned on in Settings, a bot shall occasionally show a short, original speech-bubble line matching its style after table events, at most once per 10 hands per bot.

Covers: REQ-071

## Notes
Banter choice must use its own seeded generator, never the bots' decision generator, so bot actions stay reproducible (E06-S02). Banter is UI-side: the engine emits events, the table chooses lines.

Plan key: E04-S07 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a 1,000-hand seeded 6-max Mixed session with banter on, When every bubble is logged with the event before it, Then each bubble follows one of: the bot won a pot of 10 big bets or more, the bot lost at showdown, the bot was raised, a new player sat down; each of the four events triggers at least one bubble, and every bubble that follows a new player sitting down is spoken by the bot that just sat down [REQ-071.1, REQ-071.7]
- [ ] #2 Given a bot wins an uncontested $72 pot at $4/$8 (9 big bets) and no other trigger event occurs in the hand, When the hand ends, Then that bot shows no bubble [REQ-071.1]
- [ ] #3 Given a bot wins an uncontested $80 pot at $4/$8 (exactly 10 big bets), has not spoken in the last 10 hands and the banter generator is seeded to speak on that event, When the hand ends, Then that bot shows a bubble [REQ-071.1]
- [ ] #4 Given the banter line files, When they are loaded, Then TAG, Calling station, Maniac and Rock each have at least 10 lines, and a file with fewer than 10 lines fails validation naming the style [REQ-071.2]
- [ ] #5 Given a bot of each style speaks, When the bubble text is read, Then it is one of that style's lines [REQ-071.2]
- [ ] #6 Given Realistic speed, When a bubble appears, Then it is visible for 3 seconds (2.9-3.1 s); and Given Rapid speed, Then it is visible for 1.5 seconds (1.4-1.6 s) [REQ-071.3]
- [ ] #7 Given tables of 2 to 10 seats at 1280 x 720 during the user's turn, When a bubble shows at each bot seat, Then its bounding box does not intersect the action bar or the user's hole cards [REQ-071.3]
- [ ] #8 Given seat 3's bot Cal busts, is replaced by a new bot Gus, no bot has spoken in the last 10 hands and the banter generator is seeded to speak on the sit-down event, When the next hand is dealt, Then Gus shows a bubble and no other bot shows a bubble for that event [REQ-071.7]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Every banter line is reviewed: original text written for this project, matches its style, and does not insult the user [REQ-071.2]
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
