---
id: TASK-7.13
title: Adjust opponent ranges to their observed play after 30 hands
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-23T19:21:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-7.5
  - TASK-7.12
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-104
parent_task_id: TASK-7
priority: high
type: feature
ordinal: 72000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want the advice to read each opponent from the hands I have seen them play, so that I learn to adjust to loose and tight opponents.

From 30 observed hands of an opponent in the session, that opponent's preflop range width is scaled toward their observed stats by the formula in the range-model design document: width = d + (o - d) x min(n, 100) / 100, where d is the default range's width (% of starting hands), o is the observed PFR for raising ranges or the observed VPIP for calling and limping ranges, and n is the number of observed hands; the range is then the strongest width% of starting hands by the documented hand order, never narrower than the single strongest hand class (AA). Below 30 hands the default range is used. Recommendations state the basis per opponent: 'typical player' or 'based on N hands of this opponent'; the hint (E08) and review (E09) display it.

## Requirements covered
- REQ-035 (Must): Opponent range model — The advice engine shall estimate each opponent's range from that opponent's actions in the hand, starting from documented default ranges per action and adjusting toward the opponent's observed session statistics once 30 or more hands of that opponent have been observed.

Covers: REQ-035

## Notes
Observed stats are an explicit advice input (a snapshot per decision point), so hint and review for the same decision use the same snapshot (E07-S13). Preflop chart recommendations do not read opponent ranges; planned basis for preflop is 'typical player'.

Plan key: E07-S09 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given an opponent with 29 observed hands, When their range is estimated, Then it equals the default range and the basis is 'typical player' [REQ-035.2, REQ-035.4]
- [x] #2 Given two opponents with identical actions and 30 observed hands each, one with VPIP 20% and PFR 15% and one with VPIP 60% and PFR 10%, When their ranges are estimated, Then the preflop ranges differ and each width equals the documented formula's output [REQ-035.2, REQ-035.6]
- [x] #3 Given an opponent with 40 observed hands, When a postflop recommendation is computed, Then its basis reads 'based on 40 hands of this opponent' [REQ-035.4]
- [x] #4 Given a multiway pot with one opponent observed for 45 hands and one for 12, When a recommendation is computed, Then it returns the basis for each opponent: 'based on 45 hands of this opponent' and 'typical player' [REQ-035.4]
- [x] #5 Given a default raising range of width 20.0% and an opponent with 30 observed hands, When the scaling formula is applied with observed PFR 0%, 20% and 100%, Then the widths are 14.0%, 20.0% and 44.0%; and with 100 observed hands and PFR 60%, Then the width is 60.0% [REQ-035.2, REQ-035.6]
- [x] #6 Given a default raising range of width 20.0% and an opponent with 100 observed hands and PFR 0%, When the range is scaled, Then the scaled width is 0.0% and the range is the single strongest hand class AA (6 combos), never empty [REQ-035.6]
- [x] #7 Given a recommendation whose range rests on observed opponent habits, When its explanation is generated, Then it names and defines the 'opponent type' concept using the authored definition in src/advice/explanations.ts
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
1. src/advice/ranges/hand-order.json: 169 classes by preflop equity vs random (seeded computeEquity), justification, load-time validation.
2. Range scaling: width = d + (o − d)·min(n,100)/100 from 30 hands; strongest-width prefix, AA floor; PFR for raising lines, VPIP for calling/limping.
3. observedOpponents advice input; estimateOpponentRanges basis/widthPct; PostflopRecommendation.opponentBasis; explanation lead clause when scaled.
4. Tests (AC#1–#7), locked re-pin, docs; bots unchanged (SHA same).

Full spec: doit/TASK-7.13/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-7.10 follow-up (opponent-type template).

Build: hand-order.json (169 classes by preflop equity vs random), observed-stat range scaling from 30 hands (AA floor), opponentBasis on postflop recs, explanation lead clause; block 1 (TASK-7.8 key list, TASK-7.2 sandbox list, non-array snapshot ignored) auto-accepted; playtest SHA unchanged; gate PASS.

doit: parked — autopilot stopped by user (GitHub Actions spending limit reached, jobs not starting). Build 71f284b pushed; review R1 FIX was interrupted mid-run (working tree may hold partial test edits; re-run /doit TASK-7.13 to resume FIX round 1).

Judge round 2 PASS (round 1 failed only SPEC-14: CI could not start due to a GitHub billing hold; head 056065c pushed, CI run 45246047077 green).

Follow-ups: TASK-7.30 created (exact zero width, one template filler); TASK-3.12 AC added (snapshot entry validation); TASK-7.29 already open (hand order / re-raise scaling).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Adds observed-play range scaling to the advice engine. From 30 hands of an opponent, the preflop range is rebuilt at width d+(o-d)*min(n,100)/100 over a new authored hand order (169 classes by equity vs a random hand, AA floor). Postflop recommendations return opponentBasis per opponent ('typical player' / 'based on N hands of this opponent'), and the explanation gains an opponent-type lead clause. Bots never receive the snapshot, and the playtest SHA is unchanged. Nothing supplies a snapshot yet (TASK-8.1, TASK-9.3, TASK-3.12).
Verification: npm test 970 passed, 0 failed; judge round 2 passed all 14 SPEC items. Round 1 failed only on a GitHub billing hold that stopped CI, and CI run 45246047077 on head 056065c is green. Holdout checks and mutation checks pass.
Assumptions to review: A-1..A-8 in the story doc, especially the prefix rule for width, the check line left unscaled, and the explanation lead-clause copy. Three locked tests were re-pinned (postflop AC#1, value-bet AC#9, preflop AC#6) with counts kept.
Risks and follow-ups: TASK-7.29 (hand order and re-raise scaling), snapshot-entry null check, zero-width float residue (3.55e-15), minor cleanup of basisText.
<!-- SECTION:FINAL_SUMMARY:END -->
