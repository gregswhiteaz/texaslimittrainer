File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.13 - Reject-illegal-actions-without-changing-the-game.md

Task TASK-1.13 - Reject illegal actions without changing the game
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 27000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-17 23:22 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-1 - Prove the game headlessly
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 10 total):
└─ TASK-1.12 - Cap each street at one bet plus three raises [completed]
   └─ TASK-1.11 - Play heads-up hands with heads-up blinds and order [completed]
      └─ TASK-1.8 - Check game invariants after every playtest action [completed]
         ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
         │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
         │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
         │        ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
         │        │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
         │        │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
         │        └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
         │           └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
         └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)

Dependents (2 direct, 6 total):
├─ TASK-1 - Prove the game headlessly [To Do]
└─ TASK-1.17 - Prove the engine with a 1,000,000-hand invariant run [To Do]
   ├─ TASK-1 - Prove the game headlessly [To Do] (shown above)
   ├─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do]
   │  └─ TASK-5 - Play a sit-and-go [To Do]
   └─ TASK-6.9 - Prove the engine over 1,000,000 cash hands with every line-up preset [To Do]
      ├─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do] (shown above)
      └─ TASK-6 - Face distinct opponents [To Do]

Description:
--------------------------------------------------
As a learner, I want illegal actions refused by the engine, so that no hand can ever reach an impossible state.

An illegal action submitted to the engine is rejected with an error and leaves the game state unchanged. Illegal includes acting out of turn, a wrong bet amount, raising on a capped street, and folding when no bet is faced (check is free, Q-45).

## Requirements covered
- REQ-017 (Must): Legal actions only — The engine shall accept only legal actions for the player to act, and the Table screen shall offer the user only the legal actions with their exact amounts.

Covers: REQ-017

## Notes
Return a typed result (ok/error code) rather than throwing so UI and playtest handle it the same way.

Plan key: E01-S11 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given it is seat 3's turn, When seat 5 submits any action, Then the engine returns an out-of-turn error and the state is byte-identical to before [REQ-017.4]
- [ ] #2 Given preflop at $4/$8, When a player submits a bet or raise of any amount other than $4, Then the engine returns an error and the state is unchanged [REQ-017.4]
- [ ] #3 Given a capped street, When a player submits a raise, Then the engine returns an error and the state is unchanged [REQ-017.4]
- [ ] #4 Given no bet is facing the player to act, When that player submits fold, Then the engine returns an error and the state is unchanged [REQ-017.4]
- [ ] #5 Given 100,000 random game states, When an illegal action is injected into each, Then every injection is rejected and the state is byte-identical [REQ-017.4]

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

