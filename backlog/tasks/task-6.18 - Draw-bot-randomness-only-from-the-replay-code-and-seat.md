---
id: TASK-6.18
title: Draw bot randomness only from the replay code and seat
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T23:13:00Z'
updated_date: '2026-11-21T21:40:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-6.1
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-3
  - doc-72
parent_task_id: TASK-6
priority: high
type: feature
ordinal: 35000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want bot randomness drawn only from the hand's replay code with the bot's seat, so that any hand I play can be reproduced and the bots never read my statistics.

Each bot gets a generator seeded from the hand's replay code and its seat, independent of the deck shuffle stream and of wall-clock time; it is the only source of bot randomness (REQ-028.1). Bots request advice with the typical-player basis only; observed opponent statistics (REQ-035.2) are never passed into a bot decision (REQ-029.2). Mixing (E06-S02) and style deviations (E06-S03..S05) draw from this generator.

## Requirements covered
- REQ-028 (Must): Reproducible mixed decisions — Where a bot's style gives more than one action a non-zero probability, the bot shall pick among them using a random generator derived from the hand's replay code, so that replaying a hand reproduces every bot decision.
- REQ-029 (Should): Fixed styles (no adaptation) — A bot shall keep the same style parameters for the whole session regardless of how the user plays.

Covers: REQ-028, REQ-029

## Notes
Derive the per-seat generator from (replay code, seat) with a documented hash. Suggested guard: a lint rule banning Math.random, Date, crypto and performance.now in bot decision code.

Plan key: E06-S18 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the same replay code, seat and decision point, When TAG decides twice, Then it chooses the same action; Given the same replay code at a different seat, When the generator is created, Then its random sequence differs [REQ-028.1]
- [x] #2 Given a TAG decision point and replay code, When it is evaluated in two runs started at different wall-clock times and after different numbers of other random draws (deck shuffle, other seats), Then TAG chooses the same action in both [REQ-028.1]
- [x] #3 Given two bot decision points identical except for the observed statistics of the opponents (including the user), When the bot decides, Then its advice request uses the typical-player basis with no observed statistics and its action is identical in both [REQ-029.2]
- [x] #4 Given a bot decision needs randomness, When the request is sent to the advice worker, Then the per-decision seed is derived on the main thread from (replay code, seat) and sent as a numeric field on the bot request, and the replay code itself is never sent to the worker (TASK-3.6 D-6)
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
1. Move the per-seat generator to src/bots/random.ts (re-exported); derive the per-decision seed on the main thread from (replay code, seat, k) (Q-1).
2. Bot request carries a numeric seed (never the replay code); worker builds Xoshiro128(seed) and passes it to decideTag (TAG ignores it until TASK-6.2); malformed seed → error reply.
3. Lint guard banning Math.random/Date/crypto/performance in src/bots and src/advice (Q-2).
4. Tests: reproducible seed per seat/decision, isolation from time and other draws, typical-player basis only; playtest byte-identical.

Full spec: doit/TASK-6.18/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-3.6 follow-up (D-6: no replay code in the worker)

Autopilot Q-1/Q-2 auto-accepted (qa.md); TASK-6.2 AC added for seed plumbing when TAG mixes.

Build blocked: TASK-6.1 bot boundary test forbids src/bots runtime imports from the engine. Resolved (orchestrator): option (b) — seed derivation lives in src/engine/bot-random.ts; tag.ts types the generator structurally; boundary test untouched (recorded deviation from §5/SPEC-10 file layout).

Build: engine/bot-random.ts seed derivation; numeric seed on bot requests (no replay code to worker); TAG BotRandom shape; lint guard; 4 new test files; e2e 130 passed; playtest hash identical; gate PASS.

Review R1: 0 blocking; MINOR (duplicate seed range check) + NIT (aliased globals) → TASK-6.2 AC; security NIT (seed default 0) kept because locked TASK-3.6 test calls decideBot without a seed.

Judge R1 PASS 10/10 (independent Python seed re-implementation 300 cases; real-app payload capture; 11/11 mutants). J-1-01 → TASK-6.2 AC; J-1-02 is the A-3 default.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Bot randomness now comes only from the replay code, seat and decision number: the seed is derived on the main thread (seat generator Xoshiro128(fnv1a32(code/seat)), (k+1)-th output) and only that number crosses to the worker; TAG stays pure and ignores the generator until TASK-6.2. A lint guard bans Math.random/Date/crypto/performance in src/bots and src/advice. Verified: lint, typecheck, npm test (527 passed, coverage 96.8%) green; review round 1 had 0 blocking findings. Review: auto-accepted Q-1 (seed derivation) and Q-2 (lint guard), A-1..A-5; deviation: derivation is in src/engine/bot-random.ts because TASK-6.1's boundary test forbids engine imports in src/bots. Follow-ups (seed bound sharing, lint alias gaps, playtest seed plumbing) are on TASK-6.2.
<!-- SECTION:FINAL_SUMMARY:END -->
