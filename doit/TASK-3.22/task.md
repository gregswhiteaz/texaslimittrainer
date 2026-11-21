File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-3.22 - Pin-the-hand-result-edge-cases.md

Task TASK-3.22 - Pin the hand-result edge cases
==================================================

Status: ○ To Do
Priority: Low
Type: chore
Ordinal: 187000
Created: 2026-11-19 01:10 (UTC)
Updated: 2026-11-21 02:09 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-0
Parent: TASK-3 - Play hands at the table
References: doc-25

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 15 total):
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
Follow-up from TASK-3.4 (doc-25) code review: the only high-card example lists its highest card first, so naming the first card would also pass; hand-result.ts:83 throws 'Seat <n> is not at the table', which the spec doesn't list, no test covers, and can't currently happen.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a high-card hand whose highest card is on the board, When it is named, Then the result reads e.g. 'King high', and a test fails if the first card is named instead of the highest
- [ ] #2 Given the 'Seat <n> is not at the table' throw in src/table/hand-result.ts, When reviewed, Then it is either covered by a test or removed
- [ ] #3 Given a showdown where the user's hand is shown, When the hand result renders, Then 'Your shown cards' lists the user's own two hole cards (src/table/hand-result.ts), and a test fails if another seat's cards are used

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

Implementation Notes:
--------------------------------------------------
AC added from TASK-2.18 follow-up (doc-50).

