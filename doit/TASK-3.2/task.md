File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-3.2 - Choose-only-legal-actions-with-their-exact-amounts.md

Task TASK-3.2 - Choose only legal actions with their exact amounts
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 16000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-17 23:22 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-0
Parent: TASK-3 - Play hands at the table
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 13 total):
└─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
   ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
   │  └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
   │     ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
   │     │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
   │     │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
   │     └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
   │        └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
   │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
   └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
      ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
      │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
      ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
      │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
      └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
         ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
         │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
         └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)

Dependents (4 direct, 16 total):
├─ TASK-3 - Play hands at the table [To Do]
├─ TASK-3.7 - Act correctly on capped streets and when short of chips [To Do]
│  └─ TASK-3 - Play hands at the table [To Do] (shown above)
├─ TASK-3.17 - Operate every table control with native buttons and large targets [To Do]
│  └─ TASK-3 - Play hands at the table [To Do] (shown above)
└─ TASK-8.1 - Ask for a hint and see the recommended action with its numbers and reason [To Do]
   ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do]
   │  └─ TASK-5 - Play a sit-and-go [To Do]
   ├─ TASK-8 - Ask for a hint [To Do]
   ├─ TASK-8.2 - Mark a decision as hinted when I open the hint [To Do]
   │  └─ TASK-8 - Ask for a hint [To Do] (shown above)
   ├─ TASK-8.3 - Get the hint card within one second [To Do]
   │  ├─ TASK-8 - Ask for a hint [To Do] (shown above)
   │  └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do]
   │     └─ TASK-13 - Rely on a private offline app [To Do]
   ├─ TASK-8.4 - See approximate and short-stack labels on the hint card [To Do]
   │  └─ TASK-8 - Ask for a hint [To Do] (shown above)
   ├─ TASK-13.4 - Use every screen offline after the first visit [To Do]
   │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
   │  ├─ TASK-13.8 - Get new versions at the next launch, never mid-session [To Do]
   │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
   │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do]
   │  │     └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
   │  └─ TASK-13.9 - Reach Home within 3 seconds on a repeat launch [To Do]
   │     ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
   │     └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do] (shown above)
   └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want an action bar that offers only my legal actions labelled with their exact amounts, so that I learn the fixed-limit betting structure and can never make an illegal move.

When no bet faces the user: Check and Bet $<small or big bet>, no Fold (Q-45). Preflop in an unraised pot the big blind is offered Check and "Raise to $8" (at $4/$8), no Fold (REQ-017.6). When a bet faces the user: Fold, Call $<amount> and Raise to $<amount>. Bet and raise sizes follow fixed-limit rules ($4 preflop and flop, $8 turn and river at $4/$8). The bar is disabled while it is not the user's turn. Actions are taken by mouse or touch only: no single-key keyboard shortcuts. Each action button is at least 44 x 44 CSS px. The offered set must always equal the engine's legal set. Capped streets and all-in labels (including short all-in bets and raises, REQ-017.7) are E03-S06. Replaces the plain buttons of the tracer E03-S01. The 44 x 44 px check for action buttons lives here; E03-S17 measures the other Table controls.

## Requirements covered
- REQ-017 (Must): Legal actions only — The engine shall accept only legal actions for the player to act, and the Table screen shall offer the user only the legal actions with their exact amounts.
- REQ-022 (Must): Action bar — When it is the user's turn, the Table screen shall show an action bar of buttons labelled with the action and its exact amount, plus a Hint button, operated by mouse or touch.

Covers: REQ-017, REQ-022

Plan key: E03-S02 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given it is the user's turn on the flop at $4/$8 with no bet facing, When the action bar is shown, Then it offers exactly Check and "Bet $4" and no Fold [REQ-017.1, REQ-022.1]
- [ ] #2 Given it is the user's turn preflop at $4/$8 facing the $4 big blind, When the action bar is shown, Then it offers exactly Fold, "Call $4" and "Raise to $8" [REQ-017.2, REQ-022.1]
- [ ] #3 Given it is the user's turn on the turn at $4/$8 facing a bet of $8, When the action bar is shown, Then it offers Fold, "Call $8" and "Raise to $16" [REQ-017.2, REQ-022.1]
- [ ] #4 Given the user is the big blind at $4/$8 preflop and every other player has called or folded, When the action bar is shown, Then it offers exactly Check and "Raise to $8" and no Fold [REQ-017.6, REQ-022.1]
- [ ] #5 Given 10,000 seeded table states where it is the user's turn, When the action bar is built, Then the offered actions and amounts equal the engine's legal actions for the user in every state [REQ-017.1, REQ-017.2, REQ-017.6]
- [ ] #6 Given it is a bot's turn or the hand has ended, When the user clicks any action button, Then the buttons are disabled and no action is submitted [REQ-017.5]
- [ ] #7 Given it is the user's turn with focus on the page body, When the keys F, C, R, H, K, B and Space are pressed, Then no action is taken [REQ-022.3]
- [ ] #8 Given the action bar at a 1280 x 720 window, When each action button is measured, Then it is at least 44 x 44 CSS px [REQ-022.4]

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

