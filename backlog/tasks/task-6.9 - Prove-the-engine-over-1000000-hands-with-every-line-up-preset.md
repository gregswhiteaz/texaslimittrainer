---
id: TASK-6.9
title: Prove the engine over 1,000,000 cash hands with every line-up preset
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-18T18:15:00Z'
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
- [ ] #1 Given the nightly or on-demand 1,000,000-hand cash run, When it completes, Then it has played Mixed, Tough and Soft line-ups at every table size from 2 to 10, prints the hand count per line-up and size, reports zero invariant violations and exits 0 [REQ-056.2]
- [ ] #2 Given the reference machine, When `npm run playtest -- --hands 100000 --size 6 --lineup mixed` runs, Then it completes in at most 60 minutes [REQ-062.5]
- [ ] #3 Given the CI nightly schedule or a manual dispatch, When the 1,000,000-hand line-up run executes as E01-S17's parallel shards with deterministic per-shard seeds, Then every shard finishes within the 6-hour GitHub job limit, re-running a shard with its seed gives byte-identical output, and the combined report covers all 1,000,000 hands [REQ-056.2, REQ-062.4]
- [ ] #4 Given E06 bots that use earlier showdowns, When the playtest runner plays a session, Then it passes each seat the earlier showdowns from previous hands instead of an empty list
- [ ] #5 Given bot style checks, When they run in the playtest, Then they are composed with checkStep through the onAction hook, not a new runner parameter
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Timing of the 100,000-hand 6-max Mixed run with style bots is recorded in the story notes for the reference machine [REQ-062.5]
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-1.6 follow-up (doc-15).

AC added from TASK-1.8 follow-up (doc-16).
<!-- SECTION:NOTES:END -->
