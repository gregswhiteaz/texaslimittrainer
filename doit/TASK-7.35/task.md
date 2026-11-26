File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.35 - Use-the-6-max-opponent-ranges-at-3-4-5-and-7-seats.md

Task TASK-7.35 - Use the 6-max opponent ranges at 3, 4, 5 and 7 seats
==================================================

Status: ◒ In Progress
Priority: Medium
Ordinal: 254000
Assignee: @claude
Created: 2026-11-26 01:56 (UTC)
Updated: 2026-11-26 08:57 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-7 - Get trustworthy advice

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 12 total):
└─ TASK-7.26 - Author heads-up and full-ring default opponent ranges [completed]
   ├─ TASK-7.5 - Estimate each opponent's range from their actions in the hand [completed]
   │  └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
   │     ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
   │     │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
   │     │     └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
   │     │        └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
   │     └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
   │        └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
   │           └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
   │              ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
   │              └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
   │                 └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   └─ TASK-7.6 - Recommend preflop actions at heads-up and full-ring tables [completed]
      └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from TASK-7.26 Q-4. After TASK-7.26 only 2, 6 and 8-10 seat tables have default action ranges; 3, 4, 5 and 7 dealt-in seats still assume every unseen combo, the TASK-7.32 'bots never fold' cause.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a postflop spot at 3, 4, 5 or 7 dealt-in seats, When advice is computed with action ranges, Then it uses default typical-player ranges (6-max, keyed by referenceSizeOf) rather than every unseen combo, and the change to advice and bot play is measured and reviewed
- [ ] #2 Given rangesFor, When called with every seat count from 2 to 10, Then it returns the heads-up ranges for 2, the full-ring ranges for 8-10 and the 6-max ranges for 3-7 (each count pinned by a test); and DEFAULT_RANGES is either used by rangesFor or no longer exported

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

Implementation Notes:
--------------------------------------------------
AC added from TASK-7.26 follow-up (review MINOR + NIT)

AC#2 (added by the orchestrator from TASK-7.26) reworded: it pinned 3/4/5/7 → null, which contradicts AC#1; it now pins every seat count to the ranges AC#1 requires.

