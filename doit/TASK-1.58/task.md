File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.58 - Stop-the-3-seat-style-check-unit-test-timing-out-on-CI.md

Task TASK-1.58 - Stop the 3-seat style-check unit test timing out on CI
==================================================

Status: ○ To Do
Priority: Medium
Ordinal: 276000
Created: 2026-11-27 11:52 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-1 - Prove the game headlessly

Description:
--------------------------------------------------
Main CI run 45992781358 (commit 8bea902) failed once in 'Unit tests with coverage': tests/playtest/style-check-short-handed.test.ts 'style check tallies TAG mixed spots with the short-handed chart at 3 seats' timed out at vitest's default 5000 ms (it runs main() with 300 hands under coverage). The failed-job re-run passed. Make the test's runtime comfortably inside its budget on CI.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given tests/playtest/style-check-short-handed.test.ts, When it runs under npm test with coverage on CI and locally, Then it finishes well inside its time limit (e.g. by tallying fewer hands while still exercising both 3-seat TAG mixed spots, or an explicit per-test timeout sized from measured CI time), with no assertion removed or loosened

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

