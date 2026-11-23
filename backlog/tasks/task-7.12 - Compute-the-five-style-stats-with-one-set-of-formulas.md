---
id: TASK-7.12
title: 'Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-23T10:49:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-1.4
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-7
priority: high
type: task
ordinal: 59000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Enabler (no user-visible outcome on its own): pure statistics module (no UI imports) over completed hand action histories. VPIP = hands where the player voluntarily put chips in preflop (call or raise, not counting blinds) / hands dealt. PFR = hands with a preflop raise / hands dealt. Aggression = (bets + raises) / (bets + raises + calls) over flop, turn and river. WTSD = hands reaching showdown / hands where the player saw the flop. W$SD = showdowns where the player won chips / showdowns reached. A zero denominator shows '—'. Used for the user's Session Report (E10), opponent observed stats (REQ-031, REQ-035.2) and playtest style checks (E06). User stories that show these stats depend on this task: E07-S09 (opponent range scaling), E03 opponent stats panel, E06 style checks and the E10 Session Report.

## Requirements covered
- REQ-045 (Must): Style stat definitions — The app shall compute the five tracked style stats with these formulas over the hands in scope.

Covers: REQ-045

## Notes
E03 hand records must keep the full per-street action history per seat so these functions can run on them. Aggression is postflop-only (REQ-045.3); bot style bands use the same definition (REQ-027.6).

Plan key: E07-S08 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given 10 hand records in which the user called preflop in 3 (one a small-blind completion), raised preflop in 2, checked the big blind in 1 and folded in 4, When stats are computed, Then VPIP is 50% and PFR is 20% [REQ-045.1, REQ-045.2]
- [ ] #2 Given hand records with 3 postflop bets, 1 postflop raise, 4 postflop calls and 2 preflop raises, When Aggression is computed, Then it is 50% [REQ-045.3]
- [ ] #3 Given hand records where the user saw the flop in 8 hands and reached showdown in 2, When WTSD is computed, Then it is 25% [REQ-045.4]
- [ ] #4 Given 2 showdowns reached of which the user won chips in 1 (a split pot), When W$SD is computed, Then it is 50% [REQ-045.5]
- [ ] #5 Given hand records with no hands dealt, no flop seen, no showdown or no postflop bet, raise or call, When the affected stat is computed, Then it shows '—' instead of a number [REQ-045.6]
- [ ] #6 Given a player who only posted a blind and then folded, When VPIP is computed, Then that hand does not count as voluntarily putting chips in [REQ-045.1]
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
1. src/stats/style-stats.ts: handStyleCounts/addStyleCounts/styleCounts/styleStats over StatHand (CompletedHand fits; PlayedHand adapter); formatStat '—' for null.
2. Acceptance (AC#1–#6) + unit tests (edges, 300 real playtest hands, CompletedHand typing).
3. style-bands slow test uses the shared functions (Q-1).
4. docs/stats/style-stats.md.

Full spec: doit/TASK-7.12/spec.md
<!-- SECTION:PLAN:END -->
