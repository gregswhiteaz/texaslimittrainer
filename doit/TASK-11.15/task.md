File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-11.15 - Make-the-report-navigation-tests-robust-on-macOS-keyboard-settings-and-trim-duplication.md

Task TASK-11.15 - Make the report navigation tests robust on macOS keyboard settings and trim duplication
==================================================

Status: ◒ In Progress
Priority: Low
Ordinal: 246000
Assignee: @claude
Created: 2026-11-25 14:22 (UTC)
Updated: 2026-11-28 00:25 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-11 - Track progress over time
References: doc-139

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 46 total):
└─ TASK-11.6 - Open Statistics or go Home from the Session Report [completed]
   ├─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [completed]
   │  ├─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed]
   │  │  ├─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
   │  │  │  ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
   │  │  │  │  └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
   │  │  │  │     ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
   │  │  │  │     │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
   │  │  │  │     │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
   │  │  │  │     └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
   │  │  │  │        └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   │  │  │  ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
   │  │  │  │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
   │  │  │  └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
   │  │  │     ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
   │  │  │     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
   │  │  │     ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
   │  │  │     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
   │  │  │     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
   │  │  │        ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
   │  │  │        │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
   │  │  │        └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
   │  │  └─ TASK-3.5 - Read big-index cards drawn in code [completed] (shown above)
   │  ├─ TASK-3.9 - Keep a permanent record of every completed hand [completed]
   │  │  ├─ TASK-1.15 - Show and muck cards at showdown in casino order [completed]
   │  │  │  ├─ TASK-1.8 - Check game invariants after every playtest action [completed]
   │  │  │  │  ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed] (shown above)
   │  │  │  │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   │  │  │  └─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed]
   │  │  │     └─ TASK-1.9 - Let a short-stacked player call all-in [completed]
   │  │  │        └─ TASK-1.8 - Check game invariants after every playtest action [completed] (shown above)
   │  │  ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed]
   │  │  │  └─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed] (shown above)
   │  │  ├─ TASK-6.7 - Record an edited line-up as Custom [completed]
   │  │  │  └─ TASK-6.6 - Seat bots by line-up preset with unique names [completed]
   │  │  │     ├─ TASK-6.3 - Face a Calling station that calls where TAG would fold or raise [completed]
   │  │  │     │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed]
   │  │  │     │     └─ TASK-6.18 - Draw bot randomness only from the replay code and seat [completed]
   │  │  │     │        └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed] (shown above)
   │  │  │     ├─ TASK-6.4 - Face a Maniac that bets and raises where TAG would check or call [completed]
   │  │  │     │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
   │  │  │     └─ TASK-6.5 - Face a Rock that folds every hand outside a narrow starting range [completed]
   │  │  │        └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
   │  │  ├─ TASK-6.8 - Replace a busted bot with a new bot from the line-up preset [completed]
   │  │  │  └─ TASK-6.7 - Record an edited line-up as Custom [completed] (shown above)
   │  │  └─ TASK-7.12 - Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD [completed]
   │  │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed] (shown above)
   │  ├─ TASK-3.10 - Save the session after every hand so it can be resumed [completed]
   │  │  └─ TASK-3.9 - Keep a permanent record of every completed hand [completed] (shown above)
   │  └─ TASK-3.11 - Rebuy or leave when my stack runs out [completed]
   │     ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed] (shown above)
   │     └─ TASK-3.10 - Save the session after every hand so it can be resumed [completed] (shown above)
   └─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [completed]
      ├─ TASK-2.1 - Start a game from Home through Game Config [completed]
      │  └─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed] (shown above)
      ├─ TASK-3.12 - Record the advice and grade for each of my decisions with the hand [completed]
      │  ├─ TASK-3.9 - Keep a permanent record of every completed hand [completed] (shown above)
      │  ├─ TASK-7.10 - Explain every recommendation in plain English with its numbers [completed]
      │  │  ├─ TASK-7.6 - Recommend preflop actions at heads-up and full-ring tables [completed]
      │  │  │  └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
      │  │  ├─ TASK-7.8 - Recommend betting or raising for value [completed]
      │  │  │  └─ TASK-7.5 - Estimate each opponent's range from their actions in the hand [completed]
      │  │  │     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed] (shown above)
      │  │  └─ TASK-7.9 - Count implied odds for drawing hands [completed]
      │  │     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed] (shown above)
      │  └─ TASK-7.15 - Prove advice is identical for identical decisions [completed]
      │     ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed] (shown above)
      │     ├─ TASK-7.4 - Grade a decision as Correct, Minor error or Major error [completed]
      │     │  └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed] (shown above)
      │     ├─ TASK-7.10 - Explain every recommendation in plain English with its numbers [completed] (shown above)
      │     └─ TASK-7.13 - Adjust opponent ranges to their observed play after 30 hands [completed]
      │        ├─ TASK-7.5 - Estimate each opponent's range from their actions in the hand [completed] (shown above)
      │        └─ TASK-7.12 - Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD [completed] (shown above)
      ├─ TASK-10.2 - Leave the table in the middle of a hand [completed]
      │  └─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [completed] (shown above)
      └─ TASK-10.4 - See my hands played and error rates per 100 hands in the report [completed]
         ├─ TASK-3.12 - Record the advice and grade for each of my decisions with the hand [completed] (shown above)
         └─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from TASK-11.6 review/judge (doc-139). e2e/report-navigation.spec.ts presses Alt+Tab in WebKit everywhere and its comment says WebKit needs it in general; it is a macOS Full Keyboard Access setting, so the test could fail on a Mac with that setting on. tests/ui/report-navigation.acceptance.test.tsx:67-74 repeats a check the loop already makes.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the WebKit Tab-order step, When it runs on Linux CI and on macOS with or without Full Keyboard Access, Then it passes (Alt+Tab only where needed) and its comment states the macOS cause
- [ ] #2 Given e2e/back-focus.spec.ts, e2e/settings.spec.ts and e2e/error-recovery.spec.ts, When their WebKit Tab steps run, Then they use the same buttonTabKey helper instead of a hard-coded WebKit Alt+Tab, their comments name the macOS Full Keyboard Access cause, and no assertion is changed

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

Implementation Notes:
--------------------------------------------------
AC#2 dropped 2026-11-28 (user decision): the duplicate placement check in the locked tests/ui/report-navigation.acceptance.test.tsx:67-74 stays — deleting assertions from a locked test is refused by the safeguard and the check is harmless.

AC#2 added 2026-11-28 (Q-2, user: include the other three files).

Locked e2e edits unlocked under owners: report-navigation (TASK-11.6), back-focus (TASK-12.10), settings (TASK-12.1, 12.10, 12.2), error-recovery (TASK-13.1).

