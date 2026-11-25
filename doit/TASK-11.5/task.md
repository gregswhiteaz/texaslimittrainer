File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-11.5 - Group-my-trends-per-session-or-per-day.md

Task TASK-11.5 - Group my trends per session or per day
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 96000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-25 09:09 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-11 - Track progress over time
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (3 direct, 46 total):
├─ TASK-3.9 - Keep a permanent record of every completed hand [completed]
│  ├─ TASK-1.15 - Show and muck cards at showdown in casino order [completed]
│  │  ├─ TASK-1.8 - Check game invariants after every playtest action [completed]
│  │  │  ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
│  │  │  │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
│  │  │  │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
│  │  │  │        ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
│  │  │  │        │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
│  │  │  │        │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
│  │  │  │        └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
│  │  │  │           └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
│  │  │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
│  │  └─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed]
│  │     └─ TASK-1.9 - Let a short-stacked player call all-in [completed]
│  │        └─ TASK-1.8 - Check game invariants after every playtest action [completed] (shown above)
│  ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed]
│  │  └─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed]
│  │     ├─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
│  │     │  ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
│  │     │  ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
│  │     │  │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
│  │     │  └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
│  │     │     ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed] (shown above)
│  │     │     ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
│  │     │     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
│  │     │     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
│  │     │        ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
│  │     │        │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
│  │     │        └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
│  │     └─ TASK-3.5 - Read big-index cards drawn in code [completed] (shown above)
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
├─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [completed]
│  ├─ TASK-2.1 - Start a game from Home through Game Config [completed]
│  │  └─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed] (shown above)
│  ├─ TASK-3.12 - Record the advice and grade for each of my decisions with the hand [completed]
│  │  ├─ TASK-3.9 - Keep a permanent record of every completed hand [completed] (shown above)
│  │  ├─ TASK-7.10 - Explain every recommendation in plain English with its numbers [completed]
│  │  │  ├─ TASK-7.6 - Recommend preflop actions at heads-up and full-ring tables [completed]
│  │  │  │  └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
│  │  │  ├─ TASK-7.8 - Recommend betting or raising for value [completed]
│  │  │  │  └─ TASK-7.5 - Estimate each opponent's range from their actions in the hand [completed]
│  │  │  │     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed] (shown above)
│  │  │  └─ TASK-7.9 - Count implied odds for drawing hands [completed]
│  │  │     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed] (shown above)
│  │  └─ TASK-7.15 - Prove advice is identical for identical decisions [completed]
│  │     ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed] (shown above)
│  │     ├─ TASK-7.4 - Grade a decision as Correct, Minor error or Major error [completed]
│  │     │  └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed] (shown above)
│  │     ├─ TASK-7.10 - Explain every recommendation in plain English with its numbers [completed] (shown above)
│  │     └─ TASK-7.13 - Adjust opponent ranges to their observed play after 30 hands [completed]
│  │        ├─ TASK-7.5 - Estimate each opponent's range from their actions in the hand [completed] (shown above)
│  │        └─ TASK-7.12 - Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD [completed] (shown above)
│  ├─ TASK-10.2 - Leave the table in the middle of a hand [completed]
│  │  └─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [completed]
│  │     ├─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed] (shown above)
│  │     ├─ TASK-3.9 - Keep a permanent record of every completed hand [completed] (shown above)
│  │     ├─ TASK-3.10 - Save the session after every hand so it can be resumed [completed]
│  │     │  └─ TASK-3.9 - Keep a permanent record of every completed hand [completed] (shown above)
│  │     └─ TASK-3.11 - Rebuy or leave when my stack runs out [completed]
│  │        ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed] (shown above)
│  │        └─ TASK-3.10 - Save the session after every hand so it can be resumed [completed] (shown above)
│  └─ TASK-10.4 - See my hands played and error rates per 100 hands in the report [completed]
│     ├─ TASK-3.12 - Record the advice and grade for each of my decisions with the hand [completed] (shown above)
│     └─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [completed] (shown above)
└─ TASK-11.4 - Filter my trends by table size and game type [completed]
   └─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [completed] (shown above)

Dependents (3 direct, 3 total):
├─ TASK-11 - Track progress over time [To Do]
├─ TASK-11.9 - See my average sit-and-go finishing position per trend group [To Do]
│  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do]
│     └─ TASK-11 - Track progress over time [To Do] (shown above)
└─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want to switch the trend grouping between per 500 hands, per session and per day, so that I can see progress in the unit that matches how I practise.

Group-by options: per 500 hands (default), per session, per day. Per session: one point for every session in the filter that has at least one stored hand, in session start order. Per day: one point for every local calendar day in the filter on which at least one hand was completed, using each hand record's completion date and time (REQ-052.7, stored by E03-S09). Both plot from the first hand on, with no minimum group size (REQ-048.10); with zero hands in the filter every grouping shows 'Play your first hand to see trends.' (the per-500 zero case is tested in E11-S01) Values use the same formulas as the per-500 grouping. The chosen grouping applies to every trend chart and keeps the current filters.

## Requirements covered
- REQ-048 (Must): Statistics screen trends — The Statistics screen shall chart the user's Major errors per 100 hands and BB/100 over all stored hands, grouped per 500 hands by default and switchable to per session or per day, filtered by table size and game type.

Covers: REQ-048

Plan key: E11-S02 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the Statistics screen, When the grouping options are listed, Then they are exactly per 500 hands, per session and per day, and per 500 hands is selected on opening [REQ-048.1]
- [ ] #2 Given a seeded data set of 3,000 hands over 9 sessions, When grouping is set to per session, Then the Major-error chart plots 9 points, each equal to that session's unhinted Major errors per 100 hands recomputed from its stored hand records [REQ-048.1]
- [ ] #3 Given seeded hands completed on 4 different local dates, including one session that runs past midnight, When grouping is set to per day, Then the chart plots 4 points and each hand counts in the date it was completed [REQ-048.1]
- [ ] #4 Given a table-size filter of 6-max is set, When the grouping is changed to per day, Then the filter stays 6-max and the points use only 6-max hands [REQ-048.1, REQ-048.2]
- [ ] #5 Given 1 stored session of 12 hands, When grouping is per session or per day, Then the Major-error chart plots 1 point computed from those 12 hands and no 'Play ... more hands' message is shown [REQ-048.10]
- [ ] #6 Given zero hands in the current filter, When grouping is per session or per day, Then the screen shows 'Play your first hand to see trends.' instead of a chart [REQ-048.10]
- [ ] #7 Given the Stats storyboard's Group by default ('Every 100 hands') and REQ-048.1's per-500 default, When this story adds Group by, Then the default matches REQ-048.1 and the storyboard is updated to match
- [ ] #8 Given per-session grouping, When the BB/100 chart is shown, Then each session's point uses TASK-11.2's bb100Value over that session's cash hands and equals that session's report BB/100

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
AC added from TASK-11.1 follow-up (doc-134): storyboard shows Every 100 hands; TASK-11.1 followed REQ-048.1 (500).

AC added from TASK-11.2 Q-1: per-session BB/100 value is implemented in TASK-11.2; this story wires the grouping UI.

