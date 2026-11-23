---
id: TASK-7.10
title: Explain every recommendation in plain English with its numbers
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-23T09:10:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-7.6
  - TASK-7.8
  - TASK-7.9
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-7
priority: high
type: feature
ordinal: 45000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want a short plain-English reason with every recommendation, so that I understand the poker concept behind the advice.

Every recommendation includes an explanation of at most three sentences that names at least one concept from the list (pot odds, equity, position, hand strength, outs and draws, implied odds, value bet, bluff, opponent type, initiative) and explains it in the sentence where it is first named, because there is no glossary screen. Postflop explanations quote the equity % and required equity % used. Explanations are templates per rule and chart situation, written for this project.

## Requirements covered
- REQ-036 (Must): Deterministic advice — Given the same player view and the same observed opponent statistics, the advice engine shall always return the same recommendation, numbers, explanation and grade.
- REQ-037 (Must): Plain-English explanations — Every recommendation shall include an explanation of at most three sentences in plain English that names and briefly explains the poker concept behind it.
- REQ-061 (Should): Legal and content — TLH Trainer shall use play money only and shall contain only strategy text and data written for this project.

Covers: REQ-036, REQ-037, REQ-061

## Notes
Short-stack notes (E07-S17) and approximate labels (E07-S16) are separate fields, not part of the three-sentence explanation.

Plan key: E07-S12 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a seeded sample of 10,000 decision points from the playtest covering every rule id and chart situation, When explanations are generated, Then each has at most three sentences [REQ-037.1]
- [ ] #2 Given the same sample, When explanations are checked, Then each names at least one concept from the concept list [REQ-037.2]
- [ ] #3 Given the same sample, When explanations are checked, Then the sentence that first names each concept contains that concept's authored one-clause definition [REQ-037.3]
- [ ] #4 Given a postflop recommendation that rests on equity, When its explanation is generated, Then it quotes the same equity % and required equity % that the recommendation returns [REQ-037.4]
- [ ] #5 Given identical inputs, When the explanation is generated twice, Then the text is identical [REQ-036.1]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Explanation templates and concept definitions are original, written for this project [REQ-061.2]
- [ ] #2 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [ ] #3 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [ ] #4 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [ ] #5 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [ ] #6 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [ ] #7 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [ ] #8 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [ ] #9 No new network requests beyond the app's own files [REQ-058.1]
- [ ] #10 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [ ] #11 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [ ] #12 Story documentation is written and published to Backlog.md
- [ ] #13 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. src/advice/explanations.ts: authored concepts (10 one-clause definitions) and templates per rule/situation.
2. src/advice/explain.ts fills templates; preflop/postflop recommendations gain readonly explanation.
3. Docs explanations.md; unit tests pin exact wording.
4. explanations.acceptance: 10k seeded playtest decisions (split 2k/10k-slow if > 8 s); AC#1–#5.
5. Locked re-pins 7.3/7.8 (explanation key); playtest SHA unchanged.

Full spec: doit/TASK-7.10/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: explanation field on every recommendation (authored concepts/templates, explain.ts); 10k sample acceptance 7.7 s local (no split); block 1 (TASK-7.2 sandbox list) auto-accepted; SHA unchanged; gate PASS.
<!-- SECTION:NOTES:END -->
