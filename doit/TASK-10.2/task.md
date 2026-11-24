File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-10.2 - Leave-the-table-in-the-middle-of-a-hand.md

Task TASK-10.2 - Leave the table in the middle of a hand
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 80000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-19 00:21 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-10 - Read the session report
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 32 total):
└─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [completed]
   ├─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed]
   │  ├─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
   │  │  ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
   │  │  │  └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
   │  │  │     ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
   │  │  │     │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
   │  │  │     │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
   │  │  │     └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
   │  │  │        └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   │  │  ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
   │  │  │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
   │  │  └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
   │  │     ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
   │  │     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
   │  │     ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
   │  │     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
   │  │     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
   │  │        ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
   │  │        │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
   │  │        └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
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

Dependents (4 direct, 18 total):
├─ TASK-5.11 - Leave a sit-and-go early and get my finishing position [To Do]
│  └─ TASK-5 - Play a sit-and-go [To Do]
├─ TASK-10 - Read the session report [To Do]
├─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [To Do]
│  ├─ TASK-11 - Track progress over time [To Do]
│  ├─ TASK-11.2 - See my BB/100 trend from cash hands against a break-even line [To Do]
│  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do]
│  │     └─ TASK-11 - Track progress over time [To Do] (shown above)
│  ├─ TASK-11.3 - See the G-2 target line on my Major-error trend [To Do]
│  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  └─ TASK-11.11 - See whether I met the G-2 goal after 5,000 hands [To Do]
│  │     ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │     └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  ├─ TASK-11.4 - Filter my trends by table size and game type [To Do]
│  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  ├─ TASK-11.5 - Group my trends per session or per day [To Do]
│  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  ├─ TASK-11.9 - See my average sit-and-go finishing position per trend group [To Do]
│  │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  ├─ TASK-11.7 - Filter my trends by line-up [To Do]
│  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  └─ TASK-11.8 - See my style stats over my last 1,000 hands against healthy ranges [To Do]
│  │  │     ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │     └─ TASK-11.10 - See my style stats separately for each table size I played [To Do]
│  │  │        ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │        └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  └─ TASK-11.9 - See my average sit-and-go finishing position per trend group [To Do] (shown above)
│  ├─ TASK-11.5 - Group my trends per session or per day [To Do] (shown above)
│  └─ TASK-11.6 - Open Statistics or go Home from the Session Report [To Do]
│     └─ TASK-11 - Track progress over time [To Do] (shown above)
└─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do]
   └─ TASK-13 - Rely on a private offline app [To Do]

Description:
--------------------------------------------------
As a learner, I want to leave the table during a hand after confirming that my hand will be folded, so that I can stop at any moment without corrupting my session record.

Leave table while a hand is in progress (from the hand's deal until its result is shown) opens a dialog with the text "Leave now? Your hand will be folded." and Confirm / Cancel. On cancel play continues exactly as before. On confirm the user's hand is folded immediately, even when another player is to act (if the user still holds cards and is not all-in); this forced fold is not graded and is not counted in error rates or leaks, the remaining players play the hand to completion with no further user input, the hand is recorded like any completed hand (E03-S09/S10, counted in the session's hands and statistics), the session state is saved, and then the session ends and its Session Report opens (E10-S01). No further hand is dealt. Between hands Leave table needs no dialog (E10-S01).

## Requirements covered
- REQ-004 (Must): Pause, resume and end a session — When the user goes Home or closes the app during a session, TLH Trainer shall keep that session as a paused session that can be resumed at the start of the next hand; when the user chooses Leave table, it shall end the session and open the Session Report.

Covers: REQ-004

Plan key: E10-S05 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a hand in progress, When the user chooses Leave table, Then a dialog shows "Leave now? Your hand will be folded." and no action is taken for the user while it is open [REQ-004.7]
- [ ] #2 Given the leave dialog during hand 25, When the user cancels, Then the dialog closes, the user still holds the same cards and stack and the hand continues with the same player to act [REQ-004.7]
- [ ] #3 Given the leave dialog during hand 25 while the user holds cards, When the user confirms, Then the user's hand is folded, the remaining players play hand 25 to completion without user input and no hand 26 is dealt [REQ-004.7]
- [ ] #4 Given the user confirmed leaving during hand 25, When hand 25 completes, Then hand 25's record is stored, the session ends and its Session Report opens showing hands played "25" [REQ-004.7, REQ-004.5]
- [ ] #5 Given the user confirmed leaving while all-in during hand 25, When the hand completes, Then the user's cards stay in to showdown, any pot the user wins is awarded and included in the report's result [REQ-004.7]
- [ ] #6 Given a cash session whose user confirms leaving during hand 1, When hand 1 completes, Then a report with hands played "1" is shown and stored [REQ-004.7]
- [ ] #7 Given the leave dialog during hand 25 while a bot is to act and the user holds cards, When the user confirms, Then the user's hand is folded at once before that bot acts [REQ-004.8]
- [ ] #8 Given the user confirmed leaving during hand 25, When hand 25's record and the session report are read, Then the forced fold has no grade and is not counted in Major errors /100, Minor errors /100, hint usage or any leak category [REQ-004.8]
- [ ] #9 Given Leave table is chosen in the middle of a hand, When onLeave would run, Then the dialog 'Leave now? Your hand will be folded.' is shown first (REQ-004.7)

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
AC added from TASK-3.3 follow-up (doc-24).

