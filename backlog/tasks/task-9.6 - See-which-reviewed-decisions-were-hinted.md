---
id: TASK-9.6
title: See which reviewed decisions were hinted
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
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
- [ ] #1 Given a hand record whose flop decision has hinted = true and whose other decisions have hinted = false, When the panel opens, Then the flop entry shows a "hinted" tag and no other entry does [REQ-043.5, REQ-040.2]
- [ ] #2 Given a hinted decision graded Major error, When the panel opens, Then its entry shows both "Major error" and "hinted" [REQ-040.2]
- [ ] #3 Given a hand with no hinted decisions, When the panel opens, Then no "hinted" tag appears [REQ-043.5]
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
