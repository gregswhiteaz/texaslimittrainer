File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-3.13 - Play-at-Rapid-or-Realistic-bot-pace.md

Task TASK-3.13 - Play at Rapid bot pace
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 34000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-19 01:10 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-3 - Play hands at the table
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 15 total):
└─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed]
   └─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed]
      ├─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
      │  ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
      │  │  └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
      │  │     ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
      │  │     │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
      │  │     │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
      │  │     └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
      │  │        └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
      │  ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
      │  │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
      │  └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
      │     ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
      │     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
      │     ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
      │     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
      │     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
      │        ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
      │        │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
      │        └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
      └─ TASK-3.5 - Read big-index cards drawn in code [completed] (shown above)

Dependents (5 direct, 18 total):
├─ TASK-2.11 - Choose Rapid or Realistic speed for the session [To Do]
│  ├─ TASK-2 - Launch and set up a session [To Do]
│  └─ TASK-12.5 - Choose the default speed for new sessions in Settings [To Do]
│     ├─ TASK-12 - Tune the trainer [To Do]
│     └─ TASK-12.4 - Delete all my data after confirming [To Do]
│        └─ TASK-12 - Tune the trainer [To Do] (shown above)
├─ TASK-3 - Play hands at the table [To Do]
├─ TASK-3.18 - Play at Realistic bot pace [To Do]
│  ├─ TASK-2.11 - Choose Rapid or Realistic speed for the session [To Do] (shown above)
│  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  ├─ TASK-3.15 - Change speed during a session from the table [To Do]
│  │  ├─ TASK-3 - Play hands at the table [To Do] (shown above)
│  │  └─ TASK-3.17 - Operate every table control with native buttons and large targets [To Do]
│  │     └─ TASK-3 - Play hands at the table [To Do] (shown above)
│  ├─ TASK-4.2 - See a bot's in-style speech bubble after a table event [To Do]
│  │  ├─ TASK-4 - Follow the action at a glance [To Do]
│  │  ├─ TASK-4.8 - Keep bot banter rare and free of hidden information [To Do]
│  │  │  └─ TASK-4 - Follow the action at a glance [To Do] (shown above)
│  │  └─ TASK-12.8 - Turn bot banter off [To Do]
│  │     ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│  │     └─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│  ├─ TASK-4.6 - Watch deals and chip moves animate without slowing my play [To Do]
│  │  └─ TASK-4 - Follow the action at a glance [To Do] (shown above)
│  └─ TASK-12.3 - Open Settings over the table without pausing the session [To Do]
│     ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│     ├─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│     ├─ TASK-12.6 - Turn off automatic opening of the Hand Review panel [To Do]
│     │  ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│     │  └─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│     ├─ TASK-12.7 - Switch to a four-colour deck [To Do]
│     │  ├─ TASK-12 - Tune the trainer [To Do] (shown above)
│     │  └─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│     └─ TASK-12.9 - Warn me in Settings when the browser can clear my history [To Do]
│        └─ TASK-12 - Tune the trainer [To Do] (shown above)
├─ TASK-4.2 - See a bot's in-style speech bubble after a table event [To Do] (shown above)
└─ TASK-4.6 - Watch deals and chip moves animate without slowing my play [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want bots to act at Rapid pace, so that I can practise many hands per hour.

Moved to M2 by Q-99 so G-5 is testable early. Rapid: each bot action is displayed within 300 ms of the previous action. In M2 every session plays at Rapid (the speed choice is E02-S11, the Settings default E12, Realistic pace E03-S18, in-session change E03-S14, all M3). G-5 fit (REQ-024 fit criterion): at Rapid with the review panel not opening and the user folding every hand, 200 hands complete in under 60 minutes.

## Requirements covered
- REQ-011 (Should): Speed choice — The Game Config screen shall let the user choose Rapid or Realistic speed, defaulting to the speed set in Settings.
- REQ-024 (Must): Between hands — When a hand ends, TLH Trainer shall show the result, and shall deal the next hand only after the user clicks Deal next hand if the Hand Review panel is open, or automatically after 1.5 seconds if it is not.

Covers: REQ-011, REQ-024

Plan key: E03-S13 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given Rapid speed in a timed 6-max session, When consecutive bot actions are measured, Then each bot action is displayed within 300 ms of the previous action [REQ-011.1]
- [ ] #2 Given Rapid speed at a 10-player table where the user folds preflop, When the remaining nine players' actions are measured, Then no bot action is displayed later than 300 ms after the previous action [REQ-011.1]
- [ ] #3 Given Rapid speed, the Hand Review panel not opening and a scripted user folding every hand, When an automated run plays 200 hands, Then they complete in under 60 minutes [REQ-024.6]
- [ ] #4 Given Rapid pace, When bots act in sequence, Then a test fails if any bot action is delayed by an artificial wait (e.g. 400 ms) rather than acting on the next scheduler tick
- [ ] #5 Given the pace check, When hands per hour are measured, Then the 1.5 s between-hands delay (fixed for every speed, TASK-3.4 D-6) is included

Definition of Done:
--------------------------------------------------
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

Implementation Notes:
--------------------------------------------------
AC added from TASK-3.1 follow-up (doc-21).

AC added from TASK-3.4 follow-up (doc-25).

