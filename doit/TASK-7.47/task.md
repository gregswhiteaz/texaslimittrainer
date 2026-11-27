File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.47 - Make-the-short-handed-TAG-postflop-test-cover-river-raises.md

Task TASK-7.47 - Make the short-handed TAG postflop test cover river raises
==================================================

Status: ○ To Do
Priority: Low
Ordinal: 273000
Created: 2026-11-27 10:03 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-7 - Get trustworthy advice
References: doc-185

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 15 total):
└─ TASK-7.46 - Bring 3-seat TAG aggression inside its style band and make the short-handed postflop test able to fail [completed]
   └─ TASK-7.37 - Bring short-handed TAG VPIP inside its healthy range at 3 and 4 seats [completed]
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
From TASK-7.46 judge J-1-03: the 50-hand sample in tests/bots/tag-short-handed.acceptance.test.ts has no river raises, so a river raise->call drift in decideTag is not caught.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given tests/bots/tag-short-handed.acceptance.test.ts (owner TASK-7.37/7.46), When its sample is enlarged or a targeted river-raise view is added, Then a mutation turning a TAG river raise into a call fails the test, with no assertion loosened

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

