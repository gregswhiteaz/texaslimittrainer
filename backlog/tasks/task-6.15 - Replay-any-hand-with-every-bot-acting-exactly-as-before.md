---
id: TASK-6.15
title: Replay any hand with every bot acting exactly as before
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T23:03:00Z'
updated_date: '2026-11-22T20:07:00Z'
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
  - doc-3
  - doc-85
parent_task_id: TASK-6
priority: high
type: feature
ordinal: 51000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want a replayed hand to reproduce every bot action exactly, so that I can revisit any hand and see the opponents play it the same way.

Replaying a hand with the same replay code and the same user actions reproduces every bot action, for every style, because each bot's randomness comes only from a generator seeded from the replay code and its seat (E06-S02). In the playtest seat 1 follows a scripted user policy and its recorded actions are fed back on replay.

## Requirements covered
- REQ-028 (Must): Reproducible mixed decisions — Where a bot's style gives more than one action a non-zero probability, the bot shall pick among them using a random generator derived from the hand's replay code, so that replaying a hand reproduces every bot decision.

Covers: REQ-028

Plan key: E06-S15 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given 1,000 recorded hands from a 6-max TAG playtest in which seat 1 follows a scripted user policy, When each hand is replayed with its replay code and seat 1's recorded actions, Then every bot action matches in order and amount [REQ-028.2]
- [x] #2 Given 1,000 recorded hands from a 6-max Mixed playtest in which seat 1 follows a scripted user policy, When each hand is replayed with its replay code and seat 1's recorded actions, Then every bot action of every style matches in order and amount [REQ-028.2]
- [x] #3 Given a recorded hand, When it is replayed with the same replay code but a different user action at the first decision, Then the replay still deals the same cards and every bot decision point reached identically before that action matches the original [REQ-028.1, REQ-028.2]
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
1. PlaytestSeams.userPolicy seam (seat 1 scripted user), scriptedPolicy(actions, then?).
2. replayWithBots(record, lineUp, userPolicy): replays a hand letting bots decide again from the replay code (seatStylesPolicyFactory for replaced bots).
3. recordStacks moved to the runner; CLI output unchanged.
4. Acceptance: 1,000 TAG and 1,000 Mixed hands replay every bot action exactly; changed first user action keeps cards and earlier bot decisions.
5. Former AC#4 moved to TASK-6.23 (depends on TASK-6.20).

Full spec: doit/TASK-6.15/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-6.9 follow-up (app session and replay pass no earlier showdowns)

AC#4 (earlier showdowns on replay) moved to a follow-up task depending on spike TASK-6.20 (Q-1 auto-accepted: don't pre-empt the user's replay-context decision).

Build blocked: PlaytestSeams.userPolicy would break TASK-6.9's locked seam-key test. Resolved (recorded deviation): userPolicy is a PlaytestOptions/HandSetup field, no new parameter or seam; no locked-test edit.

Second block: the 1,000-hand replays take ~11–16 s alone (~80 s in npm test) because the random user forces many TAG equity calls. Resolved per the slow-tests rule: 1,000-hand runs opt-in (test:slow); 100-hand versions every push.

Build: userPolicy field (HandSetup/PlaytestOptions), scriptedPolicy, replayWithBots, recordStacks moved; 1,000-hand replays opt-in (31.7 s slow mode), 100-hand + SPEC-03 every push (~7 s); default SHA unchanged; gate PASS.

Review R1: 0 blocking; both recorded deviations accepted on substance; 6/6 mutations caught; 1 NIT (helper name) not tracked.

Judge R1 PASS 9/9 (own 1,000-hand TAG/Mixed replays with different seeds incl. replaced bots, 400 changed-action hands, 4/4 mutants). J-1-01 LOW (AC#1/#2 tests alone cannot tell re-decide from re-apply; AC#3 + units catch it) — not tracked.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added userPolicy (HandSetup/PlaytestOptions), scriptedPolicy and replayWithBots to the playtest runner, proving REQ-028.2: replays with the same code and user actions reproduce every bot action. Verified: lint, typecheck, npm test pass; 100-hand replays run every push, 1,000-hand ones opt-in (TLH_SLOW_TESTS); review R1 0 blocking, 6/6 mutations caught; default SHA unchanged. Review assumptions A-1..A-5 and two deviations (userPolicy not a PlaytestSeams key; 1,000-hand runs opt-in). Follow-up: earlier showdowns on replay is TASK-6.23 (needs TASK-6.20).
<!-- SECTION:FINAL_SUMMARY:END -->
