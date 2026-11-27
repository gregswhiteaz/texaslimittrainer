File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.53 - Rebalance-the-CI-sweep-shards-after-value-betting.md

Task TASK-1.53 - Cut CI wall time to about 3.5 minutes: shard E2E and rebalance the sweep shards
==================================================

Status: ○ To Do
Priority: Medium
Ordinal: 223000
Created: 2026-11-23 04:42 (UTC)
Updated: 2026-11-27 18:17 (UTC)
Labels: follow-up, ci, dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-1 - Prove the game headlessly

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 11 total):
└─ TASK-7.8 - Recommend betting or raising for value [completed]
   └─ TASK-7.5 - Estimate each opponent's range from their actions in the hand [completed]
      └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
         ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
         │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
         │     └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
         │        └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
         └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
            └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
               └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
                  ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
                  └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
                     └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)

Description:
--------------------------------------------------
After TASK-7.8, CI run #210: sweep shard 2 took 476 s while shard 1 took 156 s (vitest --shard splits by file count, and the playtest-heavy files cluster). CI wall time went from ~4.5 to ~8 min; the 30-min job limit is still far, but every new bot test lands on the slow shard.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the sweep tests on CI, When they run, Then no sweep shard takes more than about 1.5× the other (by duration, e.g. 3 shards or duration-based file assignment) and the CI wall time on main is back under about 6 min, with every sweep file still run exactly once
- [ ] #2 Given the E2E suite on CI, When it runs, Then it is split into 4 parallel jobs (2 shards per browser, Chromium and WebKit), every e2e test runs exactly once per browser, the Playwright report/artifact on failure still identifies the failing test, and no test or assertion is removed
- [ ] #3 Given a push to main after this change, When CI finishes, Then the wall time is about 3.5 minutes or less, measured on at least 2 runs (the repo is public, so the extra standard-runner jobs are not billed)

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

Implementation Notes:
--------------------------------------------------
Autopilot 2026-11-25 measurement (main CI run 45677932929): wall time 5.6 min (<6 min target met); sweep shard 1 = 123 s, shard 2 = 219 s (1.8x); E2E job (5.6 min) is the critical path, so rebalancing sweeps would not shorten CI. Skipped in autopilot as no-gain; user to decide whether to keep, re-scope or drop.

2026-11-27: user chose 'Shard E2E + rebalance sweeps'. Main run 46046670509: wall 439 s; E2E job 439 s (test step 378 s, ~420 tests x 2 browsers); sweep shard 2 212 s, shard 1 147 s; unit 75 s; lint/build/playtest 62 s. Expected cost ~4-5 extra Actions minutes per run for job setup.

