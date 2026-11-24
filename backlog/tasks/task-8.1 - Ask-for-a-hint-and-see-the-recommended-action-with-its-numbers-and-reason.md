---
id: TASK-8.1
title: Ask for a hint and see the recommended action with its numbers and reason
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-24T10:51:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-3.2
  - TASK-3.6
  - TASK-7.10
  - TASK-7.13
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-8
priority: high
type: feature
ordinal: 76000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
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
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given 1,000 seeded table states at preflop, flop, turn and river where the user's action bar is enabled, When the bar is shown, Then a Hint button is present in every state [REQ-022.2]
- [x] #2 Given scripted 6-max flop, turn and river decisions, the flop one where Ben bets $4 into a $26 pot, When the user opens Hint at each, Then the hint card shows the recommended action, equity % and required equity % to one decimal place, the explanation and the basis for Ben, each equal to the advice engine output for the user's PlayerView and observed-stats snapshot at that decision [REQ-042.1, REQ-042.6, REQ-035.4]
- [x] #3 Given a 6-max preflop decision holding A9o in the cutoff, When the user opens Hint, Then the card shows the chart basis "From the 6-max chart: raise A9o from the cutoff", the explanation and the basis "typical player" equal to the advice engine output, and shows no equity % or required equity % [REQ-042.6, REQ-042.1, REQ-035.4]
- [x] #4 Given a multiway postflop decision against one opponent observed for 45 hands and one observed for 12, When the user opens Hint, Then the card shows "based on 45 hands of this opponent" for the first and "typical player" for the second [REQ-035.4]
- [x] #5 Given the hint card is open on a 10-seat table at a 1280 x 720 window, When the layout is measured, Then the card's bounding box does not overlap the action bar and every action button can still be clicked [REQ-042.2]
- [x] #6 Given the hint card is open, When the user selects the Hide hint button, Then the card is hidden and the button reads "Hint" again [REQ-042.3]
- [x] #7 Given the hint card is open or a hint is still being computed, When the user folds, checks, calls, bets or raises, Then no card is shown after the action and none is shown at the user's next decision unless Hint is selected again [REQ-042.3]
- [x] #8 Given a session in which the user opens Hint at 50 consecutive decisions and opens and hides it 10 times within one decision, When each hint is requested, Then the card is shown every time and no limit, counter or cost is shown [REQ-042.4]
- [x] #9 Given a hint request, When advice is computed, Then it runs off the main thread so the table UI stays responsive (REQ-055.6)
- [x] #10 Given the action bar, When it is enabled on the user's turn, Then it includes the Hint button, and when it is disabled the Hint button is absent or disabled
- [x] #11 Given a hint is shown, When the card renders, Then it shows the recommendation's explanation text (TASK-7.10) exactly as returned
- [x] #12 Given a check-free or value explanation where equity against all hands is above 50% but equity against the hands that would call is not, When the hint shows it, Then the sentence comparing to 50.0% names which equity it means (not a bare 'That')
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [x] #2 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [x] #3 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [x] #4 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [x] #5 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [x] #6 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [x] #7 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [x] #8 No new network requests beyond the app's own files [REQ-058.1]
- [x] #9 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [x] #10 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [x] #11 Story documentation is written and published to Backlog.md
- [x] #12 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Session tracks per-bot observed counts (by bot id) at each hand rollover; userObservedSnapshot(t) builds {seat, hands, vpip, pfr} for bot seats; act passes it to applyUserAction; restarts at 0 after Resume (Q-3)
2. Advice client sends the snapshot with recommend
3. Pure src/table/hint.ts builds the hint card model (action label, equity numbers, opponent ranges basis, preflop chart line)
4. UI: Hint / Hide hint button beside the action group; hint card between table ring and action row (loading, error, reuse within a decision); hidden on any action
5. AC#12 template wording; re-pin explain.test.ts strings
6. Tests per AC incl. 1,000 seeded states, Playwright flow in Chromium and WebKit with axe

Full spec: doit/TASK-8.1/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-7.3 follow-up (doc-17).

AC added from TASK-3.2 follow-up (doc-22).

AC added from TASK-7.10 follow-up.

AC added from TASK-7.10 judge J-1-01 (value-rule copy clarity).

Build: observed counts per bot (outside TableState, restart on Resume), snapshot passed to applyUserAction and recommend, hint card, AC#12 wording; npm test 1197 passed, Playwright full suite green after TASK-3.1 allow-list edit; gate PASS. Blocks resolved: counts moved out of TableState (locked restore tests untouched); e2e/table.spec.ts allow-list gains Hint under TASK-3.1.

Judge r1 PASS 23/23; real app Chromium+WebKit (preflop/postflop cards, loading/error, layout, axe); CI 45376916865 green on c289b60.
<!-- SECTION:NOTES:END -->
