---
id: TASK-6.6
title: Seat bots by line-up preset with unique names
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-22T05:35:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-6.3
  - TASK-6.4
  - TASK-6.5
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-79
parent_task_id: TASK-6
priority: high
type: feature
ordinal: 50000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want bots seated by the Mixed, Tough or Soft line-up preset, each with its own name, so that I can choose the kind of table I practise against and tell the opponents apart.

Pure line-up module: given a preset, the table size and the user's seat, assign styles to the bot seats. Seats are numbered clockwise. Cycles run over bot seats only, starting with the first bot seat clockwise from the user (REQ-009.8). Mixed: styles cycle TAG, Calling station, Maniac, Rock. Tough: all TAG except one Maniac, which takes the first bot seat clockwise from the user; at heads-up the single bot is TAG (REQ-009.7). Soft: Calling station and Rock alternating, starting with Calling station. Each bot gets a display name unique within the table, drawn from a name list. Adds `--lineup mixed|tough|soft` to the playtest CLI (REQ-062.1); in the playtest seat 1 takes the user's place (scripted policy) so the first bot seat is seat 2. Game Config (E02) uses this module for the preset picker and per-seat edits.

## Requirements covered
- REQ-009 (Must): Line-up presets and per-seat styles — The Game Config screen shall let the user choose a line-up preset (Mixed, Tough or Soft) and then change the style of any individual bot seat.
- REQ-062 (Must): Headless playtest CLI — The project shall provide a command-line playtest runner that plays seeded bot-only hands with the production engine, checks invariants after every action and reports results.

Covers: REQ-009, REQ-062

Plan key: E06-S06 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the Mixed preset at 6 players with the user at seat 4, When styles are assigned, Then seats 5, 6, 1, 2 and 3 are TAG, Calling station, Maniac, Rock and TAG [REQ-009.1, REQ-009.8]
- [x] #2 Given the Tough preset at 6 players with the user at seat 4, When styles are assigned, Then seat 5 is the only Maniac and seats 6, 1, 2 and 3 are TAG [REQ-009.1, REQ-009.8]
- [x] #3 Given each preset, every table size from 2 to 10 and every user seat, When styles are assigned, Then the user's seat gets no style, Mixed cycles TAG, Calling station, Maniac, Rock from the first bot seat clockwise from the user, Tough at sizes 3 to 10 has exactly one Maniac in that seat and every other bot TAG, and Soft alternates Calling station and Rock starting there with Calling station [REQ-009.1, REQ-009.8]
- [x] #4 Given the Tough preset at a heads-up table (one bot seat), When styles are assigned, Then the single bot is a TAG [REQ-009.7]
- [x] #5 Given each preset and every table size from 2 to 10, When bots are seated, Then no two bots share a display name [REQ-009.4]
- [x] #6 Given `npm run playtest -- --hands 10000 --seed 42 --size 9 --lineup tough`, When it runs, Then seat 2 is the Maniac, seats 3 to 9 are TAG, zero invariant violations are reported and it exits 0 [REQ-062.1, REQ-009.1]
- [x] #7 Given `npm run playtest -- --lineup` with a name other than mixed, tough or soft, When it starts, Then it prints the valid line-up names and exits non-zero without playing [REQ-062.1]
- [x] #8 Given a line-up with Maniacs seated, When a 10,000-hand playtest runs, Then its run time is measured and kept practical (TASK-6.4 measured ~168 s vs ~1 s all-TAG, from postflop equity runs) — e.g. equity caching or keeping such runs in the opt-in slow group
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
1. src/bots/lineup.ts: seatLineUp(preset, size, userSeat) + BOT_NAMES (types-only imports).
2. src/bots/decide.ts: decideStyle shared by the worker and the playtest.
3. Playtest --lineup mixed|tough|soft (seat 1 = user via seededTagPolicy; styles only in 6-seat hands, random fallback otherwise, Line-up note); replay support.
4. Tests: unit (lineup, policy, cli, advice-service), acceptance (AC#1–7), opt-in slow 10k 6-max Tough/Mixed timing (AC#8).
5. Baseline playtest SHA unchanged.

Full spec: doit/TASK-6.6/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-6.4 follow-up

Build: seatLineUp + BOT_NAMES, shared decideStyle, playtest --lineup (styles in 6-seat hands; random fallback otherwise), slow AC#8 (Tough 57 s, Mixed 72 s); baseline SHA unchanged; gate PASS.

Review R1: 1 MAJOR (line-up replay untested) fixed with a 6-seat Mixed replay test (mutant caught); R2: 0 blocking. Branch CI #172 green.

Judge R1 PASS 15/15 (162 line-ups recomputed; per-seat decisions match decideStyle; worker fingerprint unchanged; 16/17 mutants — survivor J-1-01 LOW is the temporary 7–8-seat fallback, removed by TASK-7.6 AC). Follow-ups: TASK-7.6 AC (remove fallback); scope 3 covered by TASK-2.5.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added pure seatLineUp (Mixed/Tough/Soft presets, unique names Ava..Ivy clockwise) and playtest --lineup mixed|tough|soft; style dispatch moved to src/bots/decide.ts. Verified: lint, typecheck, npm test (587 passed), coverage 97.14%, default playtest SHA unchanged, branch CI #172 green; slow AC#8 57 s Tough / 72 s Mixed per 10k hands (opt-in); review R1 MAJOR (replay untested) fixed, R2 clean. Review assumptions: Q-1 line-up styles only in 6-seat hands (random fallback elsewhere; removal tracked on TASK-7.6), Q-2 names, Q-3 default unchanged, A-1..A-6. Follow-up: app DEFAULT_SEATS names differ until TASK-2.5 wires the module (covered by TASK-2.5).
<!-- SECTION:FINAL_SUMMARY:END -->
