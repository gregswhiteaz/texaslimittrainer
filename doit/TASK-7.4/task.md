File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.4 - Grade-a-decision-as-Correct-Minor-error-or-Major-error.md

Task TASK-7.4 - Grade a decision as Correct, Minor error or Major error
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 13000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-17 23:22 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-0
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

Dependents (6 direct, 62 total):
├─ TASK-7 - Get trustworthy advice [To Do]
├─ TASK-7.14 - Check advice against postflop golden spots on every test run [To Do]
│  └─ TASK-7 - Get trustworthy advice [To Do] (shown above)
├─ TASK-7.15 - Prove advice is identical for identical decisions [To Do]
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
│  └─ TASK-7 - Get trustworthy advice [To Do] (shown above)
├─ TASK-7.16 - Label advice as approximate at non-reference table sizes [To Do]
│  ├─ TASK-7 - Get trustworthy advice [To Do] (shown above)
│  ├─ TASK-8.4 - See approximate and short-stack labels on the hint card [To Do]
│  │  └─ TASK-8 - Ask for a hint [To Do] (shown above)
│  └─ TASK-9.9 - See approximate and short-stack labels in review entries [To Do] (shown above)
├─ TASK-7.17 - Add a short-stack note to sit-and-go advice [To Do]
│  ├─ TASK-5.4 - Raise the sit-and-go limits every 10 hands on the published schedule [To Do]
│  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  ├─ TASK-5.5 - See the current level, its limits and hands to the next level in the header [To Do]
│  │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  └─ TASK-5.6 - See the level on Home's Resume entry for a paused sit-and-go [To Do]
│  │  │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  └─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do] (shown above)
│  ├─ TASK-7 - Get trustworthy advice [To Do] (shown above)
│  ├─ TASK-8.4 - See approximate and short-stack labels on the hint card [To Do] (shown above)
│  └─ TASK-9.9 - See approximate and short-stack labels in review entries [To Do] (shown above)
└─ TASK-9.1 - Review each decision of the hand I just played [To Do]
   ├─ TASK-9 - Review the hand just played [To Do] (shown above)
   ├─ TASK-9.2 - Continue to rebuy or leave when I bust with the review open [To Do]
   │  ├─ TASK-5.8 - See results when I bust in a sit-and-go with the review open [To Do] (shown above)
   │  └─ TASK-9 - Review the hand just played [To Do] (shown above)
   ├─ TASK-9.3 - See the numbers and reason behind each reviewed decision [To Do] (shown above)
   ├─ TASK-9.4 - See the hand number, my cards, position, result and replay code in the review [To Do]
   │  └─ TASK-9 - Review the hand just played [To Do] (shown above)
   ├─ TASK-9.5 - See opponents' cards in the review only when they were shown at showdown [To Do]
   │  └─ TASK-9 - Review the hand just played [To Do] (shown above)
   ├─ TASK-9.7 - See a grade summary badge after each hand when auto-open is off [To Do]
   │  ├─ TASK-9 - Review the hand just played [To Do] (shown above)
   │  └─ TASK-12.6 - Turn off automatic opening of the Hand Review panel [To Do]
   │     ├─ TASK-12 - Tune the trainer [To Do] (shown above)
   │     └─ TASK-12.4 - Delete all my data after confirming [To Do] (shown above)
   ├─ TASK-13.4 - Use every screen offline after the first visit [To Do]
   │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
   │  ├─ TASK-13.8 - Get new versions at the next launch, never mid-session [To Do]
   │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
   │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
   │  └─ TASK-13.9 - Reach Home within 3 seconds on a repeat launch [To Do]
   │     ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
   │     └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do] (shown above)
   └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want each of my decisions graded Correct, Minor error or Major error, so that I see which decisions cost me and how badly.

Grader rules: Correct when the action equals the recommended action or the listed acceptable alternative. Preflop: a deviation on a borderline cell is Minor, on any other cell Major. Postflop call/fold: folding when equity exceeds required equity by >= 10 points, or calling when equity is >= 10 points below required equity, is Major; smaller margins Minor. Postflop bet/raise versus check/call: Major only when equity against the calling range is >= 15 points away from 50%; otherwise Minor. Raise-versus-fold deviations use the call/fold margin (REQ-038.6). Close calls (under 10 / under 15 points) are never Major. The grader is a pure function of the user's action and a recommendation result (action, acceptable alternative, borderline flag, equity %, required equity %, equity against the calling range %) computed from the PlayerView at the decision point, never from later cards or the outcome. Its tests use injected recommendation fixtures, so this story does not wait for the value-bet rule (E07-S10) or the range model (E07-S07); in production the recommendation comes from the advice engine.

## Requirements covered
- REQ-025 (Must): No hidden-information leakage — The engine shall give each bot, the advice engine and the grader only the information the acting player could see at that moment: their own hole cards, the board, all actions and stacks, and cards shown at earlier showdowns.
- REQ-038 (Must): Grading rules — The grader shall grade each user decision Correct when it matches the recommendation or a listed acceptable alternative, Major error when the margin rules below mark it clearly wrong, and Minor error otherwise.

Covers: REQ-025, REQ-038

## Notes
The grade result also carries the recommendation it was based on, so Hand Review (E09) can show action, recommendation, numbers and grade from one object.

Plan key: E07-S04 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a decision whose action equals the recommended action or the listed acceptable alternative, When it is graded, Then the grade is Correct [REQ-038.1]
- [ ] #2 Given a preflop decision that deviates from the chart, When it is graded, Then it is a Minor error if the cell is flagged borderline and a Major error otherwise [REQ-038.2]
- [ ] #3 Given an injected recommendation to call, When the user folds with equity above required equity by 0.1, 9.9 and 10.0 points, Then the grades are Minor, Minor and Major [REQ-038.3, REQ-038.5]
- [ ] #4 Given an injected recommendation to fold, When the user calls with equity below required equity by 0.1, 9.9 and 10.0 points, Then the grades are Minor, Minor and Major [REQ-038.3, REQ-038.5]
- [ ] #5 Given an injected recommendation to bet or raise, When the user checks or calls with equity against the calling range of 64.9% and of 65.0%, Then the grades are Minor and Major [REQ-038.4, REQ-038.5]
- [ ] #6 Given an injected recommendation to check or call, When the user bets or raises with equity against the calling range of 35.1% and of 35.0%, Then the grades are Minor and Major [REQ-038.4, REQ-038.5]
- [ ] #7 Given a call graded Major error, When the next cards give the user the winning hand, Then the grade is still Major error because only the PlayerView at the decision point is used [REQ-025.3]
- [ ] #8 Given an injected recommendation to fold, When the user raises with equity below required equity by 9.9 and by 10.0 points, Then the grades are Minor and Major; and given an injected recommendation to raise, When the user folds with equity above required equity by 9.9 and by 10.0 points, Then the grades are Minor and Major [REQ-038.6]

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

