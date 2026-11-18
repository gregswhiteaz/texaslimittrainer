---
id: TASK-1.17
title: Prove the engine with a 1,000,000-hand invariant run
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-1.13
  - TASK-1.10
  - TASK-1.14
  - TASK-1.15
  - TASK-1.16
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-1
priority: high
type: feature
ordinal: 31000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a project owner, I want a one-million-hand cash-game playtest covering every table size, so that I can trust the rules engine before anyone practises on it.

1,000,000 headless cash-game hands spread over all table sizes 2-10 with zero invariant violations, run on demand or nightly. Sit-and-go coverage of the 1,000,000-hand run is added in M3 by E05 (the sng level schedule is built there); bot line-up coverage by E06. At the permitted worst case (100,000 hands per 60 minutes) one million hands take about 10 hours, over the 6-hour limit of a GitHub-hosted job: the nightly run is sharded into parallel jobs (e.g. one per table size or 10 x 100,000-hand shards) each with a deterministic per-shard seed, or is run outside CI on the reference machine. Throughput: 100,000 6-max hands in at most 60 minutes on the reference machine (Apple-silicon Mac). Actor 'project owner' = the single Learner in the role of the person who builds and maintains the trainer (requirements.md has only the Learner user class).

## Requirements covered
- REQ-056 (Must): Reliability and invariants — The engine shall complete 1,000,000 headless hands across all table sizes, game types and line-ups with zero invariant violations, and the app shall recover from an unexpected error without losing completed hands.
- REQ-062 (Must): Headless playtest CLI — The project shall provide a command-line playtest runner that plays seeded bot-only hands with the production engine, checks invariants after every action and reports results.

Covers: REQ-056, REQ-062

## Notes
If sharding in CI proves impractical, run the 1,000,000 hands on the reference machine and attach the report to the story; E05 extends this run with sit-and-go hands in M3.

Plan key: E01-S17 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given an on-demand run of 1,000,000 cash-game hands spread over table sizes 2 to 10, When it completes, Then it reports zero invariant violations and exits 0 [REQ-056.2]
- [ ] #2 Given the CI workflow's nightly schedule or a manual dispatch, When the 1,000,000-hand run executes as parallel shards with deterministic per-shard seeds, Then every shard finishes within the 6-hour GitHub job limit, the combined report covers all 1,000,000 hands, and any invariant violation fails the workflow and prints the replay code and action history [REQ-056.2, REQ-062.2]
- [ ] #3 Given the same shard seed and options, When a shard is re-run, Then its output is byte-identical [REQ-062.4]
- [ ] #4 Given the reference machine, When `npm run playtest -- --hands 100000 --size 6` runs, Then it completes in at most 60 minutes [REQ-062.5]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Timing of the 100,000-hand 6-max run is recorded in the story notes for the reference machine [REQ-062.5]
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
