File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-6.30 - Decide-whether-the-style-checks-one-action-rule-needs-a-minimum-sample-for-rare-mixed-spots.md

Task TASK-6.30 - Decide whether the style check's one-action rule needs a minimum sample for rare mixed spots
==================================================

Status: ○ To Do
Priority: Low
Ordinal: 272000
Created: 2026-11-27 10:03 (UTC)
Labels: dream-limit-holdem-trainer, follow-up, spike
Milestone: m-1
Parent: TASK-6 - Face distinct opponents
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
From TASK-7.46 (doc-185, Q-2). REQ-027.5 fails --check-styles when any mixed spot used only one action. At 3 seats the TAG preflop-limpers spot occurs about once in 50,000-100,000 hands, so npm run playtest -- --size 3 --check-styles exits 1 even though every band holds. Options: a minimum sample before the rule applies; keep the rule; exclude spots below N occurrences. If the rule changes, restore the exit-0 assertion (or rename) in tests/playtest/check-styles-three-seats.acceptance.test.ts.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the options above, When the user decides, Then the decision is recorded and any change becomes a follow-up story that restores an exit-0 check (or renames the slow test) for 3-seat --check-styles

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

