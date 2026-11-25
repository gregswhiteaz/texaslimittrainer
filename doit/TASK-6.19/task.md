File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-6.19 - Keep-earlier-showdowns-tied-to-the-player-not-the-seat.md

Task TASK-6.19 - Keep earlier showdowns tied to the player, not the seat
==================================================

Status: ○ To Do
Priority: Medium
Type: feature
Ordinal: 172000
Created: 2026-11-18 07:03 (UTC)
Updated: 2026-11-22 18:28 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-6 - Face distinct opponents
References: doc-13

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 6 total):
└─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
   └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
      ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
      │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
      │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
      └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
         └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from TASK-1.5. earlierShowdowns is keyed by seat number. When a busted cash bot is replaced (REQ-007.5) or seats change in a sit-and-go, a new occupant would inherit the previous player's shown hands, so bots could profile the wrong player. The list is also shared by reference across views.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a bot at seat 4 is replaced, When later views are built, Then no earlier showdown of the previous seat-4 player is attributed to the new bot
- [ ] #2 Given the session appends an earlier showdown, When any seat policy receives it, Then the entry is frozen and cannot be changed by a policy

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

Implementation Notes:
--------------------------------------------------
From TASK-6.9: the playtest runner now passes earlier showdowns (runner.ts, last 1,000, keyed by seat). Its seat-vs-player attribution and freezing are this task's ACs #1–#2 — cover the runner too.

