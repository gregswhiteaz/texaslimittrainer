File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.8 - Recommend-betting-or-raising-for-value.md

Task TASK-7.8 - Recommend betting or raising for value
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 43000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-18 20:12 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-7 - Get trustworthy advice
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 10 total):
└─ TASK-7.5 - Estimate each opponent's range from their actions in the hand [completed]
   └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
      ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
      │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
      │     └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
      │        └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
      └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
         └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
            └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
               ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
               └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
                  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)

Dependents (5 direct, 60 total):
├─ TASK-6.16 - Keep TAG and Rock bots inside their style bands [To Do]
│  └─ TASK-6 - Face distinct opponents [To Do]
├─ TASK-6.17 - Keep Calling station and Maniac bots inside their style bands [To Do]
│  ├─ TASK-6 - Face distinct opponents [To Do] (shown above)
│  ├─ TASK-6.12 - Prove TAG beats tables of each weaker style [To Do]
│  │  └─ TASK-6 - Face distinct opponents [To Do] (shown above)
│  └─ TASK-10.3 - See my five style stats against healthy ranges for my table size [To Do]
│     ├─ TASK-10 - Read the session report [To Do]
│     └─ TASK-11.8 - See my style stats over my last 1,000 hands against healthy ranges [To Do]
│        ├─ TASK-11 - Track progress over time [To Do]
│        └─ TASK-11.10 - See my style stats separately for each table size I played [To Do]
│           ├─ TASK-11 - Track progress over time [To Do] (shown above)
│           └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do]
│              └─ TASK-11 - Track progress over time [To Do] (shown above)
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
│  │  │  │     └─ TASK-13 - Rely on a private offline app [To Do]
│  │  │  └─ TASK-9.9 - See approximate and short-stack labels in review entries [To Do]
│  │  │     └─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  ├─ TASK-10.4 - See my hands played and error rates per 100 hands in the report [To Do]
│  │  │  ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do]
│  │  │  │  ├─ TASK-2 - Launch and set up a session [To Do]
│  │  │  │  ├─ TASK-2.17 - See a first-use message on Home before any session has ended [To Do]
│  │  │  │  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  │  │  ├─ TASK-12.4 - Delete all my data after confirming [To Do]
│  │  │  │  │  │  └─ TASK-12 - Tune the trainer [To Do]
│  │  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do]
│  │  │  │  │     └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  │  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do]
│  │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  │  │  └─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [To Do]
│  │  │     ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │     ├─ TASK-11.2 - See my BB/100 trend from cash hands against a break-even line [To Do]
│  │  │     │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │  │     │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
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
│  │  │     │  │  └─ TASK-11.8 - See my style stats over my last 1,000 hands against healthy ranges [To Do] (shown above)
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
│     │  ├─ TASK-13.8 - Get new versions at the next launch, never mid-session [To Do]
│     │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│     │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│     │  └─ TASK-13.9 - Reach Home within 3 seconds on a repeat launch [To Do]
│     │     ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│     │     └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do] (shown above)
│     └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
└─ TASK-7.14 - Check advice against postflop golden spots on every test run [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want a recommendation to bet or raise when my hand is ahead of the hands that would call, so that I learn to win more with strong hands.

Value rule: bet (no bet faced) or raise (facing a bet, street not capped) when equity against the range that would call exceeds 50%. The range that would call is derived from the opponent's current estimated range (E07-S07) with the same narrowing rule: the combos the opponent would continue with against the bet or raise, i.e. those kept by the call or raise rule (Strong, Pair and Draw; Air removed). With several opponents, equity is computed against each opponent's calling range. Returns equity against the calling range and the rule id. The rule and the worked example are added to the postflop design document with a unit test.

## Requirements covered
- REQ-033 (Must): Postflop recommendation method — For each postflop decision, the advice engine shall compute the hero's equity against each opponent's estimated range and the pot odds, and recommend fold, check, call, bet or raise by documented rules comparing those numbers.

Covers: REQ-033

## Notes
Equities in AC2/AC3 are exact flop enumerations, each combo weighted equally. Bluffing is not a recommendation rule in the requirements; 'bluff' appears only as an explanation concept.

Plan key: E07-S10 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given an opponent whose estimated range is {KhKd, 8h7h, AhKh, 9h9d, 6h5h, Th9h, QhJh, Ac2c} on flop Ks 8d 7c and hero first to act, When the range that would call a bet is derived, Then it is the 6 combos {KhKd, 8h7h, AhKh, 9h9d, 6h5h, Th9h} [REQ-033.2, REQ-033.6]
- [ ] #2 Given that decision with hero holding 8s8c, When advice is requested, Then equity against the calling range is 72.8% and advice recommends bet with the value-bet rule id [REQ-033.2]
- [ ] #3 Given that decision with hero holding AsKc, When advice is requested, Then equity against the calling range is 48.9% (60.7% against the whole range) and advice does not recommend a value bet [REQ-033.2]
- [ ] #4 Given a postflop decision with no bet faced, When equity against the range that would call a bet is 50.1%, Then advice recommends bet with the value-bet rule id [REQ-033.2]
- [ ] #5 Given the same decision, When equity against the range that would call is exactly 50.0%, Then advice does not recommend a value bet [REQ-033.2]
- [ ] #6 Given a postflop decision facing a bet on a street that is not capped, When equity against the range that would call a raise is 50.1%, Then advice recommends raise [REQ-033.2]
- [ ] #7 Given the same holding on a capped street, When advice is requested, Then it recommends call or fold by the pot-odds rule [REQ-033.1]
- [ ] #8 Given a value-bet or value-raise recommendation, When it is returned, Then it includes equity against the calling range %, required equity % and the rule id [REQ-033.5]
- [ ] #9 Given a value-bet spot, When recommendPostflop returns, Then the recommendation includes equityVsCallingRangePct and bet/raise outcomes alongside the existing fields, without breaking existing consumers
- [ ] #10 Given postflop free-check decisions depend on equity for value bets, When this story lands, Then the TAG bot's FREE_CHECK_EQUITY stand-in is removed or limited to spots where equity cannot change the move, with the playtest still under its time limits
- [ ] #11 Given a real postflop recommendation now carries equityVsCallingRangePct, When a user bets or raises against advice to check or call, Then gradeView grades it by aggression-margin and aggression-no-range no longer fires for real recommendations

Definition of Done:
--------------------------------------------------
- [ ] #1 The value rule is in the postflop design document and has a unit test [REQ-033.4]
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
AC added from TASK-7.3 follow-up (doc-17).

AC added from TASK-6.1 follow-up (doc-18).

AC added from TASK-7.4 follow-up (doc-19).

