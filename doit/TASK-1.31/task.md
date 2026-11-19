File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.31 - Keep-every-chip-amount-a-safe-integer.md

Task TASK-1.31 - Keep every chip amount a safe integer
==================================================

Status: ○ To Do
Priority: Medium
Type: chore
Ordinal: 191000
Created: 2026-11-19 04:25 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-0
Parent: TASK-1 - Prove the game headlessly
References: doc-29

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 6 total):
└─ TASK-1.21 - Harden engine input validation found in review [completed]
   └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
      ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
      │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
      │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
      └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
         └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from TASK-1.21 (doc-29) judge J-1-01 and code review. The A-4 bound assumes a 4-bet cap that the engine does not enforce yet (TASK-1.12), and stacks up to MAX_SAFE_INTEGER are accepted. The judge played a legal 10-seat hand at the A-4 bound that produced 11 unsafe numbers (largest 90071992547408820). minimumStack's doc comment also claims the cap. No test pins the factor 10 in A-4 or that createHand reads each field once.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given any config createHand accepts, When the hand is played legally to the end, Then every stack, contribution, pot and award stays a safe integer (stacks bounded in createHand, or proven via the TASK-1.12 cap), and a test plays the worst case
- [ ] #2 Given stakes with bigBet 2^49 and stacks 2^52, When createHand validates them, Then it rejects them with 'Invalid stakes' (pins the factor 10 in the A-4 bound)
- [ ] #3 Given a config built from one-shot getters or a counting Proxy, When createHand runs, Then each field is read exactly once (test)
- [ ] #4 Given minimumStack's doc comment, When read, Then it does not claim a cap the engine doesn't enforce

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

