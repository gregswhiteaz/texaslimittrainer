File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.36 - Tune-Dependabot-so-its-PRs-match-the-runtime-and-peer-pins.md

Task TASK-1.36 - Tune Dependabot so its PRs match the runtime and peer pins
==================================================

Status: ○ To Do
Priority: Medium
Type: chore
Ordinal: 196000
Created: 2026-11-19 04:55 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-0
Parent: TASK-1 - Prove the game headlessly
References: doc-30

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 3 total):
└─ TASK-1.24 - Protect main and keep CI action pins current [completed]
   └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
      └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]

Dependents (1 direct, 1 total):
└─ TASK-1.34 - Confirm Dependabot runs and clear merged doit branches after the first push [To Do]

Description:
--------------------------------------------------
Follow-up from the first Dependabot run after TASK-1.24 (2026-11-19): it opened PR #2 bumping @types/node 22.20.5 -> 26.6.6 although the app runs on Node 22, and its npm job failed updating typescript because typescript-eslint is a peer that must move with it (ETARGET for @typescript-eslint/eslint-plugin@8.73.0 inside the cooldown window). Revisits assumption A-3 (no ignore rules).

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given .github/dependabot.yml, When Dependabot evaluates @types/node, Then it ignores semver-major updates so @types/node stays on the Node major used by CI and engines (22)
- [ ] #2 Given a new typescript release, When Dependabot runs, Then typescript and typescript-eslint packages are updated in the same grouped PR (or typescript waits until typescript-eslint supports it) and the npm update job completes without a peer-dependency error
- [ ] #3 Given the config change, When tests/ci/dependabot.acceptance.test.ts runs, Then it pins the @types/node ignore rule and the typescript grouping

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

