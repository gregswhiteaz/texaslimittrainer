File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-9.7 - See-a-grade-summary-badge-after-each-hand-when-auto-open-is-off.md

Task TASK-9.7 - See a grade summary badge after each hand when auto-open is off
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 92000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-19 02:21 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-9 - Review the hand just played
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 17 total):
└─ TASK-9.1 - Review each decision of the hand I just played [completed]
   ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed]
   │  └─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed]
   │     ├─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
   │     │  ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
   │     │  │  └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
   │     │  │     ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
   │     │  │     │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
   │     │  │     │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
   │     │  │     └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
   │     │  │        └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   │     │  ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
   │     │  │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
   │     │  └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
   │     │     ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
   │     │     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
   │     │     ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
   │     │     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
   │     │     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
   │     │        ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
   │     │        │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
   │     │        └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
   │     └─ TASK-3.5 - Read big-index cards drawn in code [completed] (shown above)
   └─ TASK-7.4 - Grade a decision as Correct, Minor error or Major error [completed]
      └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed] (shown above)

Dependents (2 direct, 4 total):
├─ TASK-9 - Review the hand just played [To Do]
└─ TASK-12.6 - Turn off automatic opening of the Hand Review panel [To Do]
   ├─ TASK-12 - Tune the trainer [To Do]
   └─ TASK-12.4 - Delete all my data after confirming [To Do]
      └─ TASK-12 - Tune the trainer [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want a grade summary badge I can click to open the review when auto-open is off, so that I keep a fast pace and still see when I made a mistake.

When the auto-open setting (REQ-050.2, default on; the Settings toggle is E12) is off, the panel does not open by itself. Instead a grade summary badge such as "1 Major, 1 Minor" appears after each played hand; clicking it opens the panel for that hand. While the panel is not open the next hand is dealt 1.5 s after the result (REQ-024.3); once opened, the next hand waits for Deal next hand (REQ-024.2). Tests set the setting value directly until E12 exists. The badge reads "All correct" when there are no errors, disappears when the next hand is dealt and is not shown after a preflop fold (REQ-043.11). With auto-open off the badge also appears after a hand where the user called or raised preflop and then folded preflop (REQ-043.13).

## Requirements covered
- REQ-024 (Must): Between hands — When a hand ends, TLH Trainer shall show the result, and shall deal the next hand only after the user clicks Deal next hand if the Hand Review panel is open, or automatically after 1.5 seconds if it is not.
- REQ-043 (Must): Hand Review panel — When a hand ends in which the user made any decision other than folding preflop, the Table screen shall open the Hand Review panel beside the table, unless auto-open is turned off in Settings.
- REQ-057 (Should): Accessibility and usability — Every screen shall meet WCAG 2.1 AA contrast and control-labelling rules, and every grade or status shown in colour shall also be shown as text.

Covers: REQ-024, REQ-043, REQ-057

## Notes
E12 wires the Settings toggle to this setting.

Plan key: E09-S07 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given auto-open is off and a hand in which the user's decisions were graded 1 Major error, 1 Minor error and 2 Correct, When the hand ends, Then the panel does not open, a badge reading "1 Major, 1 Minor" appears and the next hand is dealt 1.5 s after the result is shown [REQ-043.8, REQ-024.3]
- [ ] #2 Given the badge is shown and the next hand has not been dealt, When the user clicks the badge, Then the panel opens for that hand and the next hand waits for Deal next hand [REQ-043.8, REQ-024.2]
- [ ] #3 Given auto-open is on, When a hand with user decisions ends, Then the panel opens and no badge is shown [REQ-043.8]
- [ ] #4 Given auto-open is off and every decision in the hand was graded Correct, When the hand ends, Then the badge reads "All correct" [REQ-043.11, REQ-057.3]
- [ ] #5 Given auto-open is off and a badge is shown, When the next hand is dealt, Then the badge is no longer shown [REQ-043.11]
- [ ] #6 Given auto-open is off, When a hand ends in which the user's single action was folding preflop, Then no badge is shown; and When a hand ends in which the user called $8 preflop and then folded preflop to a re-raise, Then a badge is shown for that hand [REQ-043.11, REQ-043.13]
- [ ] #7 Given the auto-open setting, When a hand ends, Then the panel opens only if the setting is on and opensReview is true, and otherwise a summary badge built from the reviewEntries grades is shown

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

