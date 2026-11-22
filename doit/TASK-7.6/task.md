File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.6 - Recommend-preflop-actions-at-heads-up-and-full-ring-tables.md

Task TASK-7.6 - Recommend preflop actions at heads-up and full-ring tables
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 40000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-22 05:01 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-7 - Get trustworthy advice
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 7 total):
└─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
   └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
      └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
         ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
         │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
         │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
         └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
            └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)

Dependents (5 direct, 64 total):
├─ TASK-2.2 - Choose how many players sit at the table [To Do]
│  ├─ TASK-2 - Launch and set up a session [To Do]
│  └─ TASK-2.5 - Choose a line-up preset for the bots [To Do]
│     ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│     ├─ TASK-2.8 - Change the style of one bot seat [To Do]
│     │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│     │  └─ TASK-2.10 - Pre-fill Game Config from my last session [To Do]
│     │     ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│     │     ├─ TASK-12.4 - Delete all my data after confirming [To Do]
│     │     │  └─ TASK-12 - Tune the trainer [To Do]
│     │     └─ TASK-13.6 - Migrate my stored data in order when a new version changes the schema [To Do]
│     │        ├─ TASK-13 - Rely on a private offline app [To Do]
│     │        ├─ TASK-13.7 - Keep my old data intact when a migration fails [To Do]
│     │        │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│     │        │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do]
│     │        │     └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│     │        └─ TASK-13.8 - Get new versions at the next launch, never mid-session [To Do]
│     │           ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│     │           └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│     ├─ TASK-2.9 - Randomise the bot line-up [To Do]
│     │  └─ TASK-2 - Launch and set up a session [To Do] (shown above)
│     └─ TASK-2.13 - Sit at a random seat with a random starting button [To Do]
│        └─ TASK-2 - Launch and set up a session [To Do] (shown above)
├─ TASK-7 - Get trustworthy advice [To Do]
├─ TASK-7.10 - Explain every recommendation in plain English with its numbers [To Do]
│  ├─ TASK-3.12 - Record the advice and grade for each of my decisions with the hand [To Do]
│  │  ├─ TASK-3 - Play hands at the table [To Do]
│  │  ├─ TASK-8.2 - Mark a decision as hinted when I open the hint [To Do]
│  │  │  └─ TASK-8 - Ask for a hint [To Do]
│  │  ├─ TASK-9.3 - See the numbers and reason behind each reviewed decision [To Do]
│  │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do]
│  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do]
│  │  │  ├─ TASK-9 - Review the hand just played [To Do]
│  │  │  ├─ TASK-9.6 - See which reviewed decisions were hinted [To Do]
│  │  │  │  └─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  │  ├─ TASK-9.8 - Get the review panel within one second of the hand ending [To Do]
│  │  │  │  ├─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  │  │  └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do]
│  │  │  │     └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  └─ TASK-9.9 - See approximate and short-stack labels in review entries [To Do]
│  │  │     └─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  ├─ TASK-10.4 - See my hands played and error rates per 100 hands in the report [To Do]
│  │  │  ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do]
│  │  │  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  │  ├─ TASK-2.17 - See a first-use message on Home before any session has ended [To Do]
│  │  │  │  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  │  │  ├─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
│  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  │  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do]
│  │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  ├─ TASK-10 - Read the session report [To Do]
│  │  │  └─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [To Do]
│  │  │     ├─ TASK-11 - Track progress over time [To Do]
│  │  │     ├─ TASK-11.2 - See my BB/100 trend from cash hands against a break-even line [To Do]
│  │  │     │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │     │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do]
│  │  │     │     └─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │     ├─ TASK-11.3 - See the G-2 target line on my Major-error trend [To Do]
│  │  │     │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │     │  └─ TASK-11.11 - See whether I met the G-2 goal after 5,000 hands [To Do]
│  │  │     │     ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │     │     └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │     ├─ TASK-11.4 - Filter my trends by table size and game type [To Do]
│  │  │     │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │     │  ├─ TASK-11.5 - Group my trends per session or per day [To Do]
│  │  │     │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │     │  │  ├─ TASK-11.9 - See my average sit-and-go finishing position per trend group [To Do]
│  │  │     │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │     │  │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │     │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │     │  ├─ TASK-11.7 - Filter my trends by line-up [To Do]
│  │  │     │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │     │  │  └─ TASK-11.8 - See my style stats over my last 1,000 hands against healthy ranges [To Do]
│  │  │     │  │     ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │     │  │     └─ TASK-11.10 - See my style stats separately for each table size I played [To Do]
│  │  │     │  │        ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │     │  │        └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │  │     │  └─ TASK-11.9 - See my average sit-and-go finishing position per trend group [To Do] (shown above)
│  │  │     ├─ TASK-11.5 - Group my trends per session or per day [To Do] (shown above)
│  │  │     └─ TASK-11.6 - Open Statistics or go Home from the Session Report [To Do]
│  │  │        └─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  ├─ TASK-10.5 - See my postflop leaks with evidence and a one-sentence fix [To Do]
│  │  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  ├─ TASK-10.6 - See my preflop leaks by position group [To Do]
│  │  │  │  ├─ TASK-5.2 - Leave a busted bot's seat empty for the rest of the sit-and-go [To Do]
│  │  │  │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  ├─ TASK-5.7 - Finish a sit-and-go by busting or winning all the chips and see my finishing position [To Do]
│  │  │  │  │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-5.8 - See results when I bust in a sit-and-go with the review open [To Do]
│  │  │  │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  │  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do] (shown above)
│  │  │  │  │  │  └─ TASK-5.11 - Leave a sit-and-go early and get my finishing position [To Do]
│  │  │  │  │  │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  └─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do]
│  │  │  │  │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  └─ TASK-10.8 - See my three most costly leaks first [To Do]
│  │  │     ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do] (shown above)
│  │  │     └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  ├─ TASK-10.7 - See how many of my decisions used a hint in the report [To Do]
│  │  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  └─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [To Do] (shown above)
│  ├─ TASK-7 - Get trustworthy advice [To Do] (shown above)
│  ├─ TASK-7.11 - Check advice against preflop golden spots on every test run [To Do]
│  │  ├─ TASK-7 - Get trustworthy advice [To Do] (shown above)
│  │  └─ TASK-7.14 - Check advice against postflop golden spots on every test run [To Do]
│  │     └─ TASK-7 - Get trustworthy advice [To Do] (shown above)
│  ├─ TASK-7.15 - Prove advice is identical for identical decisions [To Do]
│  │  ├─ TASK-3.12 - Record the advice and grade for each of my decisions with the hand [To Do] (shown above)
│  │  └─ TASK-7 - Get trustworthy advice [To Do] (shown above)
│  └─ TASK-8.1 - Ask for a hint and see the recommended action with its numbers and reason [To Do]
│     ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│     ├─ TASK-8 - Ask for a hint [To Do] (shown above)
│     ├─ TASK-8.2 - Mark a decision as hinted when I open the hint [To Do] (shown above)
│     ├─ TASK-8.3 - Get the hint card within one second [To Do]
│     │  ├─ TASK-8 - Ask for a hint [To Do] (shown above)
│     │  └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do] (shown above)
│     ├─ TASK-8.4 - See approximate and short-stack labels on the hint card [To Do]
│     │  └─ TASK-8 - Ask for a hint [To Do] (shown above)
│     ├─ TASK-13.4 - Use every screen offline after the first visit [To Do]
│     │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│     │  ├─ TASK-13.8 - Get new versions at the next launch, never mid-session [To Do] (shown above)
│     │  └─ TASK-13.9 - Reach Home within 3 seconds on a repeat launch [To Do]
│     │     ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│     │     └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do] (shown above)
│     └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
├─ TASK-7.11 - Check advice against preflop golden spots on every test run [To Do] (shown above)
└─ TASK-7.16 - Label advice as approximate at non-reference table sizes [To Do]
   ├─ TASK-7 - Get trustworthy advice [To Do] (shown above)
   ├─ TASK-8.4 - See approximate and short-stack labels on the hint card [To Do] (shown above)
   └─ TASK-9.9 - See approximate and short-stack labels in review entries [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want preflop recommendations tuned to the table size I play, from heads-up to full ring, so that the advice fits the table size I am practising.

Adds the heads-up (2) and full-ring (9-10) charts with the same situations, cell format and justification rules as the 6-max chart (E07-S01). Table sizes map to reference sizes: 2 -> heads-up; 3, 4, 5, 6, 7 -> 6-max; 8, 9, 10 -> full ring. The approximate label for mapped sizes is E07-S16. Position mapping: a seat uses the reference chart's position that is the same number of seats before the button (BTN, SB and BB keep their names); seats earlier than the reference chart's earliest position use that earliest position (UTG).

## Requirements covered
- REQ-005 (Must): Choose game type and table size — The Game Config screen shall let the user choose the game type (Cash game or Sit-and-go) and the number of players from 2 to 10 including the user.
- REQ-032 (Must): Preflop charts — The advice engine shall take every preflop recommendation from authored charts that give, for each reference size, position and preflop situation, the action for each of the 169 starting-hand classes.
- REQ-061 (Should): Legal and content — TLH Trainer shall use play money only and shall contain only strategy text and data written for this project.

Covers: REQ-005, REQ-032, REQ-061

Plan key: E07-S05 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the chart data, When the chart validator runs, Then charts exist for heads-up, 6-max and full ring and a missing chart fails validation [REQ-032.1]
- [ ] #2 Given the heads-up and full-ring charts, When the chart validator runs, Then every position at those sizes in each situation that applies to it (unopened pot, facing one or more limpers, facing a raise, facing a raise and calls, facing a re-raise, blind defence) assigns an action to all 169 hand classes [REQ-032.2]
- [ ] #3 Given the heads-up or full-ring chart file without a plain-English justification, When the chart validator runs, Then validation fails naming the chart [REQ-032.4]
- [ ] #4 Given a preflop PlayerView at each table size from 2 to 10, When advice is requested, Then the chart used is heads-up for 2, 6-max for 3 to 7 and full ring for 8 to 10 [REQ-005.4, REQ-032.1]
- [ ] #5 Given a heads-up preflop PlayerView on the button, When advice is requested, Then the recommendation comes from the heads-up chart cell for that hand class and situation [REQ-032.1]
- [ ] #6 Given a heads-up preflop decision where the big blind faces a fourth bet (button raised, big blind re-raised, button re-raised) with a hand class whose heads-up big-blind facing-a-re-raise cell is raise, When advice is requested, Then it uses that heads-up cell and returns call because the street is capped [REQ-032.6]
- [ ] #7 Given a full-ring preflop decision where UTG faces a fourth bet (UTG raised, CO re-raised, BB re-raised), When advice is requested for a hand class whose full-ring UTG facing-a-re-raise cell is raise and for one whose cell is fold, Then it uses those full-ring cells and returns call and fold respectively [REQ-032.6]
- [ ] #8 Given preflop decisions at the first seat to act, When advice is requested, Then 4-handed uses the 6-max CO cell, 5-handed the 6-max HJ cell, both of the two earliest 7-handed seats the 6-max UTG cell, and 8-handed the full-ring cell of the position 5 seats before the button [REQ-005.4]
- [ ] #9 Given charts for table sizes 2-10, When the playtest's defaultPolicyFactory seats bots, Then TAG sits in every seat at every supported size and the random-move fallback is removed
- [ ] #10 Given 10-seat preflop charts exist, When TASK-3.13's e2e/rapid-pace.spec.ts 10-player check (SPEC-05) runs with the real TAG bots instead of its test-only policy, Then every bot action after the user's preflop fold shows within 300 ms
- [ ] #11 Given a playtest with --lineup at 2 to 10 seats, When it runs after full-ring and heads-up advice exist, Then every line-up seat plays its own style in every hand (the TASK-6.6 random-move fallback for non-6-seat hands and its Line-up note are removed) and zero invariant violations are reported

Definition of Done:
--------------------------------------------------
- [ ] #1 Chart ranges and justification text are original, written for this project [REQ-061.2]
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

Implementation Notes:
--------------------------------------------------
AC added from TASK-6.1 follow-up (doc-18).

AC added from TASK-3.13 (10-player pace proven with a test-only policy until 10-seat charts exist)

AC added from TASK-6.6 Q-1

