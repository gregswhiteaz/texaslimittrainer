File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-10.5 - See-my-leaks-with-evidence-and-a-one-sentence-fix.md

Task TASK-10.5 - See my postflop leaks with evidence and a one-sentence fix
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 82000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-17 23:22 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-10 - Read the session report
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (2 direct, 41 total):
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

Dependents (3 direct, 18 total):
├─ TASK-10 - Read the session report [To Do]
├─ TASK-10.6 - See my preflop leaks by position group [To Do]
│  ├─ TASK-5.2 - Leave a busted bot's seat empty for the rest of the sit-and-go [To Do]
│  │  ├─ TASK-5 - Play a sit-and-go [To Do]
│  │  ├─ TASK-5.7 - Finish a sit-and-go by busting or winning all the chips and see my finishing position [To Do]
│  │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do]
│  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  ├─ TASK-5.8 - See results when I bust in a sit-and-go with the review open [To Do]
│  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do]
│  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  └─ TASK-5.11 - Leave a sit-and-go early and get my finishing position [To Do]
│  │  │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  └─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do]
│  │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  └─ TASK-10 - Read the session report [To Do] (shown above)
└─ TASK-10.8 - See my three most costly leaks first [To Do]
   ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do]
   │  ├─ TASK-2 - Launch and set up a session [To Do]
   │  ├─ TASK-2.17 - See a first-use message on Home before any session has ended [To Do]
   │  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
   │  │  ├─ TASK-12.4 - Delete all my data after confirming [To Do]
   │  │  │  └─ TASK-12 - Tune the trainer [To Do]
   │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do]
   │  │     └─ TASK-13 - Rely on a private offline app [To Do]
   │  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do] (shown above)
   │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
   └─ TASK-10 - Read the session report [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want to see which postflop decision categories were leaks this session, each with its evidence and fix, so that I know exactly what to work on next.

Leak detection over the session's stored decision records (grade and hinted flag, E03-S10). This slice delivers the leak rules, the report's leaks section and the 15 postflop categories: street (flop, turn, river) x facing a bet (fold, call, raise) or not facing a bet (check, bet). A call facing a bet is a call even when the betting is capped. The 16 preflop categories (position group x fold/open/call/raise) are added by E10-S12, which reuses these rules. A category is a leak when it has >= 8 unhinted decisions and >= 40% of its unhinted decisions were graded Minor or Major; hinted decisions are ignored for both thresholds. The forced fold after Leave table mid-hand is not a decision (REQ-004.8). Each postflop category has authored content written in original plain English: a leak title (e.g. "Calling too often on the turn"), an evidence name (e.g. "turn calls") and a one-sentence fix. Evidence reads "<errors> of <decisions> <category> graded as errors" over unhinted decisions. Report section "Biggest leaks this session" lists each leak's title, evidence and fix; with no leaks it reads "No leaks found this session (a leak needs 8+ spots with 40%+ errors)." Ranking and the limit of 3 are E10-S07. In M2 because REQ-044.5 (leaks in the report) is Must.

## Requirements covered
- REQ-044 (Must): Session Report content — When a session ends, TLH Trainer shall show and save a Session Report with the result, volume, error rates, hint usage, the five tracked style stats against their healthy ranges, and the top leaks.
- REQ-047 (Should): Leak detection — The app shall report a decision category as a leak when, within the session, the user faced it 8 or more times and 40% or more of those unhinted decisions were graded Minor or Major errors.
- REQ-061 (Should): Legal and content — TLH Trainer shall use play money only and shall contain only strategy text and data written for this project.

Covers: REQ-044, REQ-047, REQ-061

## Notes
Keep the category set as data so E10-S12 only adds the preflop entries.

Plan key: E10-S06 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given decisions where the user called a turn bet, called a river bet when the betting was capped, folded to a river bet and bet the flop with no bet to face, When they are classified, Then they fall in turn-facing-a-bet-call, river-facing-a-bet-call, river-facing-a-bet-fold and flop-not-facing-a-bet-bet respectively [REQ-047.1]
- [ ] #2 Given the postflop category data, When it is validated, Then all 15 postflop categories (flop, turn and river x fold, call, raise facing a bet and check, bet not facing a bet) exist and each has a title, an evidence name and a fix of exactly one sentence [REQ-047.1, REQ-047.5]
- [ ] #3 Given a session with 10 unhinted turn calls of which 4 were graded Minor or Major, When the report is built, Then turn calls is a leak with evidence "4 of 10 turn calls graded as errors" [REQ-047.2, REQ-047.4]
- [ ] #4 Given a session with 7 unhinted river raises all graded Major, When the report is built, Then river raises is not a leak [REQ-047.2]
- [ ] #5 Given a session with 10 unhinted flop bets of which 3 were graded errors, When the report is built, Then flop bets is not a leak [REQ-047.2]
- [ ] #6 Given a category with 5 hinted decisions all graded Major and 7 unhinted decisions all graded Major, When the report is built, Then the category is not a leak; and with 3 hinted Correct plus 8 unhinted of which 4 are errors it is a leak with evidence "4 of 8 <category> graded as errors" [REQ-047.8, REQ-047.2]
- [ ] #7 Given a session with one leak, When its report is shown, Then the leaks section shows that category's title, its evidence and its fix sentence [REQ-044.5, REQ-047.4, REQ-047.5]
- [ ] #8 Given a session with no category meeting the leak thresholds, When its report is shown, Then the leaks section reads "No leaks found this session (a leak needs 8+ spots with 40%+ errors)." and lists no leak [REQ-044.5, REQ-044.9]

Definition of Done:
--------------------------------------------------
- [ ] #1 Every postflop leak title, evidence name and fix is original text [REQ-047.5, REQ-061.2]
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

