File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-2.2 - Choose-how-many-players-sit-at-the-table.md

Task TASK-2.2 - Choose how many players sit at the table
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 41000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-21 05:18 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-2 - Launch and set up a session
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (3 direct, 17 total):
├─ TASK-1.11 - Play heads-up hands with heads-up blinds and order [completed]
│  └─ TASK-1.8 - Check game invariants after every playtest action [completed]
│     ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
│     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
│     │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
│     │        ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
│     │        │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
│     │        │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
│     │        └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
│     │           └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
│     └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
├─ TASK-2.1 - Start a game from Home through Game Config [completed]
│  └─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
│     ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
│     ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
│     │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
│     └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
│        ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed] (shown above)
│        ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
│        │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
│        └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
│           ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
│           │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
│           └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
└─ TASK-7.6 - Recommend preflop actions at heads-up and full-ring tables [completed]
   └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)

Dependents (2 direct, 13 total):
├─ TASK-2 - Launch and set up a session [To Do]
└─ TASK-2.5 - Choose a line-up preset for the bots [To Do]
   ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
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
As a learner, I want to choose a table of 2 to 10 players including me, so that I can practise heads-up, short-handed and full-ring play.

Game Config offers the players options 2, 3, 4, 5, 6, 7, 8, 9 and 10 (including the user), labelled 2 (heads-up), 6 (6-max) and 10 (full ring) as in the Config storyboard. Mapping to reference sizes: 2 -> heads-up; 3, 4, 5, 6, 7 -> 6-max; 8, 9, 10 -> full ring. Sizes 2, 6, 9, 10 are exact; for 3, 4, 5, 7 and 8 the screen states that advice will be approximate and names the reference size used. Start game seats the user plus (size - 1) bots; heads-up rules come from E01-S09, the heads-up and full-ring charts from E07-S05.

## Requirements covered
- REQ-005 (Must): Choose game type and table size — The Game Config screen shall let the user choose the game type (Cash game or Sit-and-go) and the number of players from 2 to 10 including the user.
- REQ-015 (Must): Heads-up blinds and order — While exactly two players are dealt in, the engine shall make the button post the small blind and act first preflop and last on the flop, turn and river.

Covers: REQ-005, REQ-015

Plan key: E02-S02 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given Game Config, When the players options are listed, Then they are exactly the integers 2 to 10 [REQ-005.2]
- [ ] #2 Given Game Config, When the user selects 3, 4, 5 or 7 players, Then the screen states that advice will be approximate and names 6-max as the reference size [REQ-005.3, REQ-005.4]
- [ ] #3 Given Game Config, When the user selects 8 players, Then the screen states that advice will be approximate and names full ring as the reference size [REQ-005.3, REQ-005.4]
- [ ] #4 Given Game Config, When the user selects 2, 6, 9 or 10 players, Then no approximate-advice notice is shown [REQ-005.3, REQ-005.4]
- [ ] #5 Given each size from 2 to 10 selected, When the user chooses Start game, Then the table seats the user and exactly size minus 1 bots and the header shows that number of players [REQ-005.2]
- [ ] #6 Given 2 players selected on Game Config, When the first hand of the started session is dealt, Then the button posts the small blind and the other player the big blind [REQ-015.1]
- [ ] #7 Given the player-count selector, When the user picks a table size, Then it writes SessionConfig.players and seats, replaces the read-only 'Players at the table' row, and the heads-up and full-ring size labels are either reachable and tested or removed
- [ ] #8 Given table sizes 2-5 and 7-10, When position names are shown, Then they are confirmed against the requirements' naming (TASK-3.3 A-2 rule: Button, Small blind, Big blind, Cutoff, Hijack, Under the gun, Under the gun +1, ...) with a test per size
- [ ] #9 Given a player count other than 6 is selectable, When a hand with user decisions ends, Then gradeView works at that table size (no positionOf throw) and review tests cover 2 and 10 players
- [ ] #10 Given TABLE_SIZE_NAMES, When table sizes are offered, Then every entry is used by the size choice or removed (no unused names)
- [ ] #11 Given a 2-player table, When the seats are labelled, Then the button seat shows 'Small blind' (button) and the other seat 'Big blind', matching the engine's heads-up blinds (src/table/table-view.ts positionName)

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
AC added from TASK-2.1 follow-up (doc-23).

AC added from TASK-3.3 follow-up (doc-24).

AC added from TASK-9.1 follow-up (doc-26).

AC added from TASK-2.18 follow-up (doc-50, TASK-2.1 review NIT).

AC added from TASK-1.11 follow-up (heads-up position labels)

