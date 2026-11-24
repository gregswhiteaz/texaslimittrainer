File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-9.3 - See-the-numbers-and-reason-behind-each-reviewed-decision.md

Task TASK-9.3 - See the numbers and reason behind each reviewed decision
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 77000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-24 09:39 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-9 - Review the hand just played
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (3 direct, 40 total):
├─ TASK-3.6 - Keep the table responsive while bots and advice compute [completed]
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
└─ TASK-9.1 - Review each decision of the hand I just played [completed]
   ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed] (shown above)
   └─ TASK-7.4 - Grade a decision as Correct, Minor error or Major error [completed] (shown above)

Dependents (5 direct, 8 total):
├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do]
│  └─ TASK-5 - Play a sit-and-go [To Do]
├─ TASK-9 - Review the hand just played [To Do]
├─ TASK-9.6 - See which reviewed decisions were hinted [To Do]
│  └─ TASK-9 - Review the hand just played [To Do] (shown above)
├─ TASK-9.8 - Get the review panel within one second of the hand ending [To Do]
│  ├─ TASK-9 - Review the hand just played [To Do] (shown above)
│  └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do]
│     └─ TASK-13 - Rely on a private offline app [To Do]
└─ TASK-9.9 - See approximate and short-stack labels in review entries [To Do]
   └─ TASK-9 - Review the hand just played [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want each review entry to explain the advice with its equity numbers, so that I understand why a decision was right or wrong, not just that it was.

Completes REQ-043.1. Entries are read from the decision entries stored in the hand record (E03-S10), which were computed at the decision point with the decision-time observed-stats snapshot, not recomputed after the hand. Each entry shows street, board at that point, the user's action, the recommended action, the grade, equity % and required equity % (one decimal), the plain-English explanation (E07-S12) and the basis per opponent ('typical player' or 'based on N hands of this opponent'). The hint card (E08) and the review entry for the same decision must show the same recommendation and numbers (REQ-036.2). Reading or grading must not block the main thread (E03-S12). Preflop entries show the chart basis instead of equity numbers (REQ-043.9).

## Requirements covered
- REQ-035 (Must): Opponent range model — The advice engine shall estimate each opponent's range from that opponent's actions in the hand, starting from documented default ranges per action and adjusting toward the opponent's observed session statistics once 30 or more hands of that opponent have been observed.
- REQ-036 (Must): Deterministic advice — Given the same player view and the same observed opponent statistics, the advice engine shall always return the same recommendation, numbers, explanation and grade.
- REQ-043 (Must): Hand Review panel — When a hand ends in which the user made any decision other than folding preflop, the Table screen shall open the Hand Review panel beside the table, unless auto-open is turned off in Settings.

Covers: REQ-035, REQ-036, REQ-043

## Notes
With E08-S02 (stored record equals the hint card) this completes the hint-versus-review equality UI test asked for by E07-S13.

Plan key: E09-S02 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a scripted hand in which the user made 4 decisions, When the panel opens, Then each entry shows street, board at that point, the user's action, the recommended action, the grade and the explanation, and each flop, turn and river entry shows equity % and required equity %, each equal to the decision entry stored in the hand record [REQ-043.1]
- [ ] #2 Given a preflop decision holding A9o in the cutoff at 6-max, When the panel opens, Then its entry shows the chart basis "From the 6-max chart: raise A9o from the cutoff" and no equity % or required equity % [REQ-043.9]
- [ ] #3 Given a flop decision against an opponent observed for 40 hands, When the panel opens, Then the entry shows the basis "based on 40 hands of this opponent"; and a preflop entry shows "typical player" [REQ-035.4]
- [ ] #4 Given hint advice was requested through the advice worker at the user's flop decision and the opponent's observed hand count goes from 29 to 30 when the hand ends, When the panel opens, Then the flop entry's recommended action, equity %, required equity %, explanation and basis are identical to that hint result [REQ-036.2, REQ-043.1]
- [ ] #5 Given a 4-decision hand at a table of 10 players, When the panel opens at a 1280 x 720 window, Then all 4 entries with their explanations can be read in the panel without horizontal scrolling [REQ-043.1]
- [ ] #6 Given each user decision, When it is made, Then its review entry (grade, recommendation, equity, explanation, basis) is computed and stored at decision time off the main thread, replacing the hand-end recomputation in reviewEntries
- [ ] #7 Given a review entry is computed during play, When grading runs, Then it goes through the advice worker's grade request (src/ui/advice) and never runs on the main thread
- [ ] #8 Given a reviewed decision, When its numbers and reason are shown, Then the reason is the recommendation's explanation text (TASK-7.10) exactly as returned
- [ ] #9 Given a stored hand record with decisions (TASK-3.12), When the review panel shows that hand, Then each entry's recommendation, numbers, explanation and grade come from the stored decision (not recomputed), stored text is rendered as plain text (never HTML), and the storyboard SHOWDOWN fixture plays the user's moves through applyUserAction so its record parses

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
AC added from TASK-9.1 follow-up (doc-26).

AC added from TASK-3.6 follow-up (use the worker grade request)

AC added from TASK-7.10 follow-up.

AC added from TASK-3.12 follow-up (doc-113: E09 reads stored decisions; plain-text rendering; judge J-1-01 storyboard fixture).

