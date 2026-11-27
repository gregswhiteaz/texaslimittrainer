File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.37 - Bring-short-handed-TAG-VPIP-inside-its-healthy-range-at-3-and-4-seats.md

Task TASK-7.37 - Bring short-handed TAG VPIP inside its healthy range at 3 and 4 seats
==================================================

Status: ○ To Do
Priority: Low
Ordinal: 257000
Created: 2026-11-26 10:09 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-7 - Get trustworthy advice
References: doc-158

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 13 total):
└─ TASK-7.35 - Use the 6-max opponent ranges at 3, 4, 5 and 7 seats [completed]
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
Follow-up from TASK-7.35 (doc-158). Over 100,000 all-TAG cash hands (seed 42), VPIP is 31.1 at 3 seats and 28.1 at 4 seats against the 6-max healthy range 20-28. VPIP comes from the preflop charts (3-7 seats use the 6-max chart via referenceSizeOf), not the postflop ranges TASK-7.35 changed. 4-seat WTSD 42.5 at 10k is sampling noise (41.5 at 100k, inside) and is not tracked.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given all-TAG cash play at 3 and 4 seats, When 100,000 hands are measured (opt-in slow group), Then VPIP is inside 20-28 and PFR, aggression, WTSD and W$SD stay inside their 6-max healthy ranges, with before/after figures recorded
- [ ] #2 Given 2, 6 and 9 seat tables, When the same playtests run, Then their output is byte-identical to before (no change outside 3-5 seats)

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

