File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-8.1 - Ask-for-a-hint-and-see-the-recommended-action-with-its-numbers-and-reason.md

Task TASK-8.1 - Ask for a hint and see the recommended action with its numbers and reason
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 76000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-23 09:33 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-8 - Ask for a hint
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (4 direct, 22 total):
├─ TASK-3.2 - Choose only legal actions with their exact amounts [completed]
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
├─ TASK-3.6 - Keep the table responsive while bots and advice compute [completed]
│  └─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed] (shown above)
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

Dependents (7 direct, 12 total):
├─ TASK-5.3 - Read every sit-and-go chip amount without a $ sign [To Do]
│  └─ TASK-5 - Play a sit-and-go [To Do]
├─ TASK-8 - Ask for a hint [To Do]
├─ TASK-8.2 - Mark a decision as hinted when I open the hint [To Do]
│  └─ TASK-8 - Ask for a hint [To Do] (shown above)
├─ TASK-8.3 - Get the hint card within one second [To Do]
│  ├─ TASK-8 - Ask for a hint [To Do] (shown above)
│  └─ TASK-13.10 - Keep every screen within its time limits with 100,000 stored hands [To Do]
│     └─ TASK-13 - Rely on a private offline app [To Do]
├─ TASK-8.4 - See approximate and short-stack labels on the hint card [To Do]
│  └─ TASK-8 - Ask for a hint [To Do] (shown above)
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
As a learner, I want to see a hint card on request during my turn with the recommended play explained, so that I learn the right play at the moment I need it.

Per the Table storyboard the action bar holds the action buttons plus a Hint button; while the card is open the button reads "Hide hint". The hint card sits between the board and the action bar and never covers it. The card shows the advice engine result for the user's PlayerView and the observed-stats snapshot at this decision point: recommended action, equity % and required equity % (one decimal), the plain-English explanation (E07-S12, at most three sentences) and the opponent-model basis per opponent ('typical player' or 'based on N hands of this opponent', E07-S09; preflop basis is 'typical player'). Hints are unlimited and free. The hint is requested through the advice worker (E03-S12) so the table stays responsive (REQ-055.6). Clicking Hint again or taking any action hides the card. Preflop decisions show the chart basis (e.g. 'From the 6-max chart: raise A9o from the cutoff') instead of equity and required-equity numbers; flop, turn and river show the numbers (REQ-042.6).

## Requirements covered
- REQ-022 (Must): Action bar — When it is the user's turn, the Table screen shall show an action bar of buttons labelled with the action and its exact amount, plus a Hint button, operated by mouse or touch.
- REQ-035 (Must): Opponent range model — The advice engine shall estimate each opponent's range from that opponent's actions in the hand, starting from documented default ranges per action and adjusting toward the opponent's observed session statistics once 30 or more hands of that opponent have been observed.
- REQ-042 (Must): Hint on request — When the user clicks Hint during their turn, the Table screen shall show a hint card with the recommended action, the equity and required equity, the explanation, the opponent-model basis and any approximate or short-stack label.

Covers: REQ-022, REQ-035, REQ-042

## Notes
Hint label toggling follows the storyboard (Hint / Hide hint). Approximate and short-stack labels on the card are E08-S03; the hinted flag is E08-S02.

Plan key: E08-S01 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given 1,000 seeded table states at preflop, flop, turn and river where the user's action bar is enabled, When the bar is shown, Then a Hint button is present in every state [REQ-022.2]
- [ ] #2 Given scripted 6-max flop, turn and river decisions, the flop one where Ben bets $4 into a $26 pot, When the user opens Hint at each, Then the hint card shows the recommended action, equity % and required equity % to one decimal place, the explanation and the basis for Ben, each equal to the advice engine output for the user's PlayerView and observed-stats snapshot at that decision [REQ-042.1, REQ-042.6, REQ-035.4]
- [ ] #3 Given a 6-max preflop decision holding A9o in the cutoff, When the user opens Hint, Then the card shows the chart basis "From the 6-max chart: raise A9o from the cutoff", the explanation and the basis "typical player" equal to the advice engine output, and shows no equity % or required equity % [REQ-042.6, REQ-042.1, REQ-035.4]
- [ ] #4 Given a multiway postflop decision against one opponent observed for 45 hands and one observed for 12, When the user opens Hint, Then the card shows "based on 45 hands of this opponent" for the first and "typical player" for the second [REQ-035.4]
- [ ] #5 Given the hint card is open on a 10-seat table at a 1280 x 720 window, When the layout is measured, Then the card's bounding box does not overlap the action bar and every action button can still be clicked [REQ-042.2]
- [ ] #6 Given the hint card is open, When the user selects the Hide hint button, Then the card is hidden and the button reads "Hint" again [REQ-042.3]
- [ ] #7 Given the hint card is open or a hint is still being computed, When the user folds, checks, calls, bets or raises, Then no card is shown after the action and none is shown at the user's next decision unless Hint is selected again [REQ-042.3]
- [ ] #8 Given a session in which the user opens Hint at 50 consecutive decisions and opens and hides it 10 times within one decision, When each hint is requested, Then the card is shown every time and no limit, counter or cost is shown [REQ-042.4]
- [ ] #9 Given a hint request, When advice is computed, Then it runs off the main thread so the table UI stays responsive (REQ-055.6)
- [ ] #10 Given the action bar, When it is enabled on the user's turn, Then it includes the Hint button, and when it is disabled the Hint button is absent or disabled
- [ ] #11 Given a hint is shown, When the card renders, Then it shows the recommendation's explanation text (TASK-7.10) exactly as returned
- [ ] #12 Given a check-free or value explanation where equity against all hands is above 50% but equity against the hands that would call is not, When the hint shows it, Then the sentence comparing to 50.0% names which equity it means (not a bare 'That')

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
AC added from TASK-7.3 follow-up (doc-17).

AC added from TASK-3.2 follow-up (doc-22).

AC added from TASK-7.10 follow-up.

AC added from TASK-7.10 judge J-1-01 (value-rule copy clarity).

