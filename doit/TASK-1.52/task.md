File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.52 - Remove-timing-fragile-tests-that-turn-CI-red-on-slow-runners.md

Task TASK-1.52 - Remove timing-fragile tests that turn CI red on slow runners
==================================================

Status: ○ To Do
Priority: High
Ordinal: 217000
Created: 2026-11-22 14:55 (UTC)
Labels: follow-up, bug, ci, dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-1 - Prove the game headlessly

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 17 total):
└─ TASK-6.6 - Seat bots by line-up preset with unique names [completed]
   ├─ TASK-6.3 - Face a Calling station that calls where TAG would fold or raise [completed]
   │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed]
   │     └─ TASK-6.18 - Draw bot randomness only from the replay code and seat [completed]
   │        └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
   │           ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
   │           │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
   │           │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
   │           │        ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
   │           │        │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
   │           │        │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
   │           │        └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
   │           │           └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   │           ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
   │           │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
   │           └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
   │              ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
   │              │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
   │              └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
   ├─ TASK-6.4 - Face a Maniac that bets and raises where TAG would check or call [completed]
   │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
   └─ TASK-6.5 - Face a Rock that folds every hand outside a narrow starting range [completed]
      └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)

Description:
--------------------------------------------------
Main CI #174 (44990101974, 341563c) failed on two code checks that passed on re-run: (1) tests/playtest/policy.test.ts 'lineUpPolicyFactory plays the preset at 6 seats…' (TASK-6.6) plays 2×200 six-max line-up hands with a Maniac under coverage: 17.5–20 s normally, 31 s on a slow runner, past the 30 s per-test timeout; (2) e2e/action-bar-limits.spec.ts:33 (TASK-3.7, Chromium) expected seat 5 to act after a fixed 1,000 ms paused-clock budget, but seat 4's bot reply from the advice worker had not arrived — the same worker-vs-clock race class TASK-3.27 fixed in rapid-pace.spec.ts. Such failures stop autopilot. User asked (2026-11-22) for a small fix story that also sweeps for other tests with tight timing margins.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the unit (coverage) test group on CI, When it runs, Then no single test takes more than 10 s on the last green CI run, and the TASK-6.6 lineUpPolicyFactory checks keep their assertions (the 200-hand 6-max comparison moves to the sweep group or the opt-in slow group, with a smaller every-push version kept in unit)
- [ ] #2 Given e2e/action-bar-limits.spec.ts with a paused clock, When the bot at seat 4 replies late from the advice worker, Then the test still passes because it advances the clock until the expected seat is to act (bounded), instead of a fixed 1,000 ms budget — proven by delaying worker replies in a test run
- [ ] #3 Given every unit, sweep and e2e test, When per-test durations from the latest main CI run are compared with their timeouts, Then each test that uses more than 50% of its timeout, and each e2e test that advances a paused clock by a fixed budget while waiting for a worker reply, is listed in the story doc and fixed (or justified)
- [ ] #4 Given the changes, When CI runs on the branch, Then all jobs are green and no test assertion is removed or loosened

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

