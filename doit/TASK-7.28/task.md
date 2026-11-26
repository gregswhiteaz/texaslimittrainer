File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.28 - Count-straight-draw-outs-only-when-a-hole-card-is-part-of-the-draw.md

Task TASK-7.28 - Count straight-draw outs only when a hole card is part of the draw
==================================================

Status: ○ To Do
Priority: Medium
Ordinal: 224000
Created: 2026-11-23 08:19 (UTC)
Updated: 2026-11-23 08:38 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-7 - Get trustworthy advice

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 10 total):
└─ TASK-7.9 - Count implied odds for drawing hands [completed]
   └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
      ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
      │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
      │     └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
      │        └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
      └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
         └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
            └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
               ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
               └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
                  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)

Description:
--------------------------------------------------
From TASK-7.9 review (MINOR): drawOuts counts an open-ended straight draw made entirely by board cards (e.g. 7c 2d on 5h 6s 7h 8d gets 8 outs, the 7c only pairs the board), while the flush half already excludes board-only draws. Every player shares a board-only draw, so advice should not credit hero with those outs. hasOpenEnder (ranges classification) uses the same definition — decide whether range classification changes too.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given hole 7c 2d and board 5h 6s 7h 8d, When drawOuts runs, Then it returns no straight-draw outs
- [ ] #2 Given hole 9c 2d and board 5h 6s 7h, When drawOuts runs, Then it returns the 8 straight-draw outs (a hole card extends the run)
- [ ] #3 Given the change, When the playtest and style-bands checks run, Then all four styles stay inside their bands and any changed playtest SHA is recorded
- [ ] #4 Given hole 9h 8h and board 7h 6h 2h (a made flush), When drawOuts runs, Then it lists no straight-draw outs (a made flush needs no draw)

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

Implementation Notes:
--------------------------------------------------
AC added from TASK-7.9 judge note (made flush still listed OESD outs).

