File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.27 - Tighten-the-playtest-invariant-checker-and-its-messages.md

Task TASK-1.27 - Tighten the playtest invariant checker and its messages
==================================================

Status: ○ To Do
Priority: Medium
Type: chore
Ordinal: 180000
Created: 2026-11-18 18:15 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-0
Parent: TASK-1 - Prove the game headlessly
References: doc-16

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 8 total):
└─ TASK-1.8 - Check game invariants after every playtest action [completed]
   ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
   │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
   │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
   │        ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
   │        │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
   │        │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
   │        └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
   │           └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from TASK-1.8 (doc-16) reviews and judge. Two violation messages can mislead (K2 reuses the board/burn wording for a hole-card error; the C3 awards message can read '$20 but players put in $20'). The deck order of dealt cards is not checked, checkState ignores an empty history or non-betting-street records (J-1-02), a runner that never stops a violating hand hangs the suite instead of failing it, and the CLI repeats describeAction's wording. Message wording was user-approved in TASK-1.8 D-2, so new wording needs the user's OK.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a player with other than two hole cards, When checkState runs, Then the cards violation names the seat and its hole-card count, with wording the user has approved
- [ ] #2 Given award shares that don't add up to an award's amount while totals balance, When checkState runs, Then the chips message names the mismatched award and cannot state equal amounts as a contradiction, with wording the user has approved
- [ ] #3 Given a dealt card that is not from its deck position (hole cards, burns, board per hand.ts D-5 layout), When checkState runs, Then a cards violation is reported
- [ ] #4 Given a state with an empty action history after the deal or a history record on a non-betting street, When checkState runs, Then it reports a legal-action violation
- [ ] #5 Given a runner that does not stop a hand at its first violation, When the playtest tests run, Then they fail within the test timeout instead of hanging
- [ ] #6 Given the CLI violation block, When an action is printed, Then its text comes from describeAction, and the unreachable null guard is removed with the P1 test row asserting a message rather than relying on a throw

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

