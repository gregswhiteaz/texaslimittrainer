---
id: TASK-7.11
title: Check advice against preflop golden spots on every test run
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-23T10:38:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-7.6
  - TASK-7.10
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-98
parent_task_id: TASK-7
priority: high
type: feature
ordinal: 46000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want the preflop advice checked on every test run against curated spots with agreed answers, so that I can trust that preflop advice never silently changes.

Golden-spot suite, part 1: format, validator, runner wired into `npm test` (REQ-063.1) and at least 100 preflop spots across heads-up, 6-max and full ring. Each spot records the player view, any observed opponent stats, the recommended action, any acceptable alternative and a written justification. Only clear-cut spots that follow from established limit theory are included; mechanically, preflop spots must sit on chart cells not flagged borderline. Spots and justifications are written for this project.

## Requirements covered
- REQ-037 (Must): Plain-English explanations — Every recommendation shall include an explanation of at most three sentences in plain English that names and briefly explains the poker concept behind it.
- REQ-039 (Must): Golden spot suite — The project shall keep a golden-spot suite of at least 200 clear-cut decisions with justified recommended actions, and the automated test run shall fail if the advice engine disagrees with any of them.
- REQ-061 (Should): Legal and content — TLH Trainer shall use play money only and shall contain only strategy text and data written for this project.
- REQ-063 (Should): Test commands — The project shall provide npm scripts that run each check with one command.

Covers: REQ-037, REQ-039, REQ-061, REQ-063

Plan key: E07-S14 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a golden-spot file, When the spot validator runs, Then each spot has a PlayerView, the recommended action, zero or one acceptable alternative and a written justification, and a spot missing any of them fails validation naming the spot [REQ-039.2]
- [x] #2 Given a clean checkout, When `npm test` runs, Then it runs the golden-spot suite together with the Vitest unit and fast-check property tests [REQ-063.1, REQ-039.4]
- [x] #3 Given a spot where the advice engine's action differs from the recorded action and its acceptable alternative, When `npm test` runs, Then the run fails naming the spot, the expected action and the actual action [REQ-039.4]
- [x] #4 Given the preflop spots, When they are counted, Then there are at least 100 and every reference size (heads-up, 6-max, full ring) and every chart situation is represented [REQ-039.1]
- [x] #5 Given a preflop spot on a chart cell flagged borderline, When the spot validator runs, Then it rejects the spot as not clear-cut [REQ-039.3]
- [x] #6 Given every golden spot, When its explanation is checked, Then it has at most three sentences and names at least one listed concept [REQ-037.1, REQ-037.2]
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
1. src/advice/golden.ts: tlh-golden-spots v1 parser/validator (rebuilds PlayerView via engine; borderline rejection; justification checks).
2. tests/golden/preflop-spots.json: ~110 hand-written preflop spots (HU 20, 6-max 42, full ring 48) with individual justifications.
3. tests/golden/preflop.acceptance.test.ts runner in npm test (fails naming spot/expected/actual); unit tests.
4. docs/advice/golden-spots.md.

Full spec: doit/TASK-7.11/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: golden.ts validator (v1 table+actions, engine-rebuilt PlayerView, borderline rejection), 110 hand-written preflop spots (HU 20, 6-max 42, FR 48) all agree with the engine first run; runner in npm test; SHA unchanged; gate PASS.

Review R1: 5 MAJOR (non-clear-cut spots / wrong justifications) fixed — 11 spots replaced or reworded, 110 kept, coverage kept; security MINOR echo hardened.

Follow-ups: 2 ACs on TASK-7.14 (88 button call vs re-raise; AJs justification wording). Helper copies: infra below the value bar (not tracked).

Judge R1 PASS 14/14 (own rebuild of all 110 views; broken spot fails npm test with exact message; 7/7 mutants; neighbour report 89/110 uniform, 2 call islands → AC on TASK-7.14).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added the tlh-golden-spots v1 format, validator, runner (src/advice/golden.ts) and 110 authored preflop spots (heads-up 20, 6-max 42, full ring 48) that fail npm test if advice disagrees. Verified: 136 golden tests pass, gate PASS, playtest SHA unchanged. Review r1 had 5 MAJOR (non-clear-cut spots); fixed by replacing 10 spots and rewording 1; r2 no blocking. Assumptions A-1..A-6 and auto-accepted Q-1/Q-2 to review (fixed 2/4 table, compact format, hand-written spots). Follow-ups: decide 88 on BTN vs HJ open (call vs re-raise); reword AJs justification; remaining 90+ spots belong to TASK-7.14.
<!-- SECTION:FINAL_SUMMARY:END -->
