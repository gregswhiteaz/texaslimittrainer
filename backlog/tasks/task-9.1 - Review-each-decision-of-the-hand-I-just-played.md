---
id: TASK-9.1
title: Review each decision of the hand I just played
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-19T02:21:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-0
dependencies:
  - TASK-3.4
  - TASK-7.4
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-26
parent_task_id: TASK-9
priority: high
type: feature
ordinal: 20000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
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
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a scripted hand in which the user made 4 decisions and the bots made 9, When the hand ends, Then the Hand Review panel opens beside the table with exactly 4 entries in the order made, each showing street, the board at that point, the user's action and the recommended action, and no entry for any bot decision [REQ-043.2]
- [x] #2 Given the same scripted hand, When the panel opens, Then each entry's grade equals the E07-S04 grader output for the user's PlayerView at that decision and is shown as the text label Correct, Minor error or Major error, not by colour alone [REQ-057.3, REQ-043.2]
- [x] #3 Given a hand in which the user's single action was folding preflop at their first decision, When the hand ends, Then no panel opens and the next hand is dealt 1.5 s after the result is shown [REQ-024.3, REQ-043.12]
- [x] #4 Given a hand in which the user is the big blind and every other player folds, so the user made no decision, When the hand ends, Then no panel opens and the next hand is dealt 1.5 s after the result is shown [REQ-024.3]
- [x] #5 Given the panel is open, When 10 s pass with no input, Then no next hand has been dealt [REQ-024.2]
- [x] #6 Given the panel is open, When the user selects Deal next hand, Then the panel closes and the next hand is dealt with the hand number increased by 1 [REQ-043.7, REQ-024.2]
- [x] #7 Given the panel is open, When the user selects Close, Then the panel closes, the hand's result and the Deal next hand control stay visible on the table, and after 10 s no next hand has been dealt until the user selects Deal next hand [REQ-043.7, REQ-043.10]
- [x] #8 Given a hand in which the user called $8 preflop and then folded preflop to a re-raise, When the hand ends, Then the panel opens with exactly 2 entries, the call and the fold, and no next hand is dealt until the user chooses [REQ-043.12]
- [x] #9 Given the Hand Review panel is open when a hand ends, When the 1.5 s auto-deal would fire, Then useTableSession's holdNextHand holds it, and 'Deal next hand' calls dealNext() (dealHand(nextHand(t), newCode())); the hold remains after Close (REQ-043.10)
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
1. src/table/review.ts (headless): opensReview(hand) — open unless the user made no decision or only a single preflop fold; reviewEntries(completed) — grade each user decision once at hand end with gradeView on its stored view and the user's action type, entry = street, board at that point, user action label, advice label (recommendation.move via actionLabel), GradeResult.
2. src/ui/table/ReviewPanel.tsx: complementary aside 'Hand #N review', × 'Close review' 44x44, a 'Decisions' list with uppercase street, small drawn 'Community cards' (30x42), 'You: Call $4 · Advice: Fold' and a text grade badge (#2F6FE0 / #9A5B00 / #A3151C, white text); focus moves to the heading on open.
3. useTableSession: holdNextHand while a reviewed hand is held; dealNext() draws a fresh code and runs dealHand(nextHand(t), code); the hold stays after Close (REQ-043.10).
4. Table: red Deal next hand on the table side only while a reviewed hand is held; Close keeps the result and the button; layout gives the panel 400 px beside the table at 1280 wide.
5. Tests: review model unit and acceptance tests over scripted hands (4 user and 9 bot decisions, call then fold, preflop fold only, big-blind walk); panel markup; e2e in Chromium + WebKit (open, 10 s hold, Deal next hand, Close then hold, no-panel cases auto-deal at 1.5 s, axe); earlier specs unchanged.

Full spec: doit/TASK-9.1/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-3.4 follow-up (doc-25).

Build: src/table/review.ts (opensReview, reviewEntries graded once at hand end), ReviewPanel (Hand #N review, Decisions list, drawn board, exact-amount 'You/Advice' line, text grade badges per Q-1), dealNext + holdNextHand, Deal next hand on the table side, Close keeps the hold; stable onHandComplete; no earlier tests edited; e2e 86 passed Chromium + WebKit; gate PASS. Screenshots: doit/TASK-9.1/review-open.png, review-closed.png (vertical scroll at 1280x720, fit is TASK-3.16).

CI run 44441353985: attempt 1 failed only at 'Install Playwright system dependencies' (dpkg lock held by another apt-get on the runner; same on main run 44434902016); attempt 2 success incl. E2E. Judge round 1: PASS 14/14, no blocking; 400 seeded hands headless: review opened exactly per REQ-043.12, all 817 entries matched independent grading; 40 browser hands: no-panel hands dealt in 1500-1550 ms, panel hands held 10 s, Deal next hand (incl. double-click and Enter) dealt exactly one hand, Leave while held dealt nothing, axe clean. Follow-ups (Step 6a): created TASK-1.29 (CI apt lock); ACs added to TASK-3.16, 9.3, 9.4, 9.7, 9.2, 2.2, 13.11, 3.9.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added the Hand Review panel: after a hand with any user decision other than a lone preflop fold, a panel beside the table lists each decision (street, board, You/Advice with exact amounts, Correct/Minor/Major badge graded by gradeView on the captured view). The auto-deal is held until "Deal next hand" (Close keeps the hold); no-review hands still auto-deal after 1.5 s. Verification: npm test 260 passed; e2e/review.spec.ts 6/6 in Chromium and WebKit; full e2e 86 passed; review round 1 clean (code: 11 mutants caught, 2 unobservable; security clean). Judge and CI pending. Assumptions A-1..A-8 to review (see doc). Risks: at 1280x720 Deal next hand is below the fold while the panel is open (TASK-3.16); size 1153 lines/10 files vs 1000 budget. Follow-ups: TASK-3.16, 9.3, 9.4, 9.7, 9.2, 2.2/7.6, 13.11, plus a test that onHandComplete stays stable.
<!-- SECTION:FINAL_SUMMARY:END -->
