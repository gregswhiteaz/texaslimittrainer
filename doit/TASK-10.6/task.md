File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-10.6 - Count-each-preflop-decision-in-the-right-position-group.md

Task TASK-10.6 - See my preflop leaks by position group
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 83000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-17 23:22 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-10 - Read the session report
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 42 total):
└─ TASK-10.5 - See my postflop leaks with evidence and a one-sentence fix [completed]
   ├─ TASK-3.12 - Record the advice and grade for each of my decisions with the hand [completed]
   │  ├─ TASK-3.9 - Keep a permanent record of every completed hand [completed]
   │  │  ├─ TASK-1.15 - Show and muck cards at showdown in casino order [completed]
   │  │  │  ├─ TASK-1.8 - Check game invariants after every playtest action [completed]
   │  │  │  │  ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
   │  │  │  │  │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
   │  │  │  │  │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
   │  │  │  │  │        ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
   │  │  │  │  │        │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
   │  │  │  │  │        │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
   │  │  │  │  │        └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
   │  │  │  │  │           └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   │  │  │  │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   │  │  │  └─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed]
   │  │  │     └─ TASK-1.9 - Let a short-stacked player call all-in [completed]
   │  │  │        └─ TASK-1.8 - Check game invariants after every playtest action [completed] (shown above)
   │  │  ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed]
   │  │  │  └─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed]
   │  │  │     ├─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
   │  │  │     │  ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
   │  │  │     │  ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
   │  │  │     │  │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
   │  │  │     │  └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
   │  │  │     │     ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed] (shown above)
   │  │  │     │     ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
   │  │  │     │     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
   │  │  │     │     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
   │  │  │     │        ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
   │  │  │     │        │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
   │  │  │     │        └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
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
   └─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [completed]
      ├─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed] (shown above)
      ├─ TASK-3.9 - Keep a permanent record of every completed hand [completed] (shown above)
      ├─ TASK-3.10 - Save the session after every hand so it can be resumed [completed]
      │  └─ TASK-3.9 - Keep a permanent record of every completed hand [completed] (shown above)
      └─ TASK-3.11 - Rebuy or leave when my stack runs out [completed]
         ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed] (shown above)
         └─ TASK-3.10 - Save the session after every hand so it can be resumed [completed] (shown above)

Dependents (2 direct, 9 total):
├─ TASK-5.2 - Leave a busted bot's seat empty for the rest of the sit-and-go [To Do]
│  ├─ TASK-5 - Play a sit-and-go [To Do]
│  ├─ TASK-5.7 - Finish a sit-and-go by busting or winning all the chips and see my finishing position [To Do]
│  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do]
│  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  ├─ TASK-5.8 - See results when I bust in a sit-and-go with the review open [To Do]
│  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do]
│  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  └─ TASK-5.11 - Leave a sit-and-go early and get my finishing position [To Do]
│  │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  └─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do]
│     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
└─ TASK-10 - Read the session report [To Do]

Description:
--------------------------------------------------
As a learner, I want to see preflop leaks for the position group I acted from, so that preflop leaks point at the seats where I really go wrong.

Adds the 16 preflop categories to leak detection (rules and report section from E10-S06): position group x action taken (fold, open, call, raise). Position groups count back from the button: button and cutoff are late, the next two seats are middle, all remaining non-blind seats are early, the small and big blinds are blinds. Heads-up the button is late and the other player is blinds. Only seats dealt into the hand count (empty sit-and-go seats are skipped). Action mapping: open = first raise into an unopened or limped pot; raise = raising after someone has raised; call = any preflop call, including a limp (calling the big blind in an unopened pot) and the small blind completing; fold = fold. A big blind checking its option is none of fold, open, call or raise, so it falls in no leak category (it still counts in error rates, REQ-044.2), REQ-047.9. Each preflop category has authored content in original plain English: title, evidence name (e.g. "early-position folds") and one-sentence fix.

## Requirements covered
- REQ-044 (Must): Session Report content — When a session ends, TLH Trainer shall show and save a Session Report with the result, volume, error rates, hint usage, the five tracked style stats against their healthy ranges, and the top leaks.
- REQ-047 (Should): Leak detection — The app shall report a decision category as a leak when, within the session, the user faced it 8 or more times and 40% or more of those unhinted decisions were graded Minor or Major errors.
- REQ-061 (Should): Legal and content — TLH Trainer shall use play money only and shall contain only strategy text and data written for this project.

Covers: REQ-044, REQ-047, REQ-061

## Notes
Reuses the E10-S06 leak rules and report section; limp/SB-complete/BB-check mapping per REQ-047.9.

Plan key: E10-S12 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a 9-player hand, When seats are grouped, Then button and cutoff are late, hijack and lojack are middle, the three seats after the big blind are early and small and big blind are blinds [REQ-047.6]
- [ ] #2 Given a 6-player hand, When seats are grouped, Then button and cutoff are late, the two seats after the big blind are middle, no seat is early and small and big blind are blinds [REQ-047.6]
- [ ] #3 Given a 4-player hand, a 3-player hand and a heads-up hand, When seats are grouped, Then in the 4- and 3-player hands the non-blind seats are late and no seat is middle or early, and heads-up the button is late and the other player is blinds [REQ-047.6]
- [ ] #4 Given preflop decisions where the user open-raised from the button, called a raise from the big blind, re-raised from the hijack at 6-max and folded from under the gun at 9-max, When they are classified, Then they fall in late-open, blinds-call, middle-raise and early-fold respectively [REQ-047.1, REQ-047.7]
- [ ] #5 Given an unopened 6-max pot, When the user calls the big blind from the cutoff, completes from the small blind, or raises from the button after one limper, Then the decisions fall in late-call, blinds-call and late-open respectively [REQ-047.1, REQ-047.9]
- [ ] #6 Given the big blind checks its option after the small blind completes, When the decision is classified, Then it falls in no preflop category and adds to no category's decision or error count [REQ-047.1, REQ-047.9]
- [ ] #7 Given the preflop category data, When it is validated, Then all 16 preflop categories exist (early, middle, late and blinds x fold, open, call, raise) and each has a title, an evidence name and a fix of exactly one sentence [REQ-047.1, REQ-047.7, REQ-047.5]
- [ ] #8 Given a 9-player session with 10 unhinted early-position folds of which 4 were graded errors, When its report is shown, Then the leaks section lists that category's title, the evidence "4 of 10 early-position folds graded as errors" and its fix [REQ-047.7, REQ-047.2, REQ-044.5]

Definition of Done:
--------------------------------------------------
- [ ] #1 Every preflop leak title, evidence name and fix is original text [REQ-047.5, REQ-061.2]
- [ ] #2 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [ ] #3 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [ ] #4 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [ ] #5 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [ ] #6 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [ ] #7 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [ ] #8 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [ ] #9 No new network requests beyond the app's own files [REQ-058.1]
- [ ] #10 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [ ] #11 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [ ] #12 Story documentation is written and published to Backlog.md
- [ ] #13 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled

