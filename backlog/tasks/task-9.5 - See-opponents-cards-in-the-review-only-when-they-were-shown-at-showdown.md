---
id: TASK-9.5
title: See opponents' cards in the review only when they were shown at showdown
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-24T15:05:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-9.1
  - TASK-1.15
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-9
priority: high
type: feature
ordinal: 90000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want the review to show an opponent's hole cards only if they were shown at showdown, so that the review is as fair as a real table and never reveals hidden information.

Opponent hole cards appear in the panel only when that opponent showed them at showdown (casino showdown order and muck rules: E01-S15). Folded hands and mucked hands are never revealed anywhere in the panel, including accessible names and image titles.

## Requirements covered
- REQ-043 (Must): Hand Review panel — When a hand ends in which the user made any decision other than folding preflop, the Table screen shall open the Hand Review panel beside the table, unless auto-open is turned off in Settings.

Covers: REQ-043

Plan key: E09-S04 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a showdown where Ben shows K♦ 7♣, When the panel opens, Then it shows Ben's K♦ 7♣ [REQ-043.6]
- [x] #2 Given a showdown where Dee mucks her losing hand, When the panel's text, accessible names and image titles are searched, Then Dee's hole cards appear nowhere [REQ-043.6]
- [x] #3 Given a hand that ends with every opponent folding, When the panel's text, accessible names and image titles are searched, Then no opponent's hole cards appear [REQ-043.6]
- [x] #4 Given stored hand records include the replay code, When the review shows opponents' cards, Then it reads only the record's shown/showdown cards and never deals cards from the replay code for display
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
1. review.ts: shown opponents from CompletedHand.shown only (showdown order, user excluded)
2. ReviewPanel: list between header and decisions — 'Ben showed [cards] · Pair of kings'; TableView passes shown from completedHand(table)
3. Fixture REVIEW_DEE_MUCKS; two table scenes
4. Hidden-information proof: rendered text/labels/data-card searches, deep walk of panel props, shown-field substitution, no shuffledDeck/createHand/dealHand in review code; e2e scenes + live hand vs stored record

Full spec: doit/TASK-9.5/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-3.9 security review (replay code can rebuild mucked cards).

Build: review 'Shown at showdown' list from CompletedHand.shown only (opponents, showdown order); hidden-info proofs; npm test 1228 passed, Playwright 246 passed; gate PASS. SPEC-04 search applied to opponent seats (user's cards are in the header) — recorded in qa.md.

Judge r1 PASS 11/11; no hidden-card leak across 1,796 mucked/folded hands (unit) and 35 live reviews in Chromium+WebKit; CI 45414460393 green.
<!-- SECTION:NOTES:END -->
