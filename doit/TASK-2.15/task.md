File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-2.15 - Practise-with-play-money-only.md

Task TASK-2.15 - Practise with play money only
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 87000
Created: 2026-11-17 23:03 (UTC)
Updated: 2026-11-17 23:22 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-2 - Launch and set up a session
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2, doc-3

Dependency Graph:
--------------------------------------------------
Depends on (2 direct, 33 total):
├─ TASK-2.1 - Start a game from Home through Game Config [completed]
│  └─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
│     ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
│     │  └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
│     │     ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
│     │     │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
│     │     │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
│     │     └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
│     │        └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
│     ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
│     │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
│     └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
│        ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
│        │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
│        ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
│        │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
│        └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
│           ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
│           │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
│           └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
└─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [completed]
   ├─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed]
   │  ├─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed] (shown above)
   │  └─ TASK-3.5 - Read big-index cards drawn in code [completed] (shown above)
   ├─ TASK-3.9 - Keep a permanent record of every completed hand [completed]
   │  ├─ TASK-1.15 - Show and muck cards at showdown in casino order [completed]
   │  │  ├─ TASK-1.8 - Check game invariants after every playtest action [completed]
   │  │  │  ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed] (shown above)
   │  │  │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   │  │  └─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed]
   │  │     └─ TASK-1.9 - Let a short-stacked player call all-in [completed]
   │  │        └─ TASK-1.8 - Check game invariants after every playtest action [completed] (shown above)
   │  ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed]
   │  │  └─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed] (shown above)
   │  ├─ TASK-6.7 - Record an edited line-up as Custom [completed]
   │  │  └─ TASK-6.6 - Seat bots by line-up preset with unique names [completed]
   │  │     ├─ TASK-6.3 - Face a Calling station that calls where TAG would fold or raise [completed]
   │  │     │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed]
   │  │     │     └─ TASK-6.18 - Draw bot randomness only from the replay code and seat [completed]
   │  │     │        └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed] (shown above)
   │  │     ├─ TASK-6.4 - Face a Maniac that bets and raises where TAG would check or call [completed]
   │  │     │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
   │  │     └─ TASK-6.5 - Face a Rock that folds every hand outside a narrow starting range [completed]
   │  │        └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
   │  ├─ TASK-6.8 - Replace a busted bot with a new bot from the line-up preset [completed]
   │  │  └─ TASK-6.7 - Record an edited line-up as Custom [completed] (shown above)
   │  └─ TASK-7.12 - Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD [completed]
   │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed] (shown above)
   ├─ TASK-3.10 - Save the session after every hand so it can be resumed [completed]
   │  └─ TASK-3.9 - Keep a permanent record of every completed hand [completed] (shown above)
   └─ TASK-3.11 - Rebuy or leave when my stack runs out [completed]
      ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed] (shown above)
      └─ TASK-3.10 - Save the session after every hand so it can be resumed [completed] (shown above)

Dependents (1 direct, 1 total):
└─ TASK-2 - Launch and set up a session [To Do]

Description:
--------------------------------------------------
As a learner, I want every screen to deal only in play money, so that I can never be asked to deposit, pay or wager real money while training.

App-wide check, moved out of the stake story. An automated Playwright check visits every screen and dialog registered in the app's screen list (at M2: Home, Game Config, Table, Rebuy / Leave table dialog, Session Report; later epics register Statistics, Settings and their dialogs) and fails if any text or control offers a deposit, payment, purchase, cash-out, real-money wager or real-money conversion. A bundle scan confirms no payment library, Payment Request API use or payment-provider URL ships with the app. The check runs in CI with the rest of the test suite, and fails when any route or dialog in the built app is missing from the screen list, so later screens cannot escape the check.

## Requirements covered
- REQ-006 (Must): Stakes and blinds — For cash games, the Game Config screen shall offer exactly the stakes $2/$4, $3/$6, $4/$8, $6/$12, $10/$20 and $20/$40, and the engine shall post blinds of half the small bet rounded down to a whole dollar (small blind) and the small bet (big blind).
- REQ-061 (Should): Legal and content — TLH Trainer shall use play money only and shall contain only strategy text and data written for this project.

Covers: REQ-006, REQ-061

## Notes
E11/E12/E13: register Statistics, Settings and any new dialogs in the screen list the check visits.

Plan key: E02-S14 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given every screen and dialog registered in the app, When the play-money check visits each one in CI, Then none shows text or a control offering a deposit, payment, purchase, cash-out, real-money wager or real-money conversion [REQ-006.3, REQ-061.1]
- [ ] #2 Given the built app, When the play-money check compares its screen list with every route and dialog component in the app, Then the check fails naming any route or dialog that is not in the list [REQ-006.3, REQ-061.1]
- [ ] #3 Given the built bundle and package.json, When they are scanned, Then they contain no payment library, no use of the Payment Request API and no payment-provider URL [REQ-061.1]
- [ ] #4 Given a test fixture screen that shows a "Deposit" control, When the play-money check runs against it, Then the check fails and names that screen [REQ-006.3]

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

