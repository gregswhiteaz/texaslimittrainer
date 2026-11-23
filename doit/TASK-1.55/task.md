File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.55 - Make-the-onHandComplete-once-e2e-check-wait-for-the-callback.md

Task TASK-1.55 - Make the onHandComplete-once e2e check wait for the callback
==================================================

Status: ○ To Do
Priority: High
Ordinal: 227000
Created: 2026-11-23 15:30 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-1 - Prove the game headlessly

Description:
--------------------------------------------------
Main CI #249 (run 45204245680) failed in WebKit: e2e/hand-records.spec.ts:230 'onHandComplete fires exactly once per hand even with the same replay code' read the harness log once right after the result appeared and saw 0 calls (expected 1). onHandComplete can land just after the real IndexedDB write resolves, so the immediate read races. Test-timing problem, not a product bug (TASK-3.9 owns the locked test).

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the onHandComplete-once e2e test, When it checks the call count after each result, Then it waits with expect.poll (bounded) for exactly the expected count instead of reading once, keeping every exact-count assertion (no assertion dropped or loosened)
- [ ] #2 Given the fix, When the spec runs 20 times in WebKit and Chromium locally (--repeat-each), Then it passes every time

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

