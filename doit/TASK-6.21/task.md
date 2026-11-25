File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-6.21 - Keep-bots-on-SeatPolicy-with-a-lint-boundary.md

Task TASK-6.21 - Keep bots on SeatPolicy with a lint boundary
==================================================

Status: ○ To Do
Priority: Medium
Type: chore
Ordinal: 174000
Created: 2026-11-18 07:03 (UTC)
Updated: 2026-11-18 19:40 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-6 - Face distinct opponents
References: doc-13, tools/lint/headless-boundary.js

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
Follow-up from TASK-1.5. The PlayerView boundary is enforced by types only; a cast or a direct import of hand internals in bot or advice code would let a bot see hidden cards. A lint rule makes the fairness boundary mechanical.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given code under src/bots imports HandState, createHand, applyAction or any non-type export of src/engine/hand.ts, When npm run lint runs, Then it fails naming the file
- [ ] #2 Given code under src/bots imports only PlayerView, SeatPolicy and other src/engine/player-view.ts types, When npm run lint runs, Then it passes
- [ ] #3 Given src/bots code that reaches engine runtime code through export-from, a side-effect import or a dynamic import(), When npm run lint runs, Then it fails; and the SPEC-09 source-scan test in tests/bots/tag.test.ts is replaced by this rule

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

Implementation Notes:
--------------------------------------------------
AC added from TASK-6.1 follow-up (doc-18).

