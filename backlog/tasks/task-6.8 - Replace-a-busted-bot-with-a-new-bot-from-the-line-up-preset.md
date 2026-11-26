---
id: TASK-6.8
title: Replace a busted bot with a new bot from the line-up preset
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-26T13:14:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-6.7
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-82
parent_task_id: TASK-6
priority: high
type: feature
ordinal: 54000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want a busted bot replaced by a new bot with a fresh buy-in before the next hand, so that my cash table stays full and keeps the character of the line-up I chose.

Cash games only (sit-and-go never refills seats, E05). When a bot's stack is $0 at the end of a hand, it leaves and a new bot takes the seat before the next hand with a fresh buy-in of 20 x the big bet ($160 at $4/$8). The new bot's style is drawn at random from the styles the session's preset assigns at the current table size (REQ-007.8): e.g. Mixed at 6 players - TAG, Calling station, Maniac or Rock, Mixed at 3 players - TAG or Calling station; Tough - TAG or Maniac, but TAG only at heads-up; Soft - Calling station or Rock; a session recorded as Custom draws from all four styles (REQ-007.7). The draw uses a seeded generator so playtests stay reproducible. The new bot gets a display name unique within the table. This replaces E01's in-runner stack restore in the playtest.

## Requirements covered
- REQ-007 (Must): Cash game buy-in and rebuy — In a cash game, every player shall start with a fixed buy-in of 20 big bets; when the user's stack reaches zero, TLH Trainer shall ask the user to Rebuy (another 20 big bets) or Leave table before the next hand.
- REQ-009 (Must): Line-up presets and per-seat styles — The Game Config screen shall let the user choose a line-up preset (Mixed, Tough or Soft) and then change the style of any individual bot seat.
- REQ-062 (Must): Headless playtest CLI — The project shall provide a command-line playtest runner that plays seeded bot-only hands with the production engine, checks invariants after every action and reports results.

Covers: REQ-007, REQ-009, REQ-062

## Notes
E03: a replaced seat's observed stats start from zero (REQ-031.3); give each bot instance a distinct id.

Plan key: E06-S08 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a $4/$8 cash game where a bot's stack is $0 at the end of a hand, When the next hand is dealt, Then that bot has left and a new bot holds the seat with $160 [REQ-007.5]
- [x] #2 Given a bot with $1 left at the end of a hand, When the next hand is dealt, Then the same bot keeps the seat with $1 [REQ-007.5]
- [x] #3 Given 10,000 seeded replacements at 6 players for each preset, When the new bots' styles are tallied, Then Mixed yields all four styles, Tough only TAG and Maniac, Soft only Calling station and Rock, and every allowed style appears at least once [REQ-007.5, REQ-007.8]
- [x] #4 Given two bots bust in the same hand, When the next hand is dealt, Then both seats hold new bots with fresh buy-ins and no two bots at the table share a display name [REQ-007.5, REQ-009.4]
- [x] #5 Given a cash playtest with the same seed and options, When it is run twice, Then the same bots are replaced after the same hands with the same styles and names [REQ-007.5, REQ-062.4]
- [x] #6 Given `npm run playtest -- --hands 10000 --seed 42 --lineup mixed`, When bots bust, Then they are replaced by this rule, zero invariant violations are reported and it exits 0 [REQ-007.5]
- [x] #7 Given a session recorded as Custom, When 10,000 seeded replacements are tallied, Then the new bots' styles include all four styles (TAG, Calling station, Maniac, Rock) and no other [REQ-007.7]
- [x] #8 Given 10,000 seeded replacements with the Mixed preset at 3 players and with the Tough preset at heads-up, When the new bots' styles are tallied, Then Mixed yields only TAG and Calling station (both at least once) and heads-up Tough yields only TAG [REQ-007.8]
- [x] #9 Given a bot ends a hand at $0, When nextHand runs, Then the bot is replaced by a new bot (preset style, unique name, $160) instead of being topped up
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
1. replacementGenerator(code, seat) + uniform draw over the preset's distinct styles at config.players (all four for Custom).
2. REPLACEMENT_NAMES Jay…Zed then 'Jay 2'…; TableState.nextBotName; skip names at the table.
3. nextHand (cash): a $0 bot is replaced ($160, new style/name) instead of topped up; user/sng top-up unchanged.
4. Playtest: --lineup cash runs replace busted bots, 'Bots replaced: N', Replay line --styles; default run byte-identical.
5. Approved locked-test edits (TASK-3.4 next-hand, TASK-1.52 policy-lineup); tallies in normal suite; 10k --lineup mixed in slow group.

Full spec: doit/TASK-6.8/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-3.4 follow-up (doc-25).

Build: replacementGenerator + uniform style draw, REPLACEMENT_NAMES never reused (nextBotName), cash nextHand replaces $0 bots, playtest --lineup replacement + 'Bots replaced' + --styles; Q-4 locked edits only; recorded deviation: drawReplacementStyle lives in src/table/session.ts (bots/ boundary test forbids engine runtime imports); default SHA unchanged; gate PASS.

Note: tests/playtest/policy-lineup.acceptance.test.ts was not in TASK-1.52's locked_tests, so no unlock event exists; the Q-4 edit (200→45 hands) is user-approved and recorded in qa.md and TASK-1.52 notes.

Gate fix-6 FAIL was a lock-timing issue (overlapping builder gates re-locked pre-edit hashes); edits re-checked (no expect removed), re-unlocked, gate fix #7 PASS (6c7713b). Follow-ups: notes on TASK-3.21, TASK-4.7, TASK-3.14.

Judge R1 PASS 14/14 (own 10k-draw tallies per preset/size, forced post-replacement violation replays with --styles, 12/13 mutants). Non-blocking: J-1-01 playtest restart-after-violation untested (A-4), J-1-02 replay Line-up line shows original names — not tracked (playtest display, no failure path).

Locked test re-pinned by TASK-6.17 Q-3 (auto-accepted; assertion count kept).

Locked test(s) unlocked for TASK-6.25 (busted bot keeps its style; Maniac/Rock retune); expected values re-pinned one-for-one.

tests/bots/replacement.acceptance.test.ts unlocked for TASK-6.26 AC#3 (fixed 8-code set, same assertions)
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Cash bots on $0 are now replaced before the next hand by a new bot ($160, style drawn seeded from replay code+seat from the line-up's styles, unique name Jay…Zed then 'Jay 2'); bots with $1+ keep their stack; user seat and sit-and-go keep the TEMPORARY top-up. --lineup cash playtests use the same rule, print 'Bots replaced: n', and replay with --styles. Verified: npm test/lint/typecheck pass, 10k --lineup mixed = 34 replacements, 0 violations, default-run SHA unchanged, branch CI #183 green; review R1 0 blocking, security clean. Review: assumptions A-1..A-6 and decisions Q-1..Q-4 (three approved locked-test edits) in the story doc. Deviation: drawReplacementStyle is in src/table/session.ts (bots/ boundary test). Risks: scope 995 lines vs 700; TASK-3.21 and TASK-4.7/3.14 need notes (bot top-up gone; bot identity = never-reused name).
<!-- SECTION:FINAL_SUMMARY:END -->
