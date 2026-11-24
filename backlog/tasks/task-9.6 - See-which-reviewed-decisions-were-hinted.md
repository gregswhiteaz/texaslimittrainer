---
id: TASK-9.6
title: See which reviewed decisions were hinted
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-24T15:43:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-9.3
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-9
priority: high
type: feature
ordinal: 91000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want a hinted tag on review entries where I had opened the hint, so that I can tell my own decisions apart from ones I made with help.

Reads the hinted flag of each decision entry in the hand record (E03-S10; E08-S02 sets it true when the hint was opened). A hinted decision is still graded and shows its grade plus a "hinted" tag. Tests use hand-record fixtures with the flag set. Cross-epic integration check: E08-S02 (same wave, so no dependency edge) sets the flag from the live Hint button; whichever of E08-S02 and E09-S05 is finished second adds the end-to-end Playwright flow 'open Hint at the flop, call, hand ends, the flop review entry shows "hinted" and no other entry does'.

## Requirements covered
- REQ-040 (Should): Hinted decisions — When the user requested a hint before acting, the grader shall still grade the decision but shall mark it hinted and exclude it from the major-error rate used for goal G-2.
- REQ-043 (Must): Hand Review panel — When a hand ends in which the user made any decision other than folding preflop, the Table screen shall open the Hand Review panel beside the table, unless auto-open is turned off in Settings.

Covers: REQ-040, REQ-043

## Notes
Fixture-based by design; the live end-to-end flow is the cross-epic check named in the context.

Plan key: E09-S05 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a hand record whose flop decision has hinted = true and whose other decisions have hinted = false, When the panel opens, Then the flop entry shows a "hinted" tag and no other entry does [REQ-043.5, REQ-040.2]
- [x] #2 Given a hinted decision graded Major error, When the panel opens, Then its entry shows both "Major error" and "hinted" [REQ-040.2]
- [x] #3 Given a hand with no hinted decisions, When the panel opens, Then no "hinted" tag appears [REQ-043.5]
- [x] #4 Given a hand with at least two user decisions where Hint was opened and hidden at the first only, When the review shows the hand, Then only the first entry is tagged hinted and the test asserts the hand had 2+ decisions (from TASK-8.2 judge J-1-01)
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
1. ReviewPanel: 'hinted' tag after the grade badge when entry.decision.hinted (right-aligned group; entry top row wraps)
2. Tests: acceptance with fixtures through the real hint state machine (flop hint, open+hide at first of 4 decisions, hinted major error); e2e cross-epic flow (Hint at flop → review flop entry tagged) and the 2+-decision live check, Chromium and WebKit with axe; docs

Full spec: doit/TASK-9.6/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-8.2 follow-up (doc-115).

Build: 'hinted' tag after the grade badge for hinted stored decisions; entry top row wraps; npm test 1232 passed, Playwright 250 passed; gate PASS.

Judge r1 PASS 9/9; live hint plans in Chromium+WebKit matched stored hinted flags; playtest 0 violations; CI green.
<!-- SECTION:NOTES:END -->
