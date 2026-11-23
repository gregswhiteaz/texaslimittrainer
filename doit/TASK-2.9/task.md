File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-2.9 - Randomise-the-bot-line-up.md

Task TASK-2.9 - Randomise the bot line-up
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 57000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-17 23:22 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-2 - Launch and set up a session
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 26 total):
└─ TASK-2.5 - Choose a line-up preset for the bots [completed]
   ├─ TASK-2.2 - Choose how many players sit at the table [completed]
   │  ├─ TASK-1.11 - Play heads-up hands with heads-up blinds and order [completed]
   │  │  └─ TASK-1.8 - Check game invariants after every playtest action [completed]
   │  │     ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
   │  │     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
   │  │     │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
   │  │     │        ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
   │  │     │        │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
   │  │     │        │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
   │  │     │        └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
   │  │     │           └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   │  │     └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   │  ├─ TASK-2.1 - Start a game from Home through Game Config [completed]
   │  │  └─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
   │  │     ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
   │  │     ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
   │  │     │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
   │  │     └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
   │  │        ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed] (shown above)
   │  │        ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
   │  │        │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
   │  │        └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
   │  │           ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
   │  │           │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
   │  │           └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
   │  └─ TASK-7.6 - Recommend preflop actions at heads-up and full-ring tables [completed]
   │     └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
   └─ TASK-6.7 - Record an edited line-up as Custom [completed]
      └─ TASK-6.6 - Seat bots by line-up preset with unique names [completed]
         ├─ TASK-6.3 - Face a Calling station that calls where TAG would fold or raise [completed]
         │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed]
         │     └─ TASK-6.18 - Draw bot randomness only from the replay code and seat [completed]
         │        └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed] (shown above)
         ├─ TASK-6.4 - Face a Maniac that bets and raises where TAG would check or call [completed]
         │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
         └─ TASK-6.5 - Face a Rock that folds every hand outside a narrow starting range [completed]
            └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)

Dependents (1 direct, 1 total):
└─ TASK-2 - Launch and set up a session [To Do]

Description:
--------------------------------------------------
As a learner, I want to randomise every bot seat's style, so that I practise against unpredictable mixes of opponents.

Randomise line-up assigns each bot seat a style drawn at random from TAG, Calling station, Maniac and Rock, independently per seat. The resulting line-up name is resolved by E06-S07 (Custom unless it happens to equal the selected preset's assignment). Use a seeded generator in tests.

## Requirements covered
- REQ-009 (Must): Line-up presets and per-seat styles — The Game Config screen shall let the user choose a line-up preset (Mixed, Tough or Soft) and then change the style of any individual bot seat.

Covers: REQ-009

Plan key: E02-S07 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given 9 players, When the user chooses Randomise line-up, Then every one of the 8 bot rows shows one of TAG, Calling station, Maniac or Rock [REQ-009.5]
- [ ] #2 Given 1,000 seeded randomisations at 6 players, When the styles per seat are tabulated, Then every seat received each of the four styles at least once [REQ-009.5]
- [ ] #3 Given a randomised line-up that differs from the selected preset, When the user chooses Start game, Then the table's bots have the randomised styles and the session's line-up name is Custom [REQ-009.5, REQ-009.6]

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

