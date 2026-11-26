File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.30 - Tidy-observed-range-helpers-exact-zero-width-and-one-template-filler.md

Task TASK-7.30 - Tidy observed-range helpers: exact zero width and one template filler
==================================================

Status: ○ To Do
Priority: Low
Ordinal: 229000
Created: 2026-11-23 19:21 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-7 - Get trustworthy advice
References: doc-104

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 12 total):
└─ TASK-7.13 - Adjust opponent ranges to their observed play after 30 hands [completed]
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
   └─ TASK-7.12 - Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD [completed]
      └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from TASK-7.13 (doc-104). scaledWidthPct can return about 3.55e-15 instead of exactly 0 when the observed PFR/VPIP is 0 (judge J-2-01; the range is still AA). basisText fills its placeholder with String.replace instead of the existing fillTemplate (code review MINOR basis-text-reimplements-fill-template).

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a CO open-raiser observed for 100 hands with PFR 0, When its scaled width is computed, Then the width is exactly 0 (toBe(0), not toBeCloseTo)
- [ ] #2 Given basisText for 45 hands, When it is rendered, Then it is produced through fillTemplate and reads exactly 'based on 45 hands of this opponent', and no other template-filling helper remains in src/advice

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

