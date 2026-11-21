---
id: TASK-3.6
title: Keep the table responsive while bots and advice compute
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-21T17:50:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-3.1
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-3
priority: high
type: feature
ordinal: 23000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want the table to stay responsive while advice is being computed, so that the game never freezes or stutters during play.

Equity and advice computation (bot decisions, and later hints and review grading) run off the main thread in a Web Worker so the table stays responsive: no frame longer than 100 ms during computation. The engine and advice modules stay UI-free (REQ-059.2); the worker is the browser host for them. The same worker API serves E08 hints and E09 review.

## Requirements covered
- REQ-055 (Should): Response times — On the reference machine (Apple-silicon Mac, latest Chrome), TLH Trainer shall meet these 95th-percentile response times.

Covers: REQ-055

## Notes
E08 must request hints through this worker (REQ-055.1); E09 computes or reads review advice without blocking the main thread.

Plan key: E03-S12 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a scripted 6-max hand where each bot postflop decision takes at least 300 ms to compute, When the table plays it in Chromium, Then a long-task observer records no main-thread task longer than 100 ms during the computation [REQ-055.6]
- [ ] #2 Given a bot decision is being computed, When the user hovers a seat or the window is resized, Then the table repaints within 100 ms [REQ-055.6]
- [ ] #3 Given the same seed and user actions, When a hand is played with computation in the worker and headlessly in the playtest, Then every bot action is identical [REQ-055.6]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Automated timing test over 200 samples reports p95 main-thread frame time during computation at most 100 ms [REQ-055.6]
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
1. Headless advice service (bot / recommend / grade requests) in src/table/advice-service.ts; session gains botTurn + applyBotDecision (stale replies ignored).
2. Browser worker + AdviceClient in src/ui/advice; useTableSession sends bot turns to the worker (only the acting player's PlayerView crosses).
3. Test-only slow worker seam (never shipped; dist grep).
4. Tests: every-push worker-serves-every-bot-decision + worker==headless determinism; opt-in (npm run e2e:slow) long-task, p95 frame and repaint timing checks.
5. No locked test changes; review grading stays on main thread (TASK-9.3).

Full spec: doit/TASK-3.6/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Autopilot: no asks. D-8 per user's standing rule: timing checks opt-in (npm run e2e:slow); every-push structural guard SPEC-15.

Build blocked (paused-clock locked e2e tests vs per-table worker start-up ~30 ms). Resolved by orchestrator: Option A — one app-wide shared advice worker (recorded deviation from D-2/SPEC-09 wording); no locked test edits.

Build: advice service + shared app-wide worker (prewarmed in main.tsx) + AdviceClient; bot turns via worker with stale-reply guard; e2e every-push worker-serves-bots + determinism; opt-in e2e:slow timing checks (8 passed, 2 Chromium-only skips); npm run e2e 114 passed (x2); dist has no test worker; playtest 0 violations; gate PASS.
<!-- SECTION:NOTES:END -->
