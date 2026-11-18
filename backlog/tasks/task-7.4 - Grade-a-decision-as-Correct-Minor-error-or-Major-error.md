---
id: TASK-7.4
title: Grade a decision as Correct, Minor error or Major error
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-18T19:51:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-0
dependencies:
  - TASK-7.3
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-7
priority: high
type: feature
ordinal: 13000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want each of my decisions graded Correct, Minor error or Major error, so that I see which decisions cost me and how badly.

Grader rules: Correct when the action equals the recommended action or the listed acceptable alternative. Preflop: a deviation on a borderline cell is Minor, on any other cell Major. Postflop call/fold: folding when equity exceeds required equity by >= 10 points, or calling when equity is >= 10 points below required equity, is Major; smaller margins Minor. Postflop bet/raise versus check/call: Major only when equity against the calling range is >= 15 points away from 50%; otherwise Minor. Raise-versus-fold deviations use the call/fold margin (REQ-038.6). Close calls (under 10 / under 15 points) are never Major. The grader is a pure function of the user's action and a recommendation result (action, acceptable alternative, borderline flag, equity %, required equity %, equity against the calling range %) computed from the PlayerView at the decision point, never from later cards or the outcome. Its tests use injected recommendation fixtures, so this story does not wait for the value-bet rule (E07-S10) or the range model (E07-S07); in production the recommendation comes from the advice engine.

## Requirements covered
- REQ-025 (Must): No hidden-information leakage — The engine shall give each bot, the advice engine and the grader only the information the acting player could see at that moment: their own hole cards, the board, all actions and stacks, and cards shown at earlier showdowns.
- REQ-038 (Must): Grading rules — The grader shall grade each user decision Correct when it matches the recommendation or a listed acceptable alternative, Major error when the margin rules below mark it clearly wrong, and Minor error otherwise.

Covers: REQ-025, REQ-038

## Notes
The grade result also carries the recommendation it was based on, so Hand Review (E09) can show action, recommendation, numbers and grade from one object.

Plan key: E07-S04 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a decision whose action equals the recommended action or the listed acceptable alternative, When it is graded, Then the grade is Correct [REQ-038.1]
- [ ] #2 Given a preflop decision that deviates from the chart, When it is graded, Then it is a Minor error if the cell is flagged borderline and a Major error otherwise [REQ-038.2]
- [ ] #3 Given an injected recommendation to call, When the user folds with equity above required equity by 0.1, 9.9 and 10.0 points, Then the grades are Minor, Minor and Major [REQ-038.3, REQ-038.5]
- [ ] #4 Given an injected recommendation to fold, When the user calls with equity below required equity by 0.1, 9.9 and 10.0 points, Then the grades are Minor, Minor and Major [REQ-038.3, REQ-038.5]
- [ ] #5 Given an injected recommendation to bet or raise, When the user checks or calls with equity against the calling range of 64.9% and of 65.0%, Then the grades are Minor and Major [REQ-038.4, REQ-038.5]
- [ ] #6 Given an injected recommendation to check or call, When the user bets or raises with equity against the calling range of 35.1% and of 35.0%, Then the grades are Minor and Major [REQ-038.4, REQ-038.5]
- [ ] #7 Given a call graded Major error, When the next cards give the user the winning hand, Then the grade is still Major error because only the PlayerView at the decision point is used [REQ-025.3]
- [ ] #8 Given an injected recommendation to fold, When the user raises with equity below required equity by 9.9 and by 10.0 points, Then the grades are Minor and Major; and given an injected recommendation to raise, When the user folds with equity above required equity by 9.9 and by 10.0 points, Then the grades are Minor and Major [REQ-038.6]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
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
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. src/advice/grade.ts: GradeResult (stable codes + GRADE_LABELS), gradeDecision(rec, actionType) pure, gradeView(view, actionType, options?) — legality check, one recommend() call.
2. Rules: match / alternative -> Correct; preflop borderline -> Minor, other chart deviation -> Major (REQ-038.1/2); postflop call/fold margin in integer tenths (>=10 pts Major); aggression vs calling-range distance from 50% (>=15 pts Major); aggression without calling-range number -> Minor (aggression-no-range, Q-2).
3. Impossible action pairs throw RangeError; illegal action throws.
4. Tests: acceptance AC#1-8 plus exact 10/15-point boundaries in both rounding directions (SPEC-17), hidden-card invariance, determinism; unit tests.

Full spec: doit/TASK-7.4/spec.md
<!-- SECTION:PLAN:END -->
