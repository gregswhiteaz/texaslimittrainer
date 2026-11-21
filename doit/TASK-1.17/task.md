File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.17 - Prove-the-engine-with-a-1000000-hand-invariant-run.md

Task TASK-1.17 - Prove the engine with a 1,000,000-hand invariant run
==================================================

Status: ○ To Do
Priority: High
Type: feature
Ordinal: 31000
Created: 2026-11-17 22:46 (UTC)
Updated: 2026-11-18 18:15 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-1 - Prove the game headlessly
References: dreams/limit-holdem-trainer/requirements.md
Documentation: doc-1, doc-2

Dependency Graph:
--------------------------------------------------
Depends on (5 direct, 16 total):
├─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed]
│  └─ TASK-1.9 - Let a short-stacked player call all-in [completed]
│     └─ TASK-1.8 - Check game invariants after every playtest action [completed]
│        ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
│        │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
│        │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
│        │        ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
│        │        │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
│        │        │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
│        │        └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
│        │           └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
│        └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
├─ TASK-1.13 - Reject illegal actions without changing the game [completed]
│  └─ TASK-1.12 - Cap each street at one bet plus three raises [completed]
│     └─ TASK-1.11 - Play heads-up hands with heads-up blinds and order [completed]
│        └─ TASK-1.8 - Check game invariants after every playtest action [completed] (shown above)
├─ TASK-1.14 - Allow short all-in bets and raises under the half-bet reopening rule [completed]
│  ├─ TASK-1.9 - Let a short-stacked player call all-in [completed] (shown above)
│  └─ TASK-1.12 - Cap each street at one bet plus three raises [completed] (shown above)
├─ TASK-1.15 - Show and muck cards at showdown in casino order [completed]
│  ├─ TASK-1.8 - Check game invariants after every playtest action [completed] (shown above)
│  └─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed] (shown above)
└─ TASK-1.16 - Move the button and blinds past busted seats [completed]
   ├─ TASK-1.9 - Let a short-stacked player call all-in [completed] (shown above)
   ├─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed] (shown above)
   ├─ TASK-1.11 - Play heads-up hands with heads-up blinds and order [completed] (shown above)
   ├─ TASK-1.14 - Allow short all-in bets and raises under the half-bet reopening rule [completed] (shown above)
   └─ TASK-1.15 - Show and muck cards at showdown in casino order [completed] (shown above)

Dependents (3 direct, 5 total):
├─ TASK-1 - Prove the game headlessly [To Do]
├─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do]
│  └─ TASK-5 - Play a sit-and-go [To Do]
└─ TASK-6.9 - Prove the engine over 1,000,000 cash hands with every line-up preset [To Do]
   ├─ TASK-5.10 - Prove the sit-and-go structure over the 1,000,000-hand invariant run [To Do] (shown above)
   └─ TASK-6 - Face distinct opponents [To Do]

Description:
--------------------------------------------------
As a project owner, I want a one-million-hand cash-game playtest covering every table size, so that I can trust the rules engine before anyone practises on it.

1,000,000 headless cash-game hands spread over all table sizes 2-10 with zero invariant violations, run on demand or nightly. Sit-and-go coverage of the 1,000,000-hand run is added in M3 by E05 (the sng level schedule is built there); bot line-up coverage by E06. At the permitted worst case (100,000 hands per 60 minutes) one million hands take about 10 hours, over the 6-hour limit of a GitHub-hosted job: the nightly run is sharded into parallel jobs (e.g. one per table size or 10 x 100,000-hand shards) each with a deterministic per-shard seed, or is run outside CI on the reference machine. Throughput: 100,000 6-max hands in at most 60 minutes on the reference machine (Apple-silicon Mac). Actor 'project owner' = the single Learner in the role of the person who builds and maintains the trainer (requirements.md has only the Learner user class).

## Requirements covered
- REQ-056 (Must): Reliability and invariants — The engine shall complete 1,000,000 headless hands across all table sizes, game types and line-ups with zero invariant violations, and the app shall recover from an unexpected error without losing completed hands.
- REQ-062 (Must): Headless playtest CLI — The project shall provide a command-line playtest runner that plays seeded bot-only hands with the production engine, checks invariants after every action and reports results.

Covers: REQ-056, REQ-062

## Notes
If sharding in CI proves impractical, run the 1,000,000 hands on the reference machine and attach the report to the story; E05 extends this run with sit-and-go hands in M3.

Plan key: E01-S17 · Dream: limit-holdem-trainer

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given an on-demand run of 1,000,000 cash-game hands spread over table sizes 2 to 10, When it completes, Then it reports zero invariant violations and exits 0 [REQ-056.2]
- [ ] #2 Given the CI workflow's nightly schedule or a manual dispatch, When the 1,000,000-hand run executes as parallel shards with deterministic per-shard seeds, Then every shard finishes within the 6-hour GitHub job limit, the combined report covers all 1,000,000 hands, and any invariant violation fails the workflow and prints the replay code and action history [REQ-056.2, REQ-062.2]
- [ ] #3 Given the same shard seed and options, When a shard is re-run, Then its output is byte-identical [REQ-062.4]
- [ ] #4 Given the reference machine, When `npm run playtest -- --hands 100000 --size 6` runs, Then it completes in at most 60 minutes [REQ-062.5]
- [ ] #5 Given a run split into shards, When results are combined, Then violationCounts are summed per invariant across shards and every shard uses the default checker

Definition of Done:
--------------------------------------------------
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

Implementation Notes:
--------------------------------------------------
AC added from TASK-1.8 follow-up (doc-16).

