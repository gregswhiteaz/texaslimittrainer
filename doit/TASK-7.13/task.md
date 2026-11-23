File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.13 - Adjust-opponent-ranges-to-their-observed-play-after-30-hands.md

Task TASK-7.13 - Adjust opponent ranges to their observed play after 30 hands
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 72000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-23 09:25 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-7 - Get trustworthy advice
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (2 direct, 11 total):
├─ TASK-7.5 - Estimate each opponent's range from their actions in the hand [completed]
│  └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
│     ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
│     │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
│     │     └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
│     │        └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
│     └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
│        └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
│           └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
│              ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
│              └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
│                 └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
└─ TASK-7.12 - Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD [completed]
   └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed] (shown above)

Dependents (4 direct, 53 total):
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
└─ TASK-8.1 - Ask for a hint and see the recommended action with its numbers and reason [To Do]
   ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
   ├─ TASK-8 - Ask for a hint [To Do] (shown above)
   ├─ TASK-8.2 - Mark a decision as hinted when I open the hint [To Do] (shown above)
   ├─ TASK-8.3 - Get the hint card within one second [To Do]
   │  ├─ TASK-8 - Ask for a hint [To Do] (shown above)
   │  └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do] (shown above)
   ├─ TASK-8.4 - See approximate and short-stack labels on the hint card [To Do]
   │  └─ TASK-8 - Ask for a hint [To Do] (shown above)
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
As a learner, I want the advice to read each opponent from the hands I have seen them play, so that I learn to adjust to loose and tight opponents.

From 30 observed hands of an opponent in the session, that opponent's preflop range width is scaled toward their observed stats by the formula in the range-model design document: width = d + (o - d) x min(n, 100) / 100, where d is the default range's width (% of starting hands), o is the observed PFR for raising ranges or the observed VPIP for calling and limping ranges, and n is the number of observed hands; the range is then the strongest width% of starting hands by the documented hand order, never narrower than the single strongest hand class (AA). Below 30 hands the default range is used. Recommendations state the basis per opponent: 'typical player' or 'based on N hands of this opponent'; the hint (E08) and review (E09) display it.

## Requirements covered
- REQ-035 (Must): Opponent range model — The advice engine shall estimate each opponent's range from that opponent's actions in the hand, starting from documented default ranges per action and adjusting toward the opponent's observed session statistics once 30 or more hands of that opponent have been observed.

Covers: REQ-035

## Notes
Observed stats are an explicit advice input (a snapshot per decision point), so hint and review for the same decision use the same snapshot (E07-S13). Preflop chart recommendations do not read opponent ranges; planned basis for preflop is 'typical player'.

Plan key: E07-S09 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given an opponent with 29 observed hands, When their range is estimated, Then it equals the default range and the basis is 'typical player' [REQ-035.2, REQ-035.4]
- [ ] #2 Given two opponents with identical actions and 30 observed hands each, one with VPIP 20% and PFR 15% and one with VPIP 60% and PFR 10%, When their ranges are estimated, Then the preflop ranges differ and each width equals the documented formula's output [REQ-035.2, REQ-035.6]
- [ ] #3 Given an opponent with 40 observed hands, When a postflop recommendation is computed, Then its basis reads 'based on 40 hands of this opponent' [REQ-035.4]
- [ ] #4 Given a multiway pot with one opponent observed for 45 hands and one for 12, When a recommendation is computed, Then it returns the basis for each opponent: 'based on 45 hands of this opponent' and 'typical player' [REQ-035.4]
- [ ] #5 Given a default raising range of width 20.0% and an opponent with 30 observed hands, When the scaling formula is applied with observed PFR 0%, 20% and 100%, Then the widths are 14.0%, 20.0% and 44.0%; and with 100 observed hands and PFR 60%, Then the width is 60.0% [REQ-035.2, REQ-035.6]
- [ ] #6 Given a default raising range of width 20.0% and an opponent with 100 observed hands and PFR 0%, When the range is scaled, Then the scaled width is 0.0% and the range is the single strongest hand class AA (6 combos), never empty [REQ-035.6]
- [ ] #7 Given a recommendation whose range rests on observed opponent habits, When its explanation is generated, Then it names and defines the 'opponent type' concept using the authored definition in src/advice/explanations.ts

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
AC added from TASK-7.10 follow-up (opponent-type template).

