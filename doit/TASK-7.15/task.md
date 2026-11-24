File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.15 - Prove-advice-is-identical-for-identical-decisions.md

Task TASK-7.15 - Prove advice is identical for identical decisions
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 74000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-18 20:12 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-7 - Get trustworthy advice
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (4 direct, 18 total):
├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
│  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
│     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
│        ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
│        │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
│        │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
│        └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
│           └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
├─ TASK-7.4 - Grade a decision as Correct, Minor error or Major error [completed]
│  └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
│     ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
│     │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
│     └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
│        └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
├─ TASK-7.10 - Explain every recommendation in plain English with its numbers [completed]
│  ├─ TASK-7.6 - Recommend preflop actions at heads-up and full-ring tables [completed]
│  │  └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
│  ├─ TASK-7.8 - Recommend betting or raising for value [completed]
│  │  └─ TASK-7.5 - Estimate each opponent's range from their actions in the hand [completed]
│  │     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed] (shown above)
│  └─ TASK-7.9 - Count implied odds for drawing hands [completed]
│     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed] (shown above)
└─ TASK-7.13 - Adjust opponent ranges to their observed play after 30 hands [completed]
   ├─ TASK-7.5 - Estimate each opponent's range from their actions in the hand [completed] (shown above)
   └─ TASK-7.12 - Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD [completed]
      └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed] (shown above)

Dependents (2 direct, 45 total):
├─ TASK-3.12 - Record the advice and grade for each of my decisions with the hand [To Do]
│  ├─ TASK-3 - Play hands at the table [To Do]
│  ├─ TASK-8.2 - Mark a decision as hinted when I open the hint [To Do]
│  │  └─ TASK-8 - Ask for a hint [To Do]
│  ├─ TASK-9.3 - See the numbers and reason behind each reviewed decision [To Do]
│  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do]
│  │  │  └─ TASK-5 - Play a sit-and-go [To Do]
│  │  ├─ TASK-9 - Review the hand just played [To Do]
│  │  ├─ TASK-9.6 - See which reviewed decisions were hinted [To Do]
│  │  │  └─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  ├─ TASK-9.8 - Get the review panel within one second of the hand ending [To Do]
│  │  │  ├─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  │  └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do]
│  │  │     └─ TASK-13 - Rely on a private offline app [To Do]
│  │  └─ TASK-9.9 - See approximate and short-stack labels in review entries [To Do]
│  │     └─ TASK-9 - Review the hand just played [To Do] (shown above)
│  ├─ TASK-10.4 - See my hands played and error rates per 100 hands in the report [To Do]
│  │  ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do]
│  │  │  ├─ TASK-2 - Launch and set up a session [To Do]
│  │  │  ├─ TASK-2.17 - See a first-use message on Home before any session has ended [To Do]
│  │  │  │  ├─ TASK-2 - Launch and set up a session [To Do] (shown above)
│  │  │  │  ├─ TASK-12.4 - Delete all my data after confirming [To Do]
│  │  │  │  │  └─ TASK-12 - Tune the trainer [To Do]
│  │  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do]
│  │  │  │     └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do]
│  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
│  │  ├─ TASK-10 - Read the session report [To Do]
│  │  └─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [To Do]
│  │     ├─ TASK-11 - Track progress over time [To Do]
│  │     ├─ TASK-11.2 - See my BB/100 trend from cash hands against a break-even line [To Do]
│  │     │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │     │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do]
│  │     │     └─ TASK-11 - Track progress over time [To Do] (shown above)
│  │     ├─ TASK-11.3 - See the G-2 target line on my Major-error trend [To Do]
│  │     │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │     │  └─ TASK-11.11 - See whether I met the G-2 goal after 5,000 hands [To Do]
│  │     │     ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │     │     └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │     ├─ TASK-11.4 - Filter my trends by table size and game type [To Do]
│  │     │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │     │  ├─ TASK-11.5 - Group my trends per session or per day [To Do]
│  │     │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │     │  │  ├─ TASK-11.9 - See my average sit-and-go finishing position per trend group [To Do]
│  │     │  │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │     │  │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │     │  │  └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │     │  ├─ TASK-11.7 - Filter my trends by line-up [To Do]
│  │     │  │  ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │     │  │  └─ TASK-11.8 - See my style stats over my last 1,000 hands against healthy ranges [To Do]
│  │     │  │     ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │     │  │     └─ TASK-11.10 - See my style stats separately for each table size I played [To Do]
│  │     │  │        ├─ TASK-11 - Track progress over time [To Do] (shown above)
│  │     │  │        └─ TASK-11.12 - Open Statistics within 2 seconds with 100,000 stored hands [To Do] (shown above)
│  │     │  └─ TASK-11.9 - See my average sit-and-go finishing position per trend group [To Do] (shown above)
│  │     ├─ TASK-11.5 - Group my trends per session or per day [To Do] (shown above)
│  │     └─ TASK-11.6 - Open Statistics or go Home from the Session Report [To Do]
│  │        └─ TASK-11 - Track progress over time [To Do] (shown above)
│  ├─ TASK-10.5 - See my postflop leaks with evidence and a one-sentence fix [To Do]
│  │  ├─ TASK-10 - Read the session report [To Do] (shown above)
│  │  ├─ TASK-10.6 - See my preflop leaks by position group [To Do]
│  │  │  ├─ TASK-5.2 - Leave a busted bot's seat empty for the rest of the sit-and-go [To Do]
│  │  │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  ├─ TASK-5.7 - Finish a sit-and-go by busting or winning all the chips and see my finishing position [To Do]
│  │  │  │  │  ├─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│  │  │  │  │  ├─ TASK-5.8 - See results when I bust in a sit-and-go with the review open [To Do]
│  │  │  │  │  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  │  ├─ TASK-5.9 - See my last sit-and-go's finishing position in the Home snapshot [To Do] (shown above)
│  │  │  │  │  └─ TASK-5.11 - Leave a sit-and-go early and get my finishing position [To Do]
│  │  │  │  │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  │  └─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do]
│  │  │  │     └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  │  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│  │  └─ TASK-10.8 - See my three most costly leaks first [To Do]
│  │     ├─ TASK-2.16 - See a snapshot of my last session on Home and reopen its report [To Do] (shown above)
│  │     └─ TASK-10 - Read the session report [To Do] (shown above)
│  ├─ TASK-10.7 - See how many of my decisions used a hint in the report [To Do]
│  │  └─ TASK-10 - Read the session report [To Do] (shown above)
│  └─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [To Do] (shown above)
└─ TASK-7 - Get trustworthy advice [To Do]

