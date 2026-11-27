File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-12.12 - Show-an-error-instead-of-loading-forever-when-a-second-tab-opens-during-a-blocked-upgrade.md

Task TASK-12.12 - Show an error instead of loading forever when a second tab opens during a blocked upgrade
==================================================

Status: ○ To Do
Priority: Low
Ordinal: 275000
Created: 2026-11-27 11:43 (UTC)
Updated: 2026-11-27 12:12 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-12 - Tune the trainer
References: doc-188

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 16 total):
└─ TASK-12.10 - Harden the settings upgrade and back-control focus order [completed]
   └─ TASK-12.1 - Open Settings from Home and see the app version [completed]
      └─ TASK-2.1 - Start a game from Home through Game Config [completed]
         └─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
            ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
            │  └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
            │     ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
            │     │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
            │     │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
            │     └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
            │        └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
            ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
            │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
            └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
               ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
               │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
               ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
               │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
               └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
                  ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
                  │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
                  └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)

Description:
--------------------------------------------------
From TASK-12.10 (doc-188, judge J-2-01 MEDIUM). With an old-version connection blocking the upgrade, the first app tab rejects with UpgradeBlockedError, but a second app tab opened in the same browser stays on the loading Home menu with no error until the blocker closes: its open request queues behind the first tab's blocked request and never gets its own blocked event. Also bundles small cleanups: docs/storage/hand-records.md version table says 4 while DB_VERSION is 5; in src/storage/hand-store.ts the redundant blockedOpen reset (~:262), the dead db===opening guard (~:268) and an unwrapped 170-char docblock line (~:240).

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given an old connection blocks the upgrade and a second app tab is opened, When that tab's store open gets no response within a bounded time, Then it rejects with UpgradeBlockedError so the tab shows its existing failure state instead of loading forever, and a test covers it
- [ ] #2 Given docs/storage/hand-records.md and src/storage/hand-store.ts, When the version table is corrected to 5 and the redundant reset, dead guard and long docblock line are tidied, Then all storage tests still pass
- [ ] #3 Given a settings save is held (not yet settled) after a previous failure showed the message, When the user makes the next change, Then the message is gone before that save settles (e2e with a held write), pinning TASK-12.11 A-3

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

Implementation Notes:
--------------------------------------------------
AC added from TASK-12.11 follow-up (review MINOR / judge J-1-01)

