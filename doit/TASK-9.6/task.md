File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-9.6 - See-which-reviewed-decisions-were-hinted.md

Task TASK-9.6 - See which reviewed decisions were hinted
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 91000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-24 11:29 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-9 - Review the hand just played
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 41 total):
└─ TASK-9.3 - See the numbers and reason behind each reviewed decision [completed]
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

Dependents (1 direct, 1 total):
└─ TASK-9 - Review the hand just played [To Do]

Description:
--------------------------------------------------
As a learner, I want a hinted tag on review entries where I had opened the hint, so that I can tell my own decisions apart from ones I made with help.

Reads the hinted flag of each decision entry in the hand record (E03-S10; E08-S02 sets it true when the hint was opened). A hinted decision is still graded and shows its grade plus a "hinted" tag. Tests use hand-record fixtures with the flag set. Cross-epic integration check: E08-S02 (same wave, so no dependency edge) sets the flag from the live Hint button; whichever of E08-S02 and E09-S05 is finished second adds the end-to-end Playwright flow 'open Hint at the flop, call, hand ends, the flop review entry shows "hinted" and no other entry does'.

## Requirements covered
- REQ-040 (Should): Hinted decisions — When the user requested a hint before acting, the grader shall still grade the decision but shall mark it hinted and exclude it from the major-error rate used for goal G-2.
- REQ-043 (Must): Hand Review panel — When a hand ends in which the user made any decision other than folding preflop, the Table screen shall open the Hand Review panel beside the table, unless auto-open is turned off in Settings.

Covers: REQ-040, REQ-043

## Notes
Fixture-based by design; the live end-to-end flow is the cross-epic check named in the context.

Plan key: E09-S05 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a hand record whose flop decision has hinted = true and whose other decisions have hinted = false, When the panel opens, Then the flop entry shows a "hinted" tag and no other entry does [REQ-043.5, REQ-040.2]
- [ ] #2 Given a hinted decision graded Major error, When the panel opens, Then its entry shows both "Major error" and "hinted" [REQ-040.2]
- [ ] #3 Given a hand with no hinted decisions, When the panel opens, Then no "hinted" tag appears [REQ-043.5]
- [ ] #4 Given a hand with at least two user decisions where Hint was opened and hidden at the first only, When the review shows the hand, Then only the first entry is tagged hinted and the test asserts the hand had 2+ decisions (from TASK-8.2 judge J-1-01)

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
AC added from TASK-8.2 follow-up (doc-115).

