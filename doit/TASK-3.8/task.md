File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-3.8 - See-each-side-pot-and-who-wins-it.md

Task TASK-3.8 - See each side pot and who wins it
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 33000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-19 01:10 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-3 - Play hands at the table
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (2 direct, 18 total):
├─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed]
│  └─ TASK-1.9 - Let a short-stacked player call all-in [completed]
│     └─ TASK-1.8 - Check game invariants after every playtest action [completed]
│        ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
│        │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
│        │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
│        │        ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
│        │        │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
│        │        │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
│        │        └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
│        │           └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
│        └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
└─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed]
   └─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed]
      ├─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
      │  ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
      │  ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
      │  │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
      │  └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
      │     ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed] (shown above)
      │     ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
      │     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
      │     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
      │        ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
      │        │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
      │        └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
      └─ TASK-3.5 - Read big-index cards drawn in code [completed] (shown above)

Dependents (2 direct, 6 total):
├─ TASK-3 - Play hands at the table [To Do]
└─ TASK-4.5 - See each player's bet as chips in front of their seat [To Do]
   ├─ TASK-4 - Follow the action at a glance [To Do]
   ├─ TASK-4.6 - Watch deals and chip moves animate without slowing my play [To Do]
   │  └─ TASK-4 - Follow the action at a glance [To Do] (shown above)
   └─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do]
      └─ TASK-5 - Play a sit-and-go [To Do]

Description:
--------------------------------------------------
As a learner, I want to see every side pot with its winner, so that I understand why a short-stacked all-in wins only part of the pot.

When side pots exist the table shows each pot amount separately (main pot plus side pots) instead of a single total, and the result lists the winner and amount of each pot. Side pot construction and award are engine rules (E01-S13).

## Requirements covered
- REQ-021 (Must): Table display — The Table screen shall show, for every seat, the player name, style label (unless hidden in Settings), stack, chips put in on the current street, last action and whether the player still holds cards, together with the board, the pot total, the dealer button and which player is to act.
- REQ-024 (Must): Between hands — When a hand ends, TLH Trainer shall show the result, and shall deal the next hand only after the user clicks Deal next hand if the Hand Review panel is open, or automatically after 1.5 seconds if it is not.

Covers: REQ-021, REQ-024

Plan key: E03-S07 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a three-way all-in where the stacks put in are $20, $60 and $60, When the betting ends, Then the table shows a main pot of $60 and a side pot of $80 separately [REQ-021.5]
- [ ] #2 Given the short stack wins the main pot and another player wins the side pot, When the hand ends, Then the result shows each winner with the pot they won and its amount [REQ-024.1, REQ-021.5]
- [ ] #3 Given a hand with no all-in, When the table is shown, Then a single pot total is shown [REQ-021.5]
- [ ] #4 Given side pots, When the hand result is shown, Then there is one result line per pot from result.awards

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
AC added from TASK-3.4 follow-up (doc-25).

