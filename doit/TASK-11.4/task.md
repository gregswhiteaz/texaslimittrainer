File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-11.4 - Filter-my-trends-by-table-size-and-game-type.md

Task TASK-11.4 - Filter my trends by table size and game type
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 95000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-25 11:42 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-11 - Track progress over time
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 45 total):
└─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [completed]
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
   ├─ TASK-3.12 - Record the advice and grade for each of my decisions with the hand [completed]
   │  ├─ TASK-3.9 - Keep a permanent record of every completed hand [completed]
   │  │  ├─ TASK-1.15 - Show and muck cards at showdown in casino order [completed]
   │  │  │  ├─ TASK-1.8 - Check game invariants after every playtest action [completed]
   │  │  │  │  ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed] (shown above)
   │  │  │  │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   │  │  │  └─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed]
   │  │  │     └─ TASK-1.9 - Let a short-stacked player call all-in [completed]
   │  │  │        └─ TASK-1.8 - Check game invariants after every playtest action [completed] (shown above)
   │  │  ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed]
   │  │  │  └─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed]
   │  │  │     ├─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed] (shown above)
   │  │  │     └─ TASK-3.5 - Read big-index cards drawn in code [completed] (shown above)
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
   │  └─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [completed]
   │     ├─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed] (shown above)
   │     ├─ TASK-3.9 - Keep a permanent record of every completed hand [completed] (shown above)
   │     ├─ TASK-3.10 - Save the session after every hand so it can be resumed [completed]
   │     │  └─ TASK-3.9 - Keep a permanent record of every completed hand [completed] (shown above)
   │     └─ TASK-3.11 - Rebuy or leave when my stack runs out [completed]
   │        ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed] (shown above)
   │        └─ TASK-3.10 - Save the session after every hand so it can be resumed [completed] (shown above)
   └─ TASK-10.4 - See my hands played and error rates per 100 hands in the report [completed]
      ├─ TASK-3.12 - Record the advice and grade for each of my decisions with the hand [completed] (shown above)
      └─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [completed] (shown above)

Dependents (4 direct, 7 total):
├─ TASK-11 - Track progress over time [To Do]
├─ TASK-11.5 - Group my trends per session or per day [To Do]
│  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  ├─ TASK-11.9 - See my average sit-and-go finishing position per trend group [To Do]
│  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do]
│  │     └─ TASK-11 - Track progress over time [To Do] (shown above)
│  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
├─ TASK-11.7 - Filter my trends by line-up [To Do]
│  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  └─ TASK-11.8 - See my style stats over my last 1,000 hands against healthy ranges [To Do]
│     ├─ TASK-11 - Track progress over time [To Do] (shown above)
│     └─ TASK-11.10 - See my style stats separately for each table size I played [To Do]
│        ├─ TASK-11 - Track progress over time [To Do] (shown above)
│        └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
└─ TASK-11.9 - See my average sit-and-go finishing position per trend group [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want to filter my trends by table size and game type, so that I can compare like with like.

Filters: table size All, Heads-up, 6-max, Full ring, by reference size (REQ-005.4: 2 -> Heads-up; 3-7 -> 6-max; 8-10 -> Full ring); game type All, Cash, Sit-and-go. Default All / All. Filters apply to every chart, the totals line and the empty-state messages ('Play <n> more hands...' for 1-499 hands, 'Play your first hand to see trends.' for 0). Line-up filter is E11-S08.

## Requirements covered
- REQ-048 (Must): Statistics screen trends — The Statistics screen shall chart the user's Major errors per 100 hands and BB/100 over all stored hands, grouped per 500 hands by default and switchable to per session or per day, filtered by table size and game type.

Covers: REQ-048

## Notes
Reuse the E07/E10 table-size -> reference-size mapping; do not duplicate it.

Plan key: E11-S03 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the Statistics screen, When the filter options are listed, Then table size offers exactly All, Heads-up, 6-max and Full ring and game type offers exactly All, Cash and Sit-and-go, each defaulting to All [REQ-048.2]
- [ ] #2 Given stored hands at table sizes 2, 4, 6, 8 and 10, When the table size filter is 6-max, Then only hands from 4- and 6-player sessions are counted; and When it is Full ring, Then only hands from 8- and 10-player sessions are counted [REQ-048.2]
- [ ] #3 Given 2,000 cash hands and 600 sit-and-go hands, When the game type filter is Sit-and-go, Then the Major-error chart's points equal values recomputed from the 600 sit-and-go hands only [REQ-048.2]
- [ ] #4 Given 1,840 hands over 9 sessions of which 700 hands over 3 sessions are heads-up, When the table size filter is Heads-up, Then the totals read 700 hands over 3 sessions [REQ-048.6, REQ-048.2]
- [ ] #5 Given 300 heads-up hands among 3,000 stored hands, When the table size filter is Heads-up, Then the screen shows 'Play 200 more hands to see your first trend point.' instead of a chart [REQ-048.7, REQ-048.2]
- [ ] #6 Given the game-type filter set to Sit-and-go or All, When the BB/100 chart is shown, Then it uses TASK-11.2's cash-only BB/100 functions (no-cash message for Sit-and-go; cash hands only for All)
- [ ] #7 Given any table-size or game-type filter, When the Major-error chart is shown, Then its G-2 target line is computed from all stored hands (statisticsView(filtered, all)), not from the filtered set
- [ ] #8 Given a filter that leaves the Major chart in its 'more hands' or 'no hands' state while 1,000+ hands are stored, When Statistics is shown, Then no G-2 caption, target line or aria-label suffix appears (a test pins this)

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
AC added from TASK-11.2 Q-1: TASK-11.2 implements the filter cases as pure functions; this story wires the select to them.

AC added from TASK-11.3 Q-1.

AC added from TASK-11.3 follow-up (doc-136).

