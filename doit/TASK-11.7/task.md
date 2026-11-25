File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-11.7 - Filter-my-trends-by-line-up.md

Task TASK-11.7 - Filter my trends by line-up
==================================================

Status: ◒ In Progress
Priority: High
Type: feature
Ordinal: 98000
Assignee: @claude
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-25 14:29 (UTC)
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
├─ TASK-6.7 - Record an edited line-up as Custom [completed] (shown above)
└─ TASK-11.4 - Filter my trends by table size and game type [completed]
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

Dependents (2 direct, 4 total):
├─ TASK-11 - Track progress over time [To Do]
└─ TASK-11.8 - See my style stats over my last 1,000 hands against healthy ranges [To Do]
   ├─ TASK-11 - Track progress over time [To Do] (shown above)
   └─ TASK-11.10 - See my style stats separately for each table size I played [To Do]
      ├─ TASK-11 - Track progress over time [To Do] (shown above)
      └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do]
         └─ TASK-11 - Track progress over time [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want to filter my trends by the line-up I played against, so that I can judge results against the same opponents (G-3).

Line-up filter: All (default), Mixed, Tough, Soft, Custom, matching the line-up name stored on each session and hand record (preset or Custom, resolved by E06-S07). Applies to every chart, totals and the empty-state message, together with the table-size and game-type filters.

## Requirements covered
- REQ-048 (Must): Statistics screen trends — The Statistics screen shall chart the user's Major errors per 100 hands and BB/100 over all stored hands, grouped per 500 hands by default and switchable to per session or per day, filtered by table size and game type.

Covers: REQ-048

Plan key: E11-S08 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the Statistics screen, When the line-up filter options are listed, Then they are exactly All, Mixed, Tough, Soft and Custom, and All is selected on opening [REQ-048.8]
- [ ] #2 Given stored sessions with Mixed, Tough and Custom line-ups, When the line-up filter is Custom, Then only hands from the Custom sessions are counted in the charts and totals [REQ-048.8, REQ-048.6]
- [ ] #3 Given line-up Mixed and table size 6-max filters together, When the charts are shown, Then every point equals the value recomputed from hands that are both Mixed and 6-max [REQ-048.8, REQ-048.2]
- [ ] #4 Given no stored Soft sessions, When the line-up filter is Soft, Then the screen shows 'Play your first hand to see trends.' and totals of 0 hands over 0 sessions [REQ-048.8, REQ-048.10]
- [ ] #5 Given any line-up filter, When the Major-error chart is shown, Then its G-2 target line is computed from all stored hands (statisticsView(filtered, all)), not from the filtered set

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
AC added (moved from TASK-11.8, where TASK-11.3 Q-1 put it by mistake).

