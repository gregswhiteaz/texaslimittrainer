File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-9.1 - Review-each-decision-of-the-hand-I-just-played.md

Task TASK-9.1 - Review each decision of the hand I just played
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 20000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-19 01:10 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-0
Parent: TASK-9 - Review the hand just played
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (2 direct, 16 total):
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

Dependents (8 direct, 21 total):
├─ TASK-9 - Review the hand just played [To Do]
├─ TASK-9.2 - Continue to rebuy or leave when I bust with the review open [To Do]
│  ├─ TASK-5.8 - See results when I bust in a sit-and-go with the review open [To Do]
│  │  └─ TASK-5 - Play a sit-and-go [To Do]
│  └─ TASK-9 - Review the hand just played [To Do] (shown above)
├─ TASK-9.3 - See the numbers and reason behind each reviewed decision [To Do]
│  ├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do]
│  │  └─ TASK-5 - Play a sit-and-go [To Do] (shown above)
│  ├─ TASK-9 - Review the hand just played [To Do] (shown above)
│  ├─ TASK-9.6 - See which reviewed decisions were hinted [To Do]
│  │  └─ TASK-9 - Review the hand just played [To Do] (shown above)
│  ├─ TASK-9.8 - Get the review panel within one second of the hand ending [To Do]
│  │  ├─ TASK-9 - Review the hand just played [To Do] (shown above)
│  │  └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do]
│  │     └─ TASK-13 - Rely on a private offline app [To Do]
│  └─ TASK-9.9 - See approximate and short-stack labels in review entries [To Do]
│     └─ TASK-9 - Review the hand just played [To Do] (shown above)
├─ TASK-9.4 - See the hand number, my cards, position, result and replay code in the review [To Do]
│  └─ TASK-9 - Review the hand just played [To Do] (shown above)
├─ TASK-9.5 - See opponents' cards in the review only when they were shown at showdown [To Do]
│  └─ TASK-9 - Review the hand just played [To Do] (shown above)
├─ TASK-9.7 - See a grade summary badge after each hand when auto-open is off [To Do]
│  ├─ TASK-9 - Review the hand just played [To Do] (shown above)
│  └─ TASK-12.6 - Turn off automatic opening of the Hand Review panel [To Do]
│     ├─ TASK-12 - Tune the trainer [To Do]
│     └─ TASK-12.4 - Delete all my data after confirming [To Do]
│        └─ TASK-12 - Tune the trainer [To Do] (shown above)
├─ TASK-13.4 - Use every screen offline after the first visit [To Do]
│  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  ├─ TASK-13.8 - Get new versions at the next launch, never mid-session [To Do]
│  │  ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  │  └─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do]
│  │     └─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│  └─ TASK-13.9 - Reach Home within 3 seconds on a repeat launch [To Do]
│     ├─ TASK-13 - Rely on a private offline app [To Do] (shown above)
│     └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do] (shown above)
└─ TASK-13.11 - Prove every screen passes automated accessibility checks [To Do] (shown above)

Description:
--------------------------------------------------
As a learner, I want a review panel after each hand that grades every decision I made, so that I see straight away which of my plays were right or wrong.

Walking-skeleton slice of the Hand Review panel (Review storyboard: panel beside the table, result and Deal next hand on the table side, Close button in the panel). When a hand ends in which the user made any decision other than folding preflop, the panel opens; it is skipped only when the user's single action in the hand was a preflop fold, so a hand where the user called or raised preflop and then folded preflop opens it (REQ-043.12). In M1 it reads the completed hand exposed by E03-S01 and grades each user decision with the E07-S04 grader on that decision's PlayerView; each entry shows street, board at that point, the user's action, the recommended action and the grade as text (Correct, Minor error, Major error) with its colour badge. Bot decisions are never graded. Explanations, numbers and basis arrive in M2 (E09-S02) once E07-S12 exists: do not show placeholder text for them. While the panel is open the E03-S04 automatic 1.5 s deal is suspended and the next hand waits for Deal next hand.

## Requirements covered
- REQ-024 (Must): Between hands — When a hand ends, TLH Trainer shall show the result, and shall deal the next hand only after the user clicks Deal next hand if the Hand Review panel is open, or automatically after 1.5 seconds if it is not.
- REQ-043 (Must): Hand Review panel — When a hand ends in which the user made any decision other than folding preflop, the Table screen shall open the Hand Review panel beside the table, unless auto-open is turned off in Settings.
- REQ-057 (Should): Accessibility and usability — Every screen shall meet WCAG 2.1 AA contrast and control-labelling rules, and every grade or status shown in colour shall also be shown as text.

Covers: REQ-024, REQ-043, REQ-057

## Notes
Gate the same next-hand timer E03-S04 uses; after Close the timer stays suspended until Deal next hand (REQ-043.10).

Plan key: E09-S01 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a scripted hand in which the user made 4 decisions and the bots made 9, When the hand ends, Then the Hand Review panel opens beside the table with exactly 4 entries in the order made, each showing street, the board at that point, the user's action and the recommended action, and no entry for any bot decision [REQ-043.2]
- [ ] #2 Given the same scripted hand, When the panel opens, Then each entry's grade equals the E07-S04 grader output for the user's PlayerView at that decision and is shown as the text label Correct, Minor error or Major error, not by colour alone [REQ-057.3, REQ-043.2]
- [ ] #3 Given a hand in which the user's single action was folding preflop at their first decision, When the hand ends, Then no panel opens and the next hand is dealt 1.5 s after the result is shown [REQ-024.3, REQ-043.12]
- [ ] #4 Given a hand in which the user is the big blind and every other player folds, so the user made no decision, When the hand ends, Then no panel opens and the next hand is dealt 1.5 s after the result is shown [REQ-024.3]
- [ ] #5 Given the panel is open, When 10 s pass with no input, Then no next hand has been dealt [REQ-024.2]
- [ ] #6 Given the panel is open, When the user selects Deal next hand, Then the panel closes and the next hand is dealt with the hand number increased by 1 [REQ-043.7, REQ-024.2]
- [ ] #7 Given the panel is open, When the user selects Close, Then the panel closes, the hand's result and the Deal next hand control stay visible on the table, and after 10 s no next hand has been dealt until the user selects Deal next hand [REQ-043.7, REQ-043.10]
- [ ] #8 Given a hand in which the user called $8 preflop and then folded preflop to a re-raise, When the hand ends, Then the panel opens with exactly 2 entries, the call and the fold, and no next hand is dealt until the user chooses [REQ-043.12]
- [ ] #9 Given the Hand Review panel is open when a hand ends, When the 1.5 s auto-deal would fire, Then useTableSession's holdNextHand holds it, and 'Deal next hand' calls dealNext() (dealHand(nextHand(t), newCode())); the hold remains after Close (REQ-043.10)

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
AC added from TASK-3.4 follow-up (doc-25).

