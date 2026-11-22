---
id: TASK-6.5
title: Face a Rock that folds every hand outside a narrow starting range
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-22T02:51:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-6.2
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-77
parent_task_id: TASK-6
priority: high
type: feature
ordinal: 39000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want Rock opponents that play only a narrow set of starting hands, so that I learn to steal their blinds and respect their bets.

Rock (very tight) stores its narrower preflop starting range per position and situation in its own style data file, with a plain-English description. Every hand class in the Rock range is one the TAG chart plays (does not fold) in the same position and situation, and the Rock range has fewer hand classes. Preflop, the Rock folds every hand outside its range; when no bet is faced (big blind after limps) folding is illegal, so it checks. Inside its range and postflop it follows the advice engine with its documented deviations. Target band (proved in E06-S09): VPIP 8-15%, PFR 6-12%, aggression 35-55%.

## Requirements covered
- REQ-026 (Must): Bots built on the advice engine — Each bot shall choose its action from the advice engine's evaluation of its own view of the game, modified by its style's documented parameters.
- REQ-061 (Should): Legal and content — TLH Trainer shall use play money only and shall contain only strategy text and data written for this project.

Covers: REQ-026, REQ-061

## Notes
Heads-up and full-ring Rock ranges follow the same subset rule against E07-S05 charts when those exist.

Plan key: E06-S05 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the Rock style data file, When it is loaded, Then it holds the Rock starting range for each position and situation and a plain-English description of the style [REQ-026.3]
- [x] #2 Given the Rock and TAG 6-max data, When the style validator runs, Then every hand class in the Rock starting range is a non-fold cell of the TAG chart for the same position and situation, and the Rock range has fewer hand classes in each position [REQ-026.2]
- [x] #3 Given a Rock facing a bet preflop with a hand class outside its starting range, When it acts under any replay code, Then it folds [REQ-026.2]
- [x] #4 Given a Rock in the big blind with a hand outside its starting range and no raise to face, When it acts, Then it checks [REQ-026.2]
- [x] #5 Given one hand class is removed from the Rock file's starting range and no code is changed, When the Rock is dealt that hand class preflop facing a bet, Then it folds [REQ-026.3]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 The Rock starting range carries its justification and is original, written for this project [REQ-061.2]
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
1. Optional startingRange section in the style format; validator enforces all 26 spots, TAG-subset and fewer-classes rules (Q-1).
2. rock.json with ranges, description and justifications (Q-2).
3. decideRock: outside range fold when owing / check when free; inside range plays the advice; no randomness (Q-3).
4. Worker routes 'Rock' to decideRock (Q-4).
5. Fast tests (seconds): AC#2–#5, 1,000-hand seated run; playtest byte-identical.

Full spec: doit/TASK-6.5/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Autopilot Q-1..Q-4 auto-accepted (qa.md).

Build: startingRange format + validator; rock.json (identical to spec §5, checked by orchestrator); decideRock; worker dispatch; new tests <1 s locally; playtest byte-identical; gate PASS.

Review R1: 0 blocking; MINOR+NIT fixed in-story (strengthen-only); gate PASS.

Follow-ups (Step 6a): AC added to TASK-6.11 (re-measure Rock with a Maniac); postflop aggression already tracked via TASK-7.8 deps.

Judge R1 PASS 11/11 (own 10k Rock playtests VPIP 9.4–10.2%, PFR 8.2–8.7%; 14/14 mutants; other bots fingerprint unchanged; Rock tests ~2.7 s on CI).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added the Rock bot: rock.json holds a narrower 6-max starting range (26 spots, each with a justification) plus a description. parseStyle gained an optional startingRange section checked against the TAG chart (subset of non-fold cells, fewer classes per spot and per position; required for Rock). decideRock folds outside the range when owed, checks in the BB after limps, and plays the advice inside it and postflop, with no randomness. The worker routes 'Rock' to decideRock. Verification: npm test 568 passed, coverage 97%, lint and typecheck clean, e2e 130 passed, gates build-1/fix-2/fix-3 PASS, playtest baseline SHA unchanged (88920 actions, 0 violations). Review round 1: 0 blocking, MINOR and NIT fixed. Assumptions to review: Q-1 format, Q-2 ranges (VPIP ~10.5%, PFR ~9.2%), Q-3 behaviour (no randomness), Q-4 worker dispatch, A-1..A-7. Risks and follow-ups: Rock postflop aggression is 0% until TASK-7.8 (tracked in TASK-6.11/6.17). The VPIP/PFR margin shrinks with a Maniac at the table, so re-measure in TASK-6.11.
<!-- SECTION:FINAL_SUMMARY:END -->
