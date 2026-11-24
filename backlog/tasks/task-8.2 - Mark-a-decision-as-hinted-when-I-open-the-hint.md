---
id: TASK-8.2
title: Mark a decision as hinted when I open the hint
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-24T11:29:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-8.1
  - TASK-3.12
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-115
parent_task_id: TASK-8
priority: high
type: feature
ordinal: 88000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want decisions where I looked at the hint to be recorded as hinted, so that my progress measures count only the decisions I made on my own.

A decision is hinted when the hint card was opened at that decision point before the user acted (REQ-040.1), even if it was hidden again. Opening the hint sets hinted = true on that decision's entry in the hand record (E03-S10 stores the flag, false by default). The grader still grades hinted decisions; E09 shows the 'hinted' tag, E10 reports hint usage and E11 excludes hinted decisions from the G-2 rate. The stored advice for the decision is the same advice the hint card showed (decision-time observed-stats snapshot, REQ-036.2).

## Requirements covered
- REQ-036 (Must): Deterministic advice — Given the same player view and the same observed opponent statistics, the advice engine shall always return the same recommendation, numbers, explanation and grade.
- REQ-040 (Should): Hinted decisions — When the user requested a hint before acting, the grader shall still grade the decision but shall mark it hinted and exclude it from the major-error rate used for goal G-2.
- REQ-042 (Must): Hint on request — When the user clicks Hint during their turn, the Table screen shall show a hint card with the recommended action, the equity and required equity, the explanation, the opponent-model basis and any approximate or short-stack label.

Covers: REQ-036, REQ-040, REQ-042

## Notes
Together with E09-S02 (review entries equal the stored record) this gives the hint-versus-review equality UI test asked for by E07-S13. Cross-epic integration check (E09 is the same wave, so no dependency edge): whichever of E08-S02 and E09-S05 is finished second adds the end-to-end Playwright flow 'open Hint at the flop, call, hand ends, the review's flop entry shows the "hinted" tag and no other entry does'.

Plan key: E08-S02 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the user opens Hint at the flop decision and then calls, When the hand's record is read, Then the flop decision entry has hinted = true [REQ-042.5, REQ-040.1]
- [x] #2 Given the user opens Hint and hides it again before acting, When the hand's record is read, Then that decision entry has hinted = true [REQ-040.1, REQ-042.5]
- [x] #3 Given the user opens Hint at the flop decision only, When the hand's record is read, Then the preflop, turn and river decision entries have hinted = false [REQ-040.1]
- [x] #4 Given the user opens Hint three times at one decision, When the hand's record is read, Then that decision has exactly one entry with hinted = true [REQ-040.1]
- [x] #5 Given a hinted decision where the user calls with equity 10 points below required equity, When the hand's record is read, Then the decision is still graded Major error and has hinted = true [REQ-040.1]
- [x] #6 Given a hint card shown at a decision where an opponent's observed hand count goes from 29 to 30 when the hand ends, When the hand's record is read, Then the decision's stored recommended action, equity %, required equity %, explanation and basis equal the values the hint card showed [REQ-036.2]
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
1. hintedAt(hint, hand) in src/table/hint.ts reads the existing per-decision hint state
2. act(action, hinted?) → applyUserAction(table, action, observed?, hinted) sets UserDecision.hinted only when true
3. decisionRecord writes hinted: decision.hinted === true (format unchanged)
4. Tests: acceptance per AC with the real hint state machine, hintedAt units, e2e/hinted.spec.ts reading stored records

Full spec: doit/TASK-8.2/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: hintedAt + act(action, hinted) → UserDecision.hinted (only when true) → decisionRecord hinted; npm test 1203 passed, Playwright 228 passed; gate PASS. SPEC-05 uses a different REVIEW_DECK line (Ben check line never uses observed stats) — recorded in qa.md.

Judge r1 PASS 10/10; live IndexedDB checks in Chromium+WebKit; CI 45383603636 green.

Follow-ups: TASK-9.6 AC added (2+ decisions, only the hinted one tagged). Not tracked: redundant hinted===true NIT (no behaviour change).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Hint opened at a decision now stores hinted:true on that decision's hand-record entry only (survives hide and repeat opens, also set if the card was loading or failed). Grading and stored advice are unchanged: advice equals the card via the shared observed-stats snapshot. Verified: 1203 tests, lint, typecheck, golden 282/282, 10,000-hand playtest 0 violations, e2e on Chromium and WebKit, judge 10/10, CI green. Review: A-1..A-5 and the SPEC-05 hand-line deviation (auto-accepted). Follow-ups: strengthen SPEC-08 e2e to assert 2+ decisions; drop redundant hinted===true. Review tag is TASK-9.6, hint-usage reporting E10, G-2 exclusion E11.
<!-- SECTION:FINAL_SUMMARY:END -->
