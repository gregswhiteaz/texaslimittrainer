---
id: TASK-6.7
title: Record an edited line-up as Custom
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-22T16:09:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-6.6
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-6
priority: high
type: feature
ordinal: 52000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want a session with edited seat styles recorded under the line-up name Custom, so that my results against a preset are never mixed with results against tables I changed.

The line-up module resolves the session's line-up name: the preset name when every bot seat's style equals the preset's assignment for that table size (REQ-009.1), otherwise Custom. The session configuration handed to the engine carries the line-up name and the actual seat styles; E02 (Game Config) calls this on Start game and E03 stores it with the session and hand records.

## Requirements covered
- REQ-009 (Must): Line-up presets and per-seat styles — The Game Config screen shall let the user choose a line-up preset (Mixed, Tough or Soft) and then change the style of any individual bot seat.

Covers: REQ-009

## Notes
E02/E03: persist the resolved line-up name with the session so Statistics can filter by line-up (E11).

Plan key: E06-S07 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the Mixed preset at 6 seats with seat 4 changed from Maniac to Rock, When the session's line-up is resolved, Then its line-up name is Custom and the seat styles are the edited ones [REQ-009.6]
- [ ] #2 Given each preset at every table size from 2 to 10 with no seat edited, When the line-up is resolved, Then its line-up name is the preset name [REQ-009.6]
- [ ] #3 Given the Soft preset with one seat changed to TAG and then back to its preset style, When the line-up is resolved, Then its line-up name is Soft [REQ-009.6]
- [ ] #4 Given a line-up resolved as Custom, When the session configuration is built for Start game, Then it carries the line-up name Custom and every seat's edited style [REQ-009.6]
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
1. resolveLineUpName(preset, seats) in src/bots/lineup.ts: preset name when every bot style matches seatLineUp, else Custom.
2. lineUpSessionConfig(base, preset, seats): SessionConfig with resolved name, seats with names/styles, base gameType/stake/speed/button; RangeError on bad input.
3. Acceptance tests (new file) + unit tests for coverage; LineUpName doc comment fixed.
4. DoD#6: 10k --lineup mixed playtest once, 0 violations.

Full spec: doit/TASK-6.7/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: resolveLineUpName + lineUpSessionConfig in lineup.ts (type-only imports, RangeError per spec); 10k --lineup mixed 0 violations; gate PASS.
<!-- SECTION:NOTES:END -->
