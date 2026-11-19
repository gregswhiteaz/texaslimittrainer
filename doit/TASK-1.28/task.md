File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.28 - Prove-every-playtest-module-loads-under-Node-type-stripping.md

Task TASK-1.28 - Prove every playtest module loads under Node type stripping
==================================================

Status: ○ To Do
Priority: Medium
Type: chore
Ordinal: 182000
Created: 2026-11-18 19:40 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-0
Parent: TASK-1 - Prove the game headlessly
References: doc-18

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 11 total):
└─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
   ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
   │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
   │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
   │        ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
   │        │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
   │        │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
   │        └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
   │           └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
   │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
   └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
      ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
      │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
      └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from TASK-6.1 (doc-18). npm run playtest runs TypeScript through Node's built-in type stripping, which rejects some TypeScript syntax (parameter properties, enums) and JSON imports without an attribute. Two such blockers in src/advice went unnoticed until TASK-6.1 because nothing loads the advice code through the playtest path; Vitest uses its own transformer.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given every module reachable from tools/playtest/main.ts, When a test loads them through the playtest loader, Then all load without ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX or import-attribute errors
- [ ] #2 Given a module in src/ that uses a parameter property or a JSON import without an attribute, When npm test or npm run lint runs, Then it fails naming the file

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

