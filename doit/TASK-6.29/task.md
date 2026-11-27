File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-6.29 - Close-the-last-bot-boundary-escapes-Function-constructor-and-the-global-alias.md

Task TASK-6.29 - Close the last bot-boundary escapes: Function constructor and the global alias
==================================================

Status: ○ To Do
Priority: Low
Ordinal: 262000
Created: 2026-11-26 23:06 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-6 - Face distinct opponents
References: doc-175

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 8 total):
└─ TASK-6.27 - Close the remaining bot import gaps (type-position imports, advice path) [completed]
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
Follow-up from TASK-6.27 (doc-175, judge J-1-01/J-1-02, review r3 MINORs). In src/bots and src/advice, deliberate code can still reach the Function constructor through (fn).constructor, [].constructor.constructor, globalThis.Function or Reflect.apply(Function, ...), and the Node 'global' alias (global.Math.random(), global['indexedDB']) slips past the determinism and headless rules. Either could reach stored hands or break determinism. Only deliberate evasion gets there; nothing does it today.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a src/bots or src/advice file using .constructor property access, globalThis.Function, Reflect.apply/construct with Function, or the bare name global, When lint runs, Then it fails with a boundary or determinism message, and the whole repo still lints clean
- [ ] #2 Given the new bans, When the toolchain acceptance tests run, Then a probe for each form fails lint and removing any one ban makes a test fail

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

