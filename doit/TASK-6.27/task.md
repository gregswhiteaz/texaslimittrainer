File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-6.27 - Close-the-remaining-bot-import-gaps-type-position-imports-advice-path.md

Task TASK-6.27 - Close the remaining bot import gaps (type-position imports, advice path)
==================================================

Status: ○ To Do
Priority: Low
Ordinal: 252000
Assignee: @claude
Created: 2026-11-25 23:03 (UTC)
Updated: 2026-11-26 13:52 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-6 - Face distinct opponents
References: doc-149

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 7 total):
└─ TASK-6.21 - Keep bots on SeatPolicy with a lint boundary [completed]
   └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
      └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
         ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
         │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
         │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
         └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
            └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from TASK-6.21 judge (doc-149). A type-position import('../engine/hand').HandState in src/bots passes lint and tsc (types only; cannot reach hidden cards at runtime). Bots may also import src/advice, which imports engine runtime — an indirect path outside TASK-6.21's scope.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a src/bots file using a type-position import('../engine/…') outside the allow-list, When lint runs, Then it fails with the REQ-025.1 boundary message (TSImportType selector), and allowed PlayerView types still pass
- [ ] #2 Given the indirect src/bots → src/advice → engine path, When the user decides whether bots may import src/advice, Then the decision is recorded and, if barred, a lint test enforces it

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

Implementation Notes:
--------------------------------------------------
doit autopilot skipped (2026-11-26): AC#2 needs a user decision (may bots import src/advice?). AC#1 is buildable on its own once that is decided or the AC is split out.

