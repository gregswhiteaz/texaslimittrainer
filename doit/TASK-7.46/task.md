File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.46 - Bring-3-seat-TAG-aggression-inside-its-style-band-and-make-the-short-handed-postflop-test-able-to-fail.md

Task TASK-7.46 - Bring 3-seat TAG aggression inside its style band and make the short-handed postflop test able to fail
==================================================

Status: ○ To Do
Priority: Low
Ordinal: 270000
Created: 2026-11-27 08:42 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-7 - Get trustworthy advice
References: doc-183

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 14 total):
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
From TASK-7.37 (doc-183, judge J-1-02, review MINOR). Over 100,000 all-TAG hands at 3 seats, TAG aggression is 65.2% (65.5% at 2,000), above the TAG style band ceiling of 65.0 (it was 65.8-65.9 before TASK-7.37), so npm run playtest -- --size 3 --check-styles exits non-zero. Also the postflop half of the SPEC-03 test in tests/bots/tag-short-handed.acceptance.test.ts cannot fail because recommend ignores the chart option after the flop.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given all-TAG cash play at 3 seats, When 100,000 hands are measured in the opt-in slow group, Then TAG aggression is inside its style band (and every other TAG stat stays inside its band and healthy range), with before/after figures recorded and 2/5/6/9-seat output unchanged unless the story records why
- [ ] #2 Given tests/bots/tag-short-handed.acceptance.test.ts (owner TASK-7.37), When its postflop check is replaced by one with a named input where a wrong implementation would differ (or the claim is dropped with the owner's unlock noted), Then the test can fail and no other assertion is loosened

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

