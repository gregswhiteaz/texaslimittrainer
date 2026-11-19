File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.21 - Harden-engine-input-validation-found-in-review.md

Task TASK-1.21 - Harden engine input validation found in review
==================================================

Status: ○ To Do
Priority: Medium
Type: chore
Ordinal: 166000
Created: 2026-11-18 07:03 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-0
Parent: TASK-1 - Prove the game headlessly
References: doc-7, doc-9, doc-10

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 5 total):
└─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
   ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
   │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
   │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
   └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
      └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from the TASK-1.2, TASK-1.3 and TASK-1.4 security reviews (non-blocking MINORs). Engine entry points accept a few malformed inputs that a later caller (playtest CLI, session layer, saved data) could pass in.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given parseCard is called with a non-string or a string longer than 3 characters, When it rejects the input, Then it throws a typed error whose message echoes at most 10 characters of the input
- [ ] #2 Given createHand with any stake or stack that is not a safe integer, When the hand is created, Then it is rejected with the existing invalid-config error
- [ ] #3 Given createHand has returned, When the caller mutates the stakes or seats objects it passed in, Then the hand state is unchanged
- [ ] #4 Given nextIntUnbiased(n), When n is outside the range for which it is exactly unbiased, Then it either throws RangeError or is exactly unbiased for that n, and its doc comment states the supported range

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

