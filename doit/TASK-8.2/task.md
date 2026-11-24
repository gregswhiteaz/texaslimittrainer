File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-8.2 - Mark-a-decision-as-hinted-when-I-open-the-hint.md

Task TASK-8.2 - Mark a decision as hinted when I open the hint
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 88000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-17 23:22 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-8 - Ask for a hint
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
└─ TASK-8.1 - Ask for a hint and see the recommended action with its numbers and reason [completed]
   ├─ TASK-3.2 - Choose only legal actions with their exact amounts [completed]
   │  └─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed] (shown above)
   ├─ TASK-3.6 - Keep the table responsive while bots and advice compute [completed]
   │  └─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed] (shown above)
   ├─ TASK-7.10 - Explain every recommendation in plain English with its numbers [completed] (shown above)
   └─ TASK-7.13 - Adjust opponent ranges to their observed play after 30 hands [completed] (shown above)

Dependents (1 direct, 1 total):
└─ TASK-8 - Ask for a hint [To Do]

Description:
--------------------------------------------------
As a learner, I want decisions where I looked at the hint to be recorded as hinted, so that my progress measures count only the decisions I made on my own.

A decision is hinted when the hint card was opened at that decision point before the user acted (REQ-040.1), even if it was hidden again. Opening the hint sets hinted = true on that decision's entry in the hand record (E03-S10 stores the flag, false by default). The grader still grades hinted decisions; E09 shows the 'hinted' tag, E10 reports hint usage and E11 excludes hinted decisions from the G-2 rate. The stored advice for the decision is the same advice the hint card showed (decision-time observed-stats snapshot, REQ-036.2).

## Requirements covered
- REQ-036 (Must): Deterministic advice — Given the same player view and the same observed opponent statistics, the advice engine shall always return the same recommendation, numbers, explanation and grade.
- REQ-040 (Should): Hinted decisions — When the user requested a hint before acting, the grader shall still grade the decision but shall mark it hinted and exclude it from the major-error rate used for goal G-2.
- REQ-042 (Must): Hint on request — When the user clicks Hint during their turn, the Table screen shall show a hint card with the recommended action, the equity and required equity, the explanation, the opponent-model basis and any approximate or short-stack label.

Covers: REQ-036, REQ-040, REQ-042

## Notes
Together with E09-S02 (review entries equal the stored record) this gives the hint-versus-review equality UI test asked for by E07-S13. Cross-epic integration check (E09 is the same wave, so no dependency edge): whichever of E08-S02 and E09-S05 is finished second adds the end-to-end Playwright flow 'open Hint at the flop, call, hand ends, the review's flop entry shows the "hinted" tag and no other entry does'.

Plan key: E08-S02 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the user opens Hint at the flop decision and then calls, When the hand's record is read, Then the flop decision entry has hinted = true [REQ-042.5, REQ-040.1]
- [ ] #2 Given the user opens Hint and hides it again before acting, When the hand's record is read, Then that decision entry has hinted = true [REQ-040.1, REQ-042.5]
- [ ] #3 Given the user opens Hint at the flop decision only, When the hand's record is read, Then the preflop, turn and river decision entries have hinted = false [REQ-040.1]
- [ ] #4 Given the user opens Hint three times at one decision, When the hand's record is read, Then that decision has exactly one entry with hinted = true [REQ-040.1]
- [ ] #5 Given a hinted decision where the user calls with equity 10 points below required equity, When the hand's record is read, Then the decision is still graded Major error and has hinted = true [REQ-040.1]
- [ ] #6 Given a hint card shown at a decision where an opponent's observed hand count goes from 29 to 30 when the hand ends, When the hand's record is read, Then the decision's stored recommended action, equity %, required equity %, explanation and basis equal the values the hint card showed [REQ-036.2]

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

