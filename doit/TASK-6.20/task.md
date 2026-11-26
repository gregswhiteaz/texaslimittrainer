File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-6.20 - Decide-how-hand-replay-reproduces-bot-actions-that-use-session-memory.md

Task TASK-6.20 - Decide how hand replay reproduces bot actions that use session memory
==================================================

Status: ○ To Do
Priority: Medium
Type: spike
Ordinal: 173000
Created: 2026-11-18 07:03 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-6 - Face distinct opponents
References: doc-13, dreams/limit-holdem-trainer/requirements.md

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

Dependents (1 direct, 1 total):
└─ TASK-6.23 - Give bots the same earlier showdowns in the app and on replay [To Do]

Description:
--------------------------------------------------
Follow-up from TASK-1.5. REQ-028.2 says replaying a hand reproduces every bot action, but if bots use earlierShowdowns or observed opponent stats, a single hand's record (REQ-052.2) lacks that context. Needs a user decision before bot memory is built.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the options (store session context in hand records, forbid cross-hand bot memory, or relax REQ-028.2), When the user decides, Then the decision is recorded as a Backlog decision and requirements.md is updated if needed

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

