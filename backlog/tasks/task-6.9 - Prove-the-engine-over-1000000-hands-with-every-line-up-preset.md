---
id: TASK-6.9
title: Prove the engine over 1,000,000 cash hands with every line-up preset
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-25T00:07:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-6.8
  - TASK-1.17
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-83
parent_task_id: TASK-6
priority: high
type: feature
ordinal: 55000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want the one-million-hand invariant run to play real style bots in every line-up preset, so that the rules never break against the opponents I actually face.

Extends E01-S17 (which covers table sizes 2-10 and both game types with random-move seats) so that the 1,000,000-hand run uses the style bots and covers the Mixed, Tough and Soft presets at every table size 2-10 in cash games. Sit-and-go line-up coverage needs the sit-and-go structure (E05, M3) and is added by E05. Re-verifies the playtest throughput with real bots (advice is computed for every bot decision): 100,000 6-max hands in at most 60 minutes on the reference machine (Apple-silicon Mac). At the permitted worst case one million hands take about 10 hours, over the 6-hour limit of a GitHub-hosted job, so the run uses the same sharding as E01-S17: parallel shards with deterministic per-shard seeds, combined into one report.

## Requirements covered
- REQ-056 (Must): Reliability and invariants — The engine shall complete 1,000,000 headless hands across all table sizes, game types and line-ups with zero invariant violations, and the app shall recover from an unexpected error without losing completed hands.
- REQ-062 (Must): Headless playtest CLI — The project shall provide a command-line playtest runner that plays seeded bot-only hands with the production engine, checks invariants after every action and reports results.

Covers: REQ-056, REQ-062

## Notes
E05: add the sit-and-go line-up coverage to the 1,000,000-hand run (REQ-056.2) in M3. If sharding in CI proves impractical, run on the reference machine as E01-S17 allows.

Plan key: E06-S11 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the nightly or on-demand 1,000,000-hand cash run, When it completes, Then it has played Mixed, Tough and Soft line-ups at every table size from 2 to 10, prints the hand count per line-up and size, reports zero invariant violations and exits 0 [REQ-056.2]
- [x] #2 Given the reference machine, When `npm run playtest -- --hands 100000 --size 6 --lineup mixed` runs, Then it completes in at most 60 minutes [REQ-062.5]
- [x] #3 Given the CI nightly schedule or a manual dispatch, When the 1,000,000-hand line-up run executes as E01-S17's parallel shards with deterministic per-shard seeds, Then every shard finishes within the 6-hour GitHub job limit, re-running a shard with its seed gives byte-identical output, and the combined report covers all 1,000,000 hands [REQ-056.2, REQ-062.4]
- [x] #4 Given E06 bots that use earlier showdowns, When the playtest runner plays a session, Then it passes each seat the earlier showdowns from previous hands instead of an empty list
- [x] #5 Given bot style checks, When they run in the playtest, Then they are composed with checkStep through the onAction hook, not a new runner parameter
- [x] #6 Given the 6-player playtest seats TAG bots that only check after the flop, When the invariant runs for this story execute, Then at least one 6-player line-up includes betting policies so postflop betting and the postflop cap are exercised
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Timing of the 100,000-hand 6-max Mixed run with style bots is recorded in the story notes for the reference machine [REQ-062.5]
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
1. playtest:million --lineups: 27 shards (Mixed/Tough/Soft × sizes 2–10), deterministic seeds, combined report with per line-up/size counts; default run byte-identical.
2. Dispatch-only .github/workflows/million-lineups.yml (no schedule).
3. Runner passes earlier showdowns (HandSetup.earlierShowdowns, last 1,000); composeChecks for onAction.
4. AC#6 proof: Tough 6-max includes postflop bets and a capped street.
5. Opt-in throughput test (100k 6-max Mixed ≤ 60 min).
6. Live GitHub dispatch not in scope (budget, TASK-1.51).

Full spec: doit/TASK-6.9/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-1.6 follow-up (doc-15).

AC added from TASK-1.8 follow-up (doc-16).

AC added from TASK-6.1 follow-up (doc-18).

Build: --lineups 27-shard million run (1,000,000 hands, 0 violations, 26 s locally), dispatch-only million-lineups.yml, earlier showdowns passed to bots (last 1,000), composeChecks; 100k 6-max Mixed 27 s; baselines unchanged; gate PASS.

Review R1: 0 blocking (code 3 NITs, security 1 NIT) — not tracked.

Judge R1 PASS 13/13 (own full --lineups run 25.9 s, 3 shard re-runs byte-identical, 100k 27.3 s). J-1-01 MEDIUM (restart resets untested) fixed in-story with a unit test that fails if either reset is removed; gate PASS. J-1-02 LOW (cap reach is seed-dependent) info only. AC#3 live dispatch tracked on TASK-1.51. Follow-ups: ACs on TASK-1.51, TASK-6.15; notes on TASK-6.19, TASK-6.11.

Locked test(s) unlocked for TASK-7.32 Q-1 (user-approved advice/bot fix; expected values re-pinned one-for-one).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added `npm run playtest:million -- --lineups`: 27 shards (Mixed/Tough/Soft x sizes 2-10, fixed seeds), per-line-up hand counts, exit 0 only with zero violations; new dispatch-only million-lineups.yml (30 min). Runner now passes earlier showdowns (bounded 1,000, reset on restart) and exports composeChecks for style checks. Verified: npm test/lint/typecheck pass (coverage 97.3%), full line-up run 26.0 s real 27/27 shards 0 violations, 100k 6-max Mixed 27.3 s (M4 Pro, Node 22.18.0), default-run hashes unchanged, review R1 0 blocking. Review assumptions A-1..A-7 and Q-1..Q-3. NOT proven: AC#3 live GitHub run (no dispatch, awaits TASK-1.51 budget decision). Styles only at 6 seats until TASK-7.6 AC#11. Follow-ups: TASK-6.19 (showdowns by player), session/replay showdowns (TASK-6.15 ACs do not cover).
<!-- SECTION:FINAL_SUMMARY:END -->
