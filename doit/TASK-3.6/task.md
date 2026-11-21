File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-3.6 - Keep-the-table-responsive-while-bots-and-advice-compute.md

Task TASK-3.6 - Keep the table responsive while bots and advice compute
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 23000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-17 23:22 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-3 - Play hands at the table
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 13 total):
└─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
   ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
   │  └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
   │     ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
   │     │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
   │     │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
   │     └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
   │        └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
   │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
   └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
      ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
      │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
      ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
      │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
      └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
         ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
         │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
         └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)

Dependents (4 direct, 19 total):
├─ TASK-3 - Play hands at the table [To Do]
├─ TASK-8.1 - Ask for a hint and see the recommended action with its numbers and reason [To Do]
│  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do]
│  │  └─ TASK-5 - Play a sit-and-go [To Do]
│  ├─ TASK-8 - Ask for a hint [To Do]
│  ├─ TASK-8.2 - Mark a decision as hinted when I open the hint [To Do]
│  │  └─ TASK-8 - Ask for a hint [To Do] (shown above)
│  ├─ TASK-8.3 - Get the hint card within one second [To Do]
│  │  ├─ TASK-8 - Ask for a hint [To Do] (shown above)
│  │  └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do]
│  │     └─ TASK-13 - Rely on a private offline app [To Do]
│  ├─ TASK-8.4 - See approximate and short-stack labels on the hint card [To Do]
│  │  └─ TASK-8 - Ask for a hint [To Do] (shown above)
│  ├─ TASK-13.4 - Use every screen offline after the first visit [To Do]
│  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  ├─ TASK-13.8 - Get new versions at the next launch, never mid-session [To Do]
│  │  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do]
│  │  │     └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  └─ TASK-13.9 - Reach Home within 3 seconds on a repeat launch [To Do]
│  │     ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │     └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do] (shown above)
│  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)
├─ TASK-9.3 - See the numbers and reason behind each reviewed decision [To Do]
│  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do] (shown above)
│  ├─ TASK-9 - Review the hand just played [To Do]
│  ├─ TASK-9.6 - See which reviewed decisions were hinted [To Do]
│  │  └─ TASK-9 - Review the hand just played [To Do] (shown above)
│  ├─ TASK-9.8 - Get the review panel within one second of the hand ending [To Do]
│  │  ├─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do] (shown above)
│  └─ TASK-9.9 - See approximate and short-stack labels in review entries [To Do]
│     └─ TASK-9 - Review the hand just played [To Do] (shown above)
└─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want the table to stay responsive while advice is being computed, so that the game never freezes or stutters during play.

Equity and advice computation (bot decisions, and later hints and review grading) run off the main thread in a Web Worker so the table stays responsive: no frame longer than 100 ms during computation. The engine and advice modules stay UI-free (REQ-059.2); the worker is the browser host for them. The same worker API serves E08 hints and E09 review.

## Requirements covered
- REQ-055 (Should): Response times — On the reference machine (Apple-silicon Mac, latest Chrome), TLH Trainer shall meet these 95th-percentile response times.

Covers: REQ-055

## Notes
E08 must request hints through this worker (REQ-055.1); E09 computes or reads review advice without blocking the main thread.

Plan key: E03-S12 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a scripted 6-max hand where each bot postflop decision takes at least 300 ms to compute, When the table plays it in Chromium, Then a long-task observer records no main-thread task longer than 100 ms during the computation [REQ-055.6]
- [ ] #2 Given a bot decision is being computed, When the user hovers a seat or the window is resized, Then the table repaints within 100 ms [REQ-055.6]
- [ ] #3 Given the same seed and user actions, When a hand is played with computation in the worker and headlessly in the playtest, Then every bot action is identical [REQ-055.6]

Definition of Done:
--------------------------------------------------
- [ ] #1 Automated timing test over 200 samples reports p95 main-thread frame time during computation at most 100 ms [REQ-055.6]
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

