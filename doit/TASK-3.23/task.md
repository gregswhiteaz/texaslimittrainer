File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-3.23 - Tighten-the-card-visual-checks-and-keep-the-Linux-baselines-current.md

Task TASK-3.23 - Tighten the card visual checks and keep the Linux baselines current
==================================================

Status: ○ To Do
Priority: Low
Type: chore
Ordinal: 204000
Created: 2026-11-20 03:45 (UTC)
Updated: 2026-11-20 23:45 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-0
Parent: TASK-3 - Play hands at the table
References: doc-38

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 3 total):
└─ TASK-3.20 - Make card tests catch painted colour and logo regressions in CI [completed]
   └─ TASK-3.5 - Read big-index cards drawn in code [completed]
      └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]

Description:
--------------------------------------------------
Follow-up from TASK-3.20 review (MINOR, NITs) and spec scope concerns: containment gap, duplicate decode, unasserted artifact steps, baseline regeneration on Playwright bumps, and an undigested container image.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a card part with no <path>, When partsOutsideCard runs, Then it reports that part
- [ ] #2 Given the card-back logo test, When it runs, Then the image is decoded once (via logoProblems) with no inline duplicate
- [ ] #3 Given a Dependabot Playwright bump that changes rendering, When Visual goes red, Then the README documents (or a workflow automates) regenerating baselines with gh workflow run visual.yml --ref <branch> -f update=true

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

Implementation Notes:
--------------------------------------------------
Infra ACs removed 2026-11-20 under the user's value filter (artifact-step assertions, container digest pin); trainer-test and baseline-regeneration ACs kept.

