File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.9 - Count-implied-odds-for-drawing-hands.md

Task TASK-7.9 - Count implied odds for drawing hands
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 44000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-17 23:22 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-7 - Get trustworthy advice
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 9 total):
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

Dependents (3 direct, 55 total):
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
As a learner, I want drawing hands judged with implied odds that name the outs counted, so that I learn when chasing a draw pays off later in the hand.

Implied-odds rule (postflop design document): applies only when hero holds a draw (a flush draw counts 9 outs, an open-ended straight draw 8 outs, outs that also improve an opponent's likely better hand are not removed in this rule) and at least one card is still to come. Required equity with implied odds = call amount / (pot after calling + one big bet for each opponent still in the hand), the extra big bet standing for what hero expects to win on a later street when the draw hits. If equity is below the plain required equity (REQ-033.1) but at least the implied required equity, advice recommends call with the implied-odds rule id and lists the outs; otherwise the pot-odds result stands. Rule precedence: value bet/raise (E07-S10), then pot-odds call, then implied-odds call, then fold (or check when free). Worked example at $4/$8 (AC1): hero Ah5h, opponent range {KsQd}, board Kh 8h 7c 2d; 9 heart outs of 44 unseen cards give equity 20.5%.

## Requirements covered
- REQ-033 (Must): Postflop recommendation method — For each postflop decision, the advice engine shall compute the hero's equity against each opponent's estimated range and the pot odds, and recommend fold, check, call, bet or raise by documented rules comparing those numbers.

Covers: REQ-033

## Notes
Equity in AC1/AC3 is exact enumeration over the 44 unseen river cards: only the 9 remaining hearts win for hero.

Plan key: E07-S11 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a $4/$8 turn decision, board Kh 8h 7c 2d, hero Ah5h, one opponent with range {KsQd} betting $8 into a pot of $28 including that bet, When advice is requested, Then equity is 20.5% (9 outs of 44), required equity is 22.2% (8/36), implied required equity is 18.2% (8/44), and advice recommends call with the implied-odds rule id listing the 9 heart outs [REQ-033.3, REQ-033.7]
- [ ] #2 Given the same turn decision with injected equity exactly equal to 8/44 and with equity 0.1 points below 8/44, When advice is requested, Then it recommends call and fold respectively [REQ-033.3, REQ-033.7]
- [ ] #3 Given the same cards but a pot of $12 including the $8 bet (required 40.0%, implied required 8/28 = 28.6%), When advice is requested, Then it recommends fold with equity 20.5% and lists the 9 outs considered [REQ-033.3, REQ-033.7]
- [ ] #4 Given a turn decision with two opponents still in the hand, a call of $8 and a pot of $36 including the bet, When the implied required equity is computed, Then it is 8 / (44 + 16) = 13.3% [REQ-033.3, REQ-033.7]
- [ ] #5 Given a river decision with a missed draw, When advice is requested, Then implied odds are not applied and no outs are listed [REQ-033.3, REQ-033.7]
- [ ] #6 Given an implied-odds recommendation, When it is returned, Then it includes equity %, required equity %, the rule id and the outs [REQ-033.5]

Definition of Done:
--------------------------------------------------
- [ ] #1 The implied-odds rule is in the postflop design document and has a unit test [REQ-033.4]
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

