File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-2.5 - Choose-a-line-up-preset-for-the-bots.md

Task TASK-2.5 - Choose a line-up preset for the bots
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 53000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-22 16:14 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-2 - Launch and set up a session
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (2 direct, 25 total):
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

Dependents (4 direct, 12 total):
├─ TASK-2 - Launch and set up a session [To Do]
├─ TASK-2.8 - Change the style of one bot seat [To Do]
│  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  └─ TASK-2.10 - Pre-fill Game Config from my last session [To Do]
│     ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│     ├─ TASK-12.4 - Delete all my data after confirming [To Do]
│     │  └─ TASK-12 - Tune the trainer [To Do]
│     └─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do]
│        ├─ TASK-13 - Rely on a private offline app [To Do]
│        ├─ TASK-13.7 - Keep my old data intact when a migration fails [To Do]
│        │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│        │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do]
│        │     └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│        └─ TASK-13.8 - Get new versions at the next launch, never mid-session [To Do]
│           ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│           └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
├─ TASK-2.9 - Randomise the bot line-up [To Do]
│  └─ TASK-2 - Launch and set up a session [To Do] (shown above)
└─ TASK-2.13 - Sit at a random seat with a random starting button [To Do]
   └─ TASK-2 - Launch and set up a session [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want to pick the Mixed, Tough or Soft line-up, so that I face the kind of opponents I want to practise against.

Game Config's Opponents section offers the presets Mixed, Tough and Soft (Mixed on first use) and lists one row per bot seat (players - 1 rows), in clockwise order starting with the first bot seat clockwise from the user, with the bot's display name and style, using the E06-S06 line-up module: Mixed cycles TAG, Calling station, Maniac, Rock over the bot seats; Tough is all TAG except one Maniac in the first bot seat clockwise from the user (heads-up: one TAG); Soft alternates Calling station and Rock (REQ-009.1, REQ-009.8). Names are unique within the table. Rows update when the players count changes. Start game resolves the line-up through E06-S07 and the table seats exactly the listed bots.

## Requirements covered
- REQ-009 (Must): Line-up presets and per-seat styles — The Game Config screen shall let the user choose a line-up preset (Mixed, Tough or Soft) and then change the style of any individual bot seat.
- REQ-012 (Could): Remember last configuration — When the Game Config screen opens, TLH Trainer shall pre-fill every field with the values used for the most recently started session.

Covers: REQ-009, REQ-012

Plan key: E02-S05 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a fresh install, When Game Config opens, Then the Mixed preset is selected and the five bot rows, listed clockwise from the user, show TAG, Calling station, Maniac, Rock, TAG [REQ-012.2, REQ-009.1]
- [ ] #2 Given 9 players and the Tough preset, When the bot rows are shown, Then there are 8 rows, the first bot seat clockwise from the user is the only Maniac and every other row is TAG [REQ-009.1, REQ-009.8]
- [ ] #3 Given 6 players, When the user switches from 6 to 4 players with the Soft preset, Then 3 rows are shown styled Calling station, Rock, Calling station [REQ-009.1]
- [ ] #4 Given 2 players and the Tough preset, When the bot row is shown, Then the single bot is TAG [REQ-009.7]
- [ ] #5 Given any preset at 10 players, When the bot rows are shown, Then no two rows share a display name [REQ-009.4]
- [ ] #6 Given the Soft preset at 6 players, When the user chooses Start game, Then the table's bots have the names and styles listed on Game Config and the session's line-up name is Soft [REQ-009.1, REQ-009.6]
- [ ] #7 Given Game Config at any table size from 2 to 10, When Start game builds the session with lineUpSessionConfig, Then the button passed is a seat at that table (1..players) so Start game never throws — e.g. heads-up with the default button 6

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
AC added from TASK-6.7 follow-up (lineUpSessionConfig rejects an invalid button, A-4)

