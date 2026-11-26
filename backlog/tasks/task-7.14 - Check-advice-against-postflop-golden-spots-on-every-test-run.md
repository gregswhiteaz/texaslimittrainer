---
id: TASK-7.14
title: Check advice against postflop golden spots on every test run
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-26T01:56:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-7.11
  - TASK-7.13
  - TASK-7.8
  - TASK-7.9
  - TASK-7.4
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-111
parent_task_id: TASK-7
priority: high
type: feature
ordinal: 73000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want the postflop advice checked on every test run against curated spots with agreed answers, so that I can trust the postflop advice and its grades.

Golden-spot suite, part 2: at least 100 postflop spots across flop, turn and river, bringing the suite to at least 200, plus graded examples of each grade level. Clear-cut mechanically means call/fold spots at least 10 points from required equity and bet/check spots at least 15 points from 50% against the calling range. The suite runs in `npm test` and must pass 100%.

## Requirements covered
- REQ-037 (Must): Plain-English explanations — Every recommendation shall include an explanation of at most three sentences in plain English that names and briefly explains the poker concept behind it.
- REQ-038 (Must): Grading rules — The grader shall grade each user decision Correct when it matches the recommendation or a listed acceptable alternative, Major error when the margin rules below mark it clearly wrong, and Minor error otherwise.
- REQ-039 (Must): Golden spot suite — The project shall keep a golden-spot suite of at least 200 clear-cut decisions with justified recommended actions, and the automated test run shall fail if the advice engine disagrees with any of them.
- REQ-061 (Should): Legal and content — TLH Trainer shall use play money only and shall contain only strategy text and data written for this project.

Covers: REQ-037, REQ-038, REQ-039, REQ-061

Plan key: E07-S15 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the golden-spot suite, When spots are counted, Then there are at least 100 postflop spots covering flop, turn and river and at least 200 spots in total [REQ-039.1]
- [x] #2 Given a postflop call/fold spot within 10 points of required equity, or a bet/check spot within 15 points of 50% against the calling range, When the spot validator runs, Then it rejects the spot as not clear-cut [REQ-039.3]
- [x] #3 Given the graded examples in the suite, When `npm test` runs, Then at least one preflop and one postflop example of each grade (Correct, Minor error, Major error) is graded as recorded [REQ-038.1, REQ-038.2, REQ-038.3, REQ-038.4]
- [x] #4 Given every postflop golden spot, When its explanation is checked, Then it quotes the equity % and required equity % the recommendation returns [REQ-037.4]
- [x] #5 Given the complete suite, When `npm test` runs, Then 100% of golden spots pass [REQ-039.4]
- [x] #6 Given the golden spot suite, When it runs, Then it includes graded examples at Correct, Minor error and Major error, preflop and postflop, each asserting the exact grade, rule id and margin
- [x] #7 Given preflop spot fr-btn-raise-88 (button holding 88 facing a hijack open, chart says call), When the spot set is extended, Then the chart cell is reviewed for call vs re-raise and the chart and spot agree on the chosen answer with a justification
- [x] #8 Given preflop spot fr-hj-raise-and-calls-ajs, When its justification is revised, Then it no longer overstates how often the opener holds weaker aces (the claim is about the caller's range)
- [x] #9 Given preflop spots fr-co-limpers-87s and fr-sb-unopened-65s (call cells whose suited neighbours fold), When the spot set is extended, Then each is replaced by a spot whose chart neighbours share its action, or the chart islands are reviewed and justified
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Golden spots and their justifications are original, written for this project [REQ-061.2]
- [x] #2 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [x] #3 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [x] #4 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [x] #5 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [x] #6 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [x] #7 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [x] #8 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [x] #9 No new network requests beyond the app's own files [REQ-058.1]
- [x] #10 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [x] #11 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [x] #12 Story documentation is written and published to Backlog.md
- [x] #13 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extend the golden-spot format (v1) with optional board/street; parsePostflopGoldenSpots; new tests/golden/postflop-spots.json (~120 spots, original justifications)
2. Clear-cut rule: every legal non-recorded action grades Major under gradeDecision; advice as the app shows the user (actions ranges, observed stats when given)
3. Graded examples file with exact grade, rule id and margin (exact-equity spots)
4. Full-ring BTN vs single raise: 99/88 → raise (Q-1); replace two borderline full-ring preflop spots (A-7)
5. Suite runs every push in the uncovered sweep job (~4 s); coverage job gets stubbed unit tests + one cheap spot

Full spec: doit/TASK-7.14/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-7.4 follow-up (doc-19).

ACs added from TASK-7.11 review follow-ups.

AC added from TASK-7.11 judge J-1-01.

Build: postflop golden spots (120, original justifications), clear-cut rule via gradeDecision, graded examples (9), full-ring BTN 99/88 vs single raise → raise (Q-1), preflop spots re-pinned under TASK-7.11 (4 spots, count 110 kept); npm test 1159 passed; gate PASS

Judge r1 PASS 18/18; CI 45339470694 green on b857384; review took 3 rounds (justification text accuracy).

Follow-ups: TASK-7.31 created (chart-consistent preflop lines, kings-full wording, grader throw reported). Not tracked: street-of-board index NIT (no behaviour change); margin re-recording self-enforces via the golden suite when TASK-7.26/7.28/7.18 land.

Locked test(s) unlocked for TASK-7.32 Q-1 (user-approved advice/bot fix; expected values re-pinned one-for-one).

Locked tests/golden/postflop-spots.json unlocked for TASK-7.26 Q-2 (replace non-clear-cut heads-up/full-ring spots like-for-like, logged).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added 120 authored postflop golden spots (45 flop, 40 turn, 35 river) and 9 graded examples, with a mechanical clear-cut validator (every other action must grade Major), bringing the suite to 230 spots. All of it runs in npm test and on CI (golden suite 282 tests, about 1.4 s). Also settled AC#7-9: full-ring BTN 99/88 vs a single raise is now raise (chart change), and two preflop spots were replaced. Verified: judge 18/18 PASS, npm test 1159 passed, lint and typecheck clean, playtest 0 violations, scratch mutations fail with the exact messages. Review took 3 rounds, all for factual accuracy of justification text (fixed). Please review: Q-1 chart change (user-facing advice) and the re-pin of the TASK-7.11 locked tests/golden/preflop-spots.json (both auto-accepted). Follow-ups: hero preflop lines in many spots contradict the chart (MINOR), 2 code NITs, one wording nit, and graded margins need re-recording when TASK-7.26, 7.28 and 7.18 land.
<!-- SECTION:FINAL_SUMMARY:END -->
