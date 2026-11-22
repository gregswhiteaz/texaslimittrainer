File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-3.27 - Make-the-Rapid-pace-400-ms-self-test-deterministic-in-WebKit.md

Task TASK-3.27 - Make the Rapid-pace 400 ms self-test deterministic in WebKit
==================================================

Status: ◒ In Progress
Priority: High
Ordinal: 214000
Assignee: @claude
Created: 2026-11-21 23:44 (UTC)
Updated: 2026-11-22 00:06 (UTC)
Labels: follow-up, dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-3 - Play hands at the table

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 16 total):
└─ TASK-3.13 - Play at Rapid bot pace [completed]
   └─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed]
      └─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed]
         ├─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
         │  ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
         │  │  └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
         │  │     ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
         │  │     │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
         │  │     │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
         │  │     └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
         │  │        └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
         │  ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
         │  │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
         │  └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
         │     ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
         │     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
         │     ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
         │     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
         │     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
         │        ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
         │        │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
         │        └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
         └─ TASK-3.5 - Read big-index cards drawn in code [completed] (shown above)

Description:
--------------------------------------------------
Main CI #155 (run 44962301903, commit 3637e36) failed only on [webkit] e2e/rapid-pace.spec.ts:248 'the paused-clock pace check catches a 400 ms wait': meterBotAction returned null ('a bot is to act'), i.e. no bot was left to act before the user's turn. Branch CI for the same code (#154) and main #153 passed, so it's timing-dependent: the start-up loop advances the paused clock in 50 ms slices for up to 2,000 ms with every 0 ms wait stretched to 400 ms, so several bot actions (each awaiting a worker reply) can complete during start-up and use up the bots before the user's seat. Test-only flake from TASK-3.13 (locked file; owner TASK-3.13).

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the fixed test, When it runs 50 times in a row in WebKit and Chromium locally (--repeat-each 50) and in one CI run, Then it passes every time and still fails if RAPID_BOT_DELAY_MS is set to 400 (proven by mutant)
- [ ] #2 Given the 400 ms self-test, When it starts, Then it advances the paused clock 1 ms at a time only until the deal shows, asserts exactly the two blinds are posted and seat 3 is to act, and the meter returns a time (not null) for the last bot before the user's turn even when that bot's reply lands between its checks

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

Implementation Notes:
--------------------------------------------------
AC#1 rewritten by the user (Q-1): the original hypothesis was refuted; real cause is a check-order race in meterBotAction.