Description:
--------------------------------------------------
As a maintainer, I want a playtest option that recomputes the advice at every decision to prove it never changes, so that the trainer gives the same advice for the same situation every time.

Given the same PlayerView and observed opponent statistics, the advice engine always returns the same recommendation, numbers, explanation and grade. Adds the advice-determinism option to the E01 playtest CLI (REQ-062.1). The hint during a hand and the review entry after it must state the same recommendation and numbers, so review recomputes with the observed-stat snapshot taken at the decision point, not the stats updated by the finished hand.

## Requirements covered
- REQ-025 (Must): No hidden-information leakage — The engine shall give each bot, the advice engine and the grader only the information the acting player could see at that moment: their own hole cards, the board, all actions and stacks, and cards shown at earlier showdowns.
- REQ-036 (Must): Deterministic advice — Given the same player view and the same observed opponent statistics, the advice engine shall always return the same recommendation, numbers, explanation and grade.
- REQ-062 (Must): Headless playtest CLI — The project shall provide a command-line playtest runner that plays seeded bot-only hands with the production engine, checks invariants after every action and reports results.

Covers: REQ-025, REQ-036, REQ-062

## Notes
Until E06 bots exist, playtest seats use seeded random legal moves; advice is still computed at every seat's decision point. E08/E09 must add a UI test that the hint card and the review entry for the same decision show the same values.

Plan key: E07-S13 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given `npm run playtest -- --hands 10000 --seed 42 --check-advice`, When it runs, Then it recomputes advice and grade at every decision point (at least 10,000), compares action, numbers, explanation, basis and grade with the first result, reports 0 mismatches and exits 0 [REQ-036.1, REQ-062.1]
- [ ] #2 Given a test build whose advice output varies between calls, When the playtest runs with `--check-advice`, Then it prints the replay code and decision point of the first mismatch and exits non-zero [REQ-036.1]
- [ ] #3 Given a decision point where a hint was computed during the hand, When the review entry is computed after the hand ends, Then the recommendation, equity %, required equity %, explanation and basis are identical even though the finished hand changed opponents' observed stats [REQ-036.2]
- [ ] #4 Given a fixed decision point, When the other players' hole cards and the undealt cards are changed in 1,000 seeded variations, Then the hint and the grade of the user's action never change [REQ-025.2, REQ-025.3]
- [ ] #5 Given the same seed and options including `--check-advice`, When the playtest is run twice, Then the outputs are byte-identical [REQ-062.4]
- [ ] #6 Given a decision graded when a hint is shown and again in the review, When both grades are computed, Then gradeDecision on the stored recommendation gives a deep-equal GradeResult

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
AC added from TASK-7.4 follow-up (doc-19).

