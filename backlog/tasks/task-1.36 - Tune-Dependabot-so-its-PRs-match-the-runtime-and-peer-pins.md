---
id: TASK-1.36
title: Tune Dependabot so its PRs match the runtime and peer pins
status: Done
assignee:
  - '@claude'
created_date: '2026-11-19T04:55:00Z'
updated_date: '2026-11-20T00:29:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.24
references:
  - doc-30
documentation:
  - doc-36
parent_task_id: TASK-1
priority: medium
type: chore
ordinal: 196000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from the first Dependabot run after TASK-1.24 (2026-11-19): it opened PR #2 bumping @types/node 22.20.5 -> 26.6.6 although the app runs on Node 22, and its npm job failed updating typescript because typescript-eslint is a peer that must move with it (ETARGET for @typescript-eslint/eslint-plugin@8.73.0 inside the cooldown window). Revisits assumption A-3 (no ignore rules).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given .github/dependabot.yml, When Dependabot evaluates @types/node, Then it ignores semver-major updates so @types/node stays on the Node major used by CI and engines (22)
- [ ] #2 Given a new typescript release, When Dependabot runs, Then typescript and typescript-eslint packages are updated in the same grouped PR (or typescript waits until typescript-eslint supports it) and the npm update job completes without a peer-dependency error
- [x] #3 Given the config change, When tests/ci/dependabot.acceptance.test.ts runs, Then it pins the @types/node ignore rule and the typescript grouping
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. .github/dependabot.yml npm entry: typescript group (typescript + typescript-eslint), npm-minor-patch excludes them; ignore semver-major for @types/node and typescript.
2. Append one it() to tests/ci/dependabot.acceptance.test.ts pinning the ignore rules and the group (Q-1).
3. README: one sentence under Dependency updates.
4. Live check after push (SPEC-04) tracked by TASK-1.34.

Full spec: doit/TASK-1.36/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Q-1 (user): append one it() to TASK-1.24's locked tests/ci/dependabot.acceptance.test.ts, existing lines unchanged; unlock recorded under TASK-1.24.

Build: typescript group + exclude-patterns, ignore semver-major for @types/node and typescript, one appended it() (no existing line changed), README sentence; gate PASS

Judge R1: SPEC-01/02/03/05 PASS, SPEC-04 deferred (live Dependabot run). Q-2 (user): close now; AC#1/#2 left unticked because they need the live run — proven via TASK-1.34 AC#4/#5.

Follow-ups (Step 6a): TASK-1.43 removal trigger + exact-match test for the temporary major ignores; live proof via TASK-1.34 AC#4/#5.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added a `typescript` group (typescript + typescript-eslint, excluded from npm-minor-patch) and semver-major ignores for @types/node and typescript in .github/dependabot.yml, so Dependabot stops proposing @types/node 26 and TS 7 (no typescript-eslint supports it). Pinned by one appended test in tests/ci/dependabot.acceptance.test.ts (Q-1) and a README sentence. Verified: npm test 319 passed/3 skipped, lint and typecheck clean, judge SPEC-01/02/03/05 PASS. SPEC-04 (live Dependabot run) is deferred; per Q-2 AC#3 is ticked and AC#1/#2 are proven live via TASK-1.34 AC#4/#5. Assumptions A-1..A-5 to review (see doc). Follow-ups: the major ignores also suppress major-only security PRs and need a removal trigger (typescript-eslint supports next TS major / leaving Node 22); tighten the new test to compare the whole tail to the exact block.
<!-- SECTION:FINAL_SUMMARY:END -->
