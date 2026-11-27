---
id: TASK-1.58
title: Stop the 3-seat style-check unit test timing out on CI
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-27T11:52:00Z'
updated_date: '2026-11-27T12:14:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies: []
parent_task_id: TASK-1
priority: medium
ordinal: 276000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Main CI run 45992781358 (commit 8bea902) failed once in 'Unit tests with coverage': tests/playtest/style-check-short-handed.test.ts 'style check tallies TAG mixed spots with the short-handed chart at 3 seats' timed out at vitest's default 5000 ms (it runs main() with 300 hands under coverage). The failed-job re-run passed. Make the test's runtime comfortably inside its budget on CI.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given tests/playtest/style-check-short-handed.test.ts, When it runs under npm test with coverage on CI and locally, Then it finishes well inside its time limit (e.g. by tallying fewer hands while still exercising both 3-seat TAG mixed spots, or an explicit per-test timeout sized from measured CI time), with no assertion removed or loosened
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. HANDS 300 -> 200 (both 3-seat TAG mixed spots still see both actions)
2. Compute the 3-seat decisions once per file on first use; violations still asserted each call
3. Explicit 20_000 ms per-test timeout

Full spec: doit/TASK-1.58/spec.md
<!-- SECTION:PLAN:END -->
