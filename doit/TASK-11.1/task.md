File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-11.1 - See-my-Major-errors-per-100-hands-trend-on-the-Statistics-screen.md

Task TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 81000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-24 19:27 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-11 - Track progress over time
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (4 direct, 44 total):
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

Dependents (6 direct, 12 total):
├─ TASK-11 - Track progress over time [To Do]
├─ TASK-11.2 - See my BB/100 trend from cash hands against a break-even line [To Do]
│  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do]
│     └─ TASK-11 - Track progress over time [To Do] (shown above)
├─ TASK-11.3 - See the G-2 target line on my Major-error trend [To Do]
│  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  └─ TASK-11.11 - See whether I met the G-2 goal after 5,000 hands [To Do]
│     ├─ TASK-11 - Track progress over time [To Do] (shown above)
│     └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
├─ TASK-11.4 - Filter my trends by table size and game type [To Do]
│  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  ├─ TASK-11.5 - Group my trends per session or per day [To Do]
│  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  ├─ TASK-11.9 - See my average sit-and-go finishing position per trend group [To Do]
│  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  ├─ TASK-11.7 - Filter my trends by line-up [To Do]
│  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  └─ TASK-11.8 - See my style stats over my last 1,000 hands against healthy ranges [To Do]
│  │     ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │     └─ TASK-11.10 - See my style stats separately for each table size I played [To Do]
│  │        ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │        └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  └─ TASK-11.9 - See my average sit-and-go finishing position per trend group [To Do] (shown above)
├─ TASK-11.5 - Group my trends per session or per day [To Do] (shown above)
└─ TASK-11.6 - Open Statistics or go Home from the Session Report [To Do]
   └─ TASK-11 - Track progress over time [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want to see my Major errors per 100 hands plotted per 500 hands across all my stored hands, so that I can see whether my mistakes are shrinking (G-2).

Adds the Statistics entry to Home (E02-S01) and the Statistics screen (Stats storyboard: '← Home' back control, title, totals line, filter row, Major-error chart). All stored hands, of paused and ended sessions, are ordered chronologically (session start, then hand number) and split into consecutive groups of 500 hands; only complete 500-hand groups are plotted (REQ-048.11), the trailing incomplete group forms no point. Group value = the user's unhinted decisions graded Major in the group's hands / hands in the group x 100, read from the stored decision records (E03-S10: grade and hinted flag), never recomputed by the advice engine; the same unhinted rule as the report (E10-S02). The forced fold after Leave table mid-hand (REQ-004.8) has no grade and is never counted. At per-500 grouping with 1 to 499 hands in the filter the chart is replaced by 'Play <n> more hands to see your first trend point.' where n = 500 - hands, singular 'Play 1 more hand ...' when n is 1 (REQ-048.7, REQ-048.14); with zero hands in the filter the screen shows 'Play your first hand to see trends.' instead (REQ-048.10). The totals line reads e.g. '1,840 hands over 9 sessions'. Filters are E11-S03 and E11-S08, other groupings E11-S02, BB/100 E11-S04, target line E11-S06.

## Requirements covered
- REQ-002 (Must): Home screen menu — The Home screen shall offer New game, Statistics and Settings, and shall offer Resume session only while a paused session exists.
- REQ-004 (Must): Pause, resume and end a session — When the user goes Home or closes the app during a session, TLH Trainer shall keep that session as a paused session that can be resumed at the start of the next hand; when the user chooses Leave table, it shall end the session and open the Session Report.
- REQ-040 (Should): Hinted decisions — When the user requested a hint before acting, the grader shall still grade the decision but shall mark it hinted and exclude it from the major-error rate used for goal G-2.
- REQ-048 (Must): Statistics screen trends — The Statistics screen shall chart the user's Major errors per 100 hands and BB/100 over all stored hands, grouped per 500 hands by default and switchable to per session or per day, filtered by table size and game type.
- REQ-057 (Should): Accessibility and usability — Every screen shall meet WCAG 2.1 AA contrast and control-labelling rules, and every grade or status shown in colour shall also be shown as text.
- REQ-061 (Should): Legal and content — TLH Trainer shall use play money only and shall contain only strategy text and data written for this project.

Covers: REQ-002, REQ-004, REQ-040, REQ-048, REQ-057, REQ-061

## Notes
Put trend computation in a pure statistics module (no UI imports, REQ-059.2) that takes hand/decision records and returns points; the screen only renders. Keep per-hand aggregates (Major count, unhinted flags, net won in big bets) cheap to read for E11-S12.

Plan key: E11-S01 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the Home screen, When the user chooses Statistics, Then the Statistics screen opens; and When the user chooses Home on it, Then the Home screen opens [REQ-002.3]
- [ ] #2 Given a seeded data set of 3,000 stored hands across 9 sessions, When the Statistics screen opens, Then the Major-error chart is grouped per 500 hands and plots 6 points, each equal to the unhinted Major errors per 100 hands recomputed from the stored hand records of that group [REQ-048.1]
- [ ] #3 Given a 500-hand group containing 5 unhinted and 5 hinted Major errors, When its point is plotted, Then its value is 1.0 [REQ-040.3, REQ-048.1]
- [ ] #4 Given a 500-hand group in which the only non-Correct decision record is a forced fold after Leave table, When its point is plotted, Then its value is 0.0 [REQ-004.8, REQ-048.1]
- [ ] #5 Given 1,200 stored hands, When the chart is shown per 500 hands, Then it plots exactly 2 points (hands 1-500 and 501-1,000) and the remaining 200 hands form no point [REQ-048.11, REQ-048.1]
- [ ] #6 Given 320 stored hands, When the Statistics screen opens at per-500 grouping, Then it shows 'Play 180 more hands to see your first trend point.' instead of a chart; and Given 499 stored hands, Then it shows 'Play 1 more hand to see your first trend point.' [REQ-048.7, REQ-048.14]
- [ ] #7 Given no stored hands, When the Statistics screen opens at per-500 grouping, Then it shows 'Play your first hand to see trends.' instead of a chart, no 'Play <n> more hands' message, and totals of 0 hands over 0 sessions [REQ-048.10, REQ-048.7, REQ-048.6]
- [ ] #8 Given 1,840 stored hands over 9 sessions, When the Statistics screen opens with no filter applied, Then it shows a total of 1,840 hands over 9 sessions [REQ-048.6]
- [ ] #9 Given the Statistics screen is added, When the play-money check runs, Then it is registered in e2e/support/screen-list.ts and visited by the play-money walk

Definition of Done:
--------------------------------------------------
- [ ] #1 axe reports zero serious or critical violations on the Statistics screen with data and in the empty state ('Play your first hand to see trends.'), in Chromium and WebKit [REQ-057.1]
- [ ] #2 The Statistics screen offers no deposit, payment, purchase, cash-out, real-money wager or real-money conversion [REQ-061.1]
- [ ] #3 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [ ] #4 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [ ] #5 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [ ] #6 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [ ] #7 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [ ] #8 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [ ] #9 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [ ] #10 No new network requests beyond the app's own files [REQ-058.1]
- [ ] #11 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [ ] #12 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [ ] #13 Story documentation is written and published to Backlog.md
- [ ] #14 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled

Implementation Notes:
--------------------------------------------------
AC added from TASK-2.15 follow-up (doc-124).

