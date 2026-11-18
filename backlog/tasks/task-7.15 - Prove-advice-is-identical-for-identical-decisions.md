---
id: TASK-7.15
title: Prove advice is identical for identical decisions
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-18T20:12:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-7.10
  - TASK-7.13
  - TASK-1.6
  - TASK-7.4
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-7
priority: high
type: feature
ordinal: 74000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a maintainer, I want a playtest option that recomputes the advice at every decision to prove it never changes, so that the trainer gives the same advice for the same situation every time.

Given the same PlayerView and observed opponent statistics, the advice engine always returns the same recommendation, numbers, explanation and grade. Adds the advice-determinism option to the E01 playtest CLI (REQ-062.1). The hint during a hand and the review entry after it must state the same recommendation and numbers, so review recomputes with the observed-stat snapshot taken at the decision point, not the stats updated by the finished hand.

## Requirements covered
- REQ-025 (Must): No hidden-information leakage — The engine shall give each bot, the advice engine and the grader only the information the acting player could see at that moment: their own hole cards, the board, all actions and stacks, and cards shown at earlier showdowns.
- REQ-036 (Must): Deterministic advice — Given the same player view and the same observed opponent statistics, the advice engine shall always return the same recommendation, numbers, explanation and grade.
- REQ-062 (Must): Headless playtest CLI — The project shall provide a command-line playtest runner that plays seeded bot-only hands with the production engine, checks invariants after every action and reports results.

Covers: REQ-025, REQ-036, REQ-062

## Notes
Until E06 bots exist, playtest seats use seeded random legal moves; advice is still computed at every seat's decision point. E08/E09 must add a UI test that the hint card and the review entry for the same decision show the same values.

Plan key: E07-S13 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given `npm run playtest -- --hands 10000 --seed 42 --check-advice`, When it runs, Then it recomputes advice and grade at every decision point (at least 10,000), compares action, numbers, explanation, basis and grade with the first result, reports 0 mismatches and exits 0 [REQ-036.1, REQ-062.1]
- [ ] #2 Given a test build whose advice output varies between calls, When the playtest runs with `--check-advice`, Then it prints the replay code and decision point of the first mismatch and exits non-zero [REQ-036.1]
- [ ] #3 Given a decision point where a hint was computed during the hand, When the review entry is computed after the hand ends, Then the recommendation, equity %, required equity %, explanation and basis are identical even though the finished hand changed opponents' observed stats [REQ-036.2]
- [ ] #4 Given a fixed decision point, When the other players' hole cards and the undealt cards are changed in 1,000 seeded variations, Then the hint and the grade of the user's action never change [REQ-025.2, REQ-025.3]
- [ ] #5 Given the same seed and options including `--check-advice`, When the playtest is run twice, Then the outputs are byte-identical [REQ-062.4]
- [ ] #6 Given a decision graded when a hint is shown and again in the review, When both grades are computed, Then gradeDecision on the stored recommendation gives a deep-equal GradeResult
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-7.4 follow-up (doc-19).
<!-- SECTION:NOTES:END -->
