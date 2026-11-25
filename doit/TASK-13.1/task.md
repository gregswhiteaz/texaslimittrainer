File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-13.1 - Return-Home-from-an-unexpected-error-without-losing-completed-hands.md

Task TASK-13.1 - Return Home from an unexpected error without losing completed hands
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 70000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-21 18:11 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-13 - Rely on a private offline app
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (3 direct, 34 total):
├─ TASK-2.6 - Resume a paused session from Home [completed]
│  ├─ TASK-2.1 - Start a game from Home through Game Config [completed]
│  │  └─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
│  │     ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
│  │     │  └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
│  │     │     ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
│  │     │     │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
│  │     │     │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
│  │     │     └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
│  │     │        └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
│  │     ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
│  │     │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
│  │     └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
│  │        ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
│  │        │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
│  │        ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
│  │        │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
│  │        └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
│  │           ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
│  │           │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
│  │           └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
│  └─ TASK-3.10 - Save the session after every hand so it can be resumed [completed]
│     └─ TASK-3.9 - Keep a permanent record of every completed hand [completed]
│        ├─ TASK-1.15 - Show and muck cards at showdown in casino order [completed]
│        │  ├─ TASK-1.8 - Check game invariants after every playtest action [completed]
│        │  │  ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed] (shown above)
│        │  │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
│        │  └─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed]
│        │     └─ TASK-1.9 - Let a short-stacked player call all-in [completed]
│        │        └─ TASK-1.8 - Check game invariants after every playtest action [completed] (shown above)
│        ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed]
│        │  └─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed]
│        │     ├─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed] (shown above)
│        │     └─ TASK-3.5 - Read big-index cards drawn in code [completed] (shown above)
│        ├─ TASK-6.7 - Record an edited line-up as Custom [completed]
│        │  └─ TASK-6.6 - Seat bots by line-up preset with unique names [completed]
│        │     ├─ TASK-6.3 - Face a Calling station that calls where TAG would fold or raise [completed]
│        │     │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed]
│        │     │     └─ TASK-6.18 - Draw bot randomness only from the replay code and seat [completed]
│        │     │        └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed] (shown above)
│        │     ├─ TASK-6.4 - Face a Maniac that bets and raises where TAG would check or call [completed]
│        │     │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
│        │     └─ TASK-6.5 - Face a Rock that folds every hand outside a narrow starting range [completed]
│        │        └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
│        ├─ TASK-6.8 - Replace a busted bot with a new bot from the line-up preset [completed]
│        │  └─ TASK-6.7 - Record an edited line-up as Custom [completed] (shown above)
│        └─ TASK-7.12 - Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD [completed]
│           └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed] (shown above)
├─ TASK-3.10 - Save the session after every hand so it can be resumed [completed] (shown above)
└─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [completed]
   ├─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed] (shown above)
   ├─ TASK-3.9 - Keep a permanent record of every completed hand [completed] (shown above)
   ├─ TASK-3.10 - Save the session after every hand so it can be resumed [completed] (shown above)
   └─ TASK-3.11 - Rebuy or leave when my stack runs out [completed]
      ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed] (shown above)
      └─ TASK-3.10 - Save the session after every hand so it can be resumed [completed] (shown above)

Dependents (2 direct, 2 total):
├─ TASK-13 - Rely on a private offline app [To Do]
└─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do]
   └─ TASK-13 - Rely on a private offline app [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want an error screen with Return Home when something unexpected breaks, so that I can recover and continue my session from the last completed hand.

A top-level error boundary plus window error / unhandledrejection handlers catch unexpected errors on any screen and show an error screen with a short message and a Return Home button (no stack traces). Completed hands are already stored before the next deal (REQ-052.1, E03-S09) and session state after each hand (E03-S11). Return Home leaves the session paused, so Home shows Resume session; resuming starts the hand after the last completed one with stacks as at its end, exactly like closing the app mid-hand (REQ-004.2). The unfinished hand is not stored. Tests use a test build with an error-injection hook (e.g. throw during a bot action or while rendering the Session Report).

## Requirements covered
- REQ-056 (Must): Reliability and invariants — The engine shall complete 1,000,000 headless hands across all table sizes, game types and line-ups with zero invariant violations, and the app shall recover from an unexpected error without losing completed hands.
- REQ-057 (Should): Accessibility and usability — Every screen shall meet WCAG 2.1 AA contrast and control-labelling rules, and every grade or status shown in colour shall also be shown as text.

Covers: REQ-056, REQ-057

## Notes
E10-S01 discards 0-hand sessions: an error during hand 1 leaves no Resume entry.

Plan key: E13-S02 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a test build that throws an unexpected error during a bot action in hand 15, When the error occurs, Then an error screen with a message and a Return Home button replaces the table [REQ-056.3]
- [ ] #2 Given the error screen after an error in hand 15, When the user chooses Return Home, Then Home opens and shows Resume session with hands played 14 [REQ-056.3]
- [ ] #3 Given the user returned Home after an error in hand 15, When the user chooses Resume session, Then hand 15 is dealt fresh with every stack as at the end of hand 14 and hand records 1 to 14 are all stored and unchanged [REQ-056.3]
- [ ] #4 Given a test build that throws while the Session Report screen renders, When the error occurs, Then the error screen with Return Home is shown and Return Home opens Home [REQ-056.3]
- [ ] #5 Given the error screen is shown, When its text is read, Then it contains no stack trace or source file names and Return Home is a native button reachable with Tab [REQ-056.3, REQ-057.2]
- [ ] #6 Given the advice worker fails (error/messageerror or a rejected bot decision), When the table is waiting on it, Then the unexpected-error path shows and Return Home works without losing completed hands
- [ ] #7 Given the shared advice worker has failed, When the user returns Home and starts a new game, Then a fresh worker is created and bots act normally without a page reload

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
AC added from TASK-3.6 follow-up (worker failure has no UI yet)

AC added from TASK-3.6 judge J-1-01 (shared worker stays failed)

