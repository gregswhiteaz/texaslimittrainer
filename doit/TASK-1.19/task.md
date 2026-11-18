File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.19 - Retry-the-stalled-Playwright-system-dependency-install-in-CI.md

Task TASK-1.19 - Retry the stalled Playwright system-dependency install in CI
==================================================

Status: ○ To Do
Priority: High
Type: chore
Ordinal: 6500
Created: 2026-11-18 04:37 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-0
Parent: TASK-1 - Prove the game headlessly

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 2 total):
└─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
   └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]

Description:
--------------------------------------------------
Twice in four CI-backed stories (TASK-1.7 PR run 44220403675 attempt 1, TASK-1.3 run 44236421395 attempt 1) the 'Install Playwright system dependencies' step stalled on the Ubuntu apt mirror for 19+ minutes and hit the 20-minute job timeout, while the same step normally takes ~30-70 s. Each stall costs a manual cancel/re-run and up to 20 billed minutes on this private repo. Follow-up from TASK-1.7 (J-2-01) and TASK-1.3.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the workflow, When the Playwright system-dependency (and browser) install step runs, Then it has a step-level timeout well below the job timeout (e.g. 5 minutes per attempt)
- [ ] #2 Given the install step fails or times out, When CI continues, Then it retries the install automatically (at least 2 retries) before failing the job
- [ ] #3 Given all install attempts fail, When the job ends, Then the workflow is reported as failed with a log line naming the install step
- [ ] #4 Given a normal run, When the install succeeds on the first attempt, Then total job time is not increased by more than 10 seconds
- [ ] #5 Given the static workflow tests in tests/ci/workflow.test.ts, When they run, Then they assert the timeout and retry are present

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

