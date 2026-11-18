---
id: TASK-1.7
title: Run every check in GitHub Actions on each push and pull request
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-18T02:34:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-0
dependencies:
  - TASK-1.1
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-6
parent_task_id: TASK-1
priority: high
type: chore
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a project owner, I want every push and pull request checked automatically in GitHub Actions, so that a broken change is caught before it reaches main.

Built immediately after the toolchain story E01-S01 so that every later story can meet the global DoD item 'CI workflow is green on the story's branch'. GitHub Actions workflow runs lint, typecheck, tests, the build and `npm run e2e` (Playwright plus axe in Chromium and WebKit, REQ-064.4) on every push and pull request; any failing check fails the workflow. The 10,000-hand playtest step is added by E01-S08, the nightly 1,000,000-hand run by E01-S17 and deployment to GitHub Pages by E01-S18. Actor 'project owner' = the single Learner in the role of the person who builds and maintains the trainer (requirements.md has only the Learner user class).

## Requirements covered
- REQ-064 (Should): Continuous integration and deployment — On every push to GitHub, a GitHub Actions workflow shall run lint, typecheck, tests, a 10,000-hand playtest and the build, and on the main branch shall deploy the build to GitHub Pages when all pass.

Covers: REQ-064

## Notes
Cache npm dependencies; pin the Node LTS version used locally.

Plan key: E01-S02 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a push to any branch or a pull request on GitHub, When the workflow triggers, Then it runs `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` and `npm run e2e` (Playwright and axe tests in Chromium and WebKit) [REQ-064.1, REQ-064.4]
- [x] #2 Given a push in which any one of lint, typecheck, tests or build fails, When the workflow finishes, Then the workflow is reported as failed [REQ-064.2]
- [x] #3 Given a push in which all checks pass, When the workflow finishes, Then the workflow is reported as successful [REQ-064.2]
- [x] #4 Given a push in which a Playwright or axe test fails in Chromium or in WebKit, When the workflow finishes, Then the workflow is reported as failed [REQ-064.4, REQ-064.2]
- [x] #5 Given a push to any branch or a pull request on GitHub, When the workflow runs, Then it also runs `npm audit --omit=dev --audit-level=high` and `npm audit --audit-level=critical`, and the workflow is reported as failed if either reports an advisory at that level [TASK-1.1 Q-3]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [x] #2 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [x] #3 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [x] #4 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [x] #5 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [x] #6 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [x] #7 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [x] #8 No new network requests beyond the app's own files [REQ-058.1]
- [x] #9 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [x] #10 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [x] #11 Story documentation is written and published to Backlog.md
- [x] #12 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. .github/workflows/ci.yml: push + pull_request triggers, one ubuntu-24.04 job, SHA-pinned actions, node from .nvmrc (22.18.0) with npm cache, concurrency cancel-in-progress, contents:read, 20 min timeout.
2. Steps: npm ci → audit shipped deps (--omit=dev high) → audit all deps (critical) → lint → typecheck → build → test → Playwright browsers (cached) → e2e Chromium+WebKit; report artifact on e2e failure.
3. tests/ci/workflow.test.ts static checks; README CI section.
4. Proof: 8 local ci-proof/TASK-1.7/* branches each breaking one check (lint, typecheck, build, test, e2e-chromium, e2e-webkit, audit-shipped, audit-all), rehearsed locally; user pushes once; Claude opens a draft PR to prove pull_request trigger; judge reads run results via gh.

Full spec: doit/TASK-1.7/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: .github/workflows/ci.yml (push+PR, npm ci, two audit steps, lint, typecheck, build, test, cached Playwright, e2e Chromium+WebKit), .nvmrc 22.18.0, tests/ci/workflow.test.ts (8 static tests), README CI section; all 8 proof cases rehearsed locally; gate PASS.

Judge round 1 FAIL (SPEC-09 only: PR run cancelled by apt mirror stall at 20-min timeout); re-ran run 44220403675 (attempt 2 success). Judge round 2 PASS 23/23. Proof runs: main 44220276704 ✓, push 44220396247 ✓, PR 44220403675 ✓; lint 44220395401 ✗, typecheck 44220396630 ✗, build 44220395299 ✗, test 44220396647 ✗, e2e-chromium 44220396921 ✗, e2e-webkit 44220395878 ✗, audit-shipped 44220396018 ✗, audit-all 44220396132 ✗ — each at its intended step. Workflow also committed to main (ee5e68f) so GitHub registered it (user-approved).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added .github/workflows/ci.yml (push + pull_request, no filters), .nvmrc (22.18.0), tests/ci/workflow.test.ts (8 static tests) and a README CI section (190 lines, 4 files, no product code touched). The workflow runs npm ci, the two npm audit gates (shipped >= high, all >= critical), lint, typecheck, build, test and Playwright/axe e2e in Chromium and WebKit; any failure fails the run.
Verification: local suite 23/23, e2e 10 passed, audits exit 0. Real GitHub runs: green push run 44220396247 (4m13s); draft PR #1 pull_request run 44220403675 success on re-run; 8 proof branches each failed at exactly the intended step (lint 44220395401, typecheck 44220396630, build 44220395299, test 44220396647, e2e-chromium 44220396921, e2e-webkit 44220395878, audit-shipped 44220396018, audit-all 44220396132). Judge round 1 FAIL (apt stall cancelled the PR run, environmental) then round 2 PASS 23/23. Review round 1 clean.
Review: assumptions A-1..A-14 plus A-15 in doc-6 (notably Build before Test, ubuntu-24.04, SHA-pinned actions, audits as separate early steps, concurrency cancel on all refs). The workflow had to be committed to main (ee5e68f, user approved) before GitHub registered runs.
Follow-ups (not created): delete the 8 remote ci-proof branches; close or merge draft PR #1; branch protection on main; Dependabot for action pins; step timeout+retry for Playwright system deps; harden MINOR test gaps.
<!-- SECTION:FINAL_SUMMARY:END -->
