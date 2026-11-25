File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-6.22 - Make-the-headless-bot-step-use-the-seeded-TAG-decision.md

Task TASK-6.22 - Make the headless bot step use the seeded TAG decision
==================================================

Status: ○ To Do
Priority: Medium
Ordinal: 213000
Created: 2026-11-21 22:26 (UTC)
Labels: follow-up, dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-6 - Face distinct opponents
References: doc-73

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 13 total):
└─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed]
   └─ TASK-6.18 - Draw bot randomness only from the replay code and seat [completed]
      └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
         ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
         │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
         │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
         │        ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
         │        │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
         │        │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
         │        └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
         │           └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
         ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
         │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
         └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
            ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
            │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
            └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from TASK-6.2 (doc-73). src/table/session.ts stepBot still defaults to the pure tagPolicy, so headless bot play never mixes while the app worker and playtest do. Aligning it changes the locked TASK-3.1 session acceptance test (tests/table/session.acceptance.test.ts:177), which needs its owner's approval (exact-equality edit only).

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a bot turn stepped headlessly with stepBot's default policy, When it is a mixed spot, Then the action equals the seeded decision decideTag(view, {random: botRandom(botDecisionSeed(code, view))}) — the same as the app worker
- [ ] #2 Given the locked TASK-3.1 session test, When it is updated with its owner's approval, Then it compares to the exact seeded decision with no widened assertion

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

