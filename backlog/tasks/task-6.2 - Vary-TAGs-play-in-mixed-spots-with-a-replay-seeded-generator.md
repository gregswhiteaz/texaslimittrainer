---
id: TASK-6.2
title: Vary TAG's play in mixed spots from its style data file
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-21T22:43:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-6.18
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-73
parent_task_id: TASK-6
priority: high
type: feature
ordinal: 36000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want TAG opponents that mix their actions in borderline spots, so that they cannot be beaten by one simple trick.

Introduces the style data file format (one file per style, with a plain-English description of the style), its validator and TAG's file. A style file marks spot types as mixed and gives each allowed action a probability; a mixed spot must give at least two actions a non-zero probability. TAG plays the advice recommendation except in mixed spots, where it chooses between the recommendation and the chart cell's acceptable alternative (E07-S01), drawing from the per-seat replay-seeded generator of E06-S18. Full hand replay with every style is E06-S15.

## Requirements covered
- REQ-026 (Must): Bots built on the advice engine — Each bot shall choose its action from the advice engine's evaluation of its own view of the game, modified by its style's documented parameters.
- REQ-028 (Must): Reproducible mixed decisions — Where a bot's style gives more than one action a non-zero probability, the bot shall pick among them using a random generator derived from the hand's replay code, so that replaying a hand reproduces every bot decision.

Covers: REQ-026, REQ-028

## Notes
Store style files as JSON/TS data under src/bots/styles/.

Plan key: E06-S02 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given TAG's style data file, When it is loaded, Then it holds TAG's parameters, including its mixed spot types with the probability of each action, and a plain-English description of the style; a style file without a description fails validation naming the file [REQ-026.3]
- [x] #2 Given a style file that marks a spot type as mixed with fewer than two actions of non-zero probability, When the style validator runs, Then validation fails naming the style and the spot type [REQ-028.3]
- [x] #3 Given a preflop chart cell with an acceptable alternative in a spot TAG marks as mixed, When TAG acts there under 1,000 different replay codes, Then it chooses only the recommended action or the alternative, and chooses each at least once [REQ-026.1, REQ-028.3]
- [x] #4 Given a TAG decision in a spot its file does not mark as mixed, When TAG acts under any replay code, Then it chooses the advice engine's recommended action [REQ-026.1]
- [x] #5 Given TAG mixes between actions, When the playtest and the app play the same hand, Then the playtest TAG policy receives the same per-decision seed as the worker (TASK-6.18 D-1), and the TASK-3.6 worker-equals-headless test is updated with its owner's approval to pass real seeds
- [x] #6 Given the bot seed is validated in two places (advice-service isSeed and engine bot-random), When TAG starts mixing, Then one shared MAX_SEED/guard is used and the lint guard also catches aliased globals (e.g. const c = crypto) in src/bots and src/advice
- [x] #7 Given the bot-randomness lint guard, When it runs, Then it also covers src/engine/bot-random.ts and catches globalThis.Math.random() (TASK-6.18 judge J-1-01)
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
1. Style file format src/bots/styles/<style>.json + parseStyle/StyleValidationError (Q-1); TAG's file with description and justified mixed spots (Q-2).
2. decideTag mixes with one generator draw in marked spots; plain recommendation without a generator; seededTagPolicy for the playtest; worker passes botRandom(seed).
3. Shared MAX_BOT_SEED/isBotSeed; lint guard extended (aliases, globalThis.Math, src/engine/bot-random.ts).
4. Locked-test edits per Q-3 (exact seeded equality only); AC#3 1,000-code distribution test; new playtest baseline recorded.

Full spec: doit/TASK-6.2/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-6.18 scope concern (seed plumbing for mixed TAG)

AC added from TASK-6.18 review MINOR/NIT

AC added from TASK-6.18 judge J-1-01

Autopilot Q-1..Q-3 auto-accepted (Q-3 amended: exact-equality only); unlocks under TASK-3.6, 6.1, 6.18.

Build: style file format + validator; TAG style JSON (5 mixed spots 0.75/0.25); decideTag mixing; seededTagPolicy default; shared isBotSeed; lint guard extended; 5 locked-test edits (exact seeded equality; Q-3, Q-4); new playtest baseline aacd5e94… (88920 actions, 0 violations, byte-identical reruns); e2e 130 passed; gate PASS. Recorded deviation: hand-worked examples corrected to the real seats/values (button seat 1).

Review R1: 0 blocking; MINOR (parity test records the policy's actual seed; wrong-seed mutant caught) + NIT ({0,0} reports both problems) fixed in-story; gate PASS.

Judge R1 PASS 13/13 (own 4,000-code mixing check 25.47%; 3,000-hand all-TAG playtest every action = seeded decision; Q-4 pinned policy reproduces the pre-6.2 sng run byte-for-byte). Follow-up: TASK-6.22 (headless stepBot seeded).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added the bot style data file (JSON, validated at import) with TAG's file, and TAG now mixes recommendation/alternative 75/25 in five preflop spots via the replay-seeded per-decision generator; re-raise is unmixed. The playtest's 6-max TAG uses the same seed as the app worker. Also shared MAX_BOT_SEED/isBotSeed and extended the lint guard (aliases, globalThis.Math, bot-random.ts). Verified: lint, typecheck, npm test (538 passed, coverage 96.9%), e2e 130 passed; playtest 10,000 hands seed 42: 88,920 actions, 0 violations, SHA aacd5e94...e488e01. Reviews: 0 blocking, MINOR+NIT fixed, security clean. Review: assumptions A-1..A-5, auto-accepted Q-1..Q-3, Q-4 (sng test pins pre-6.2 policy), five locked-test edits (exact equality). Follow-up: headless stepBot default still pure tagPolicy (TASK-3.1 owner). Judge: see doit/TASK-6.2/judge/.
<!-- SECTION:FINAL_SUMMARY:END -->
