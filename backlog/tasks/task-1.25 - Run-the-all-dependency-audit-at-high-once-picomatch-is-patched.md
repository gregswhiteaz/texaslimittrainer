---
id: TASK-1.25
title: Run the all-dependency audit at high once picomatch is patched
status: Done
assignee:
  - '@claude'
created_date: '2026-11-18T07:03:00Z'
updated_date: '2026-11-26T11:46:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-1.7
references:
  - doc-5
documentation:
  - doc-160
parent_task_id: TASK-1
priority: low
type: chore
ordinal: 170000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.1 (Q-3): the dev/build-only picomatch advisory GHSA-fc5q-39xc-vjpf is tolerated, so the all-deps audit runs at --audit-level=critical. Revisit when a patched picomatch ships.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a patched picomatch is available through our dev dependencies, When CI runs the all-dependency audit, Then it uses --audit-level=high and passes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. ci.yml: all-deps audit --audit-level=critical -> high (both audit steps kept)
2. Update expected strings in tests/ci/workflow.test.ts and tests/ci/ci-jobs.acceptance.test.ts (unlocked under owners)
3. README CI table and local-equivalent command
4. Verify the pushed branch run's 'Audit all dependencies' step passes

Full spec: doit/TASK-1.25/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Spec finding: GHSA-fc5q-39xc-vjpf was withdrawn on 2026-11-18, not patched; picomatch@4.0.7 is still a dev dependency (vite -> tinyglobby). Proceeding per Q-1 (auto-accepted).

Build: all-deps audit at --audit-level=high; CI tests' expected string updated; README; gate PASS

Judge r1 PASS (5/5 SPEC items); CI run 45812549642 green at f456bd3 with both audit steps passing

Follow-ups: none.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Changed CI's 'Audit all dependencies' step from npm audit --audit-level=critical to --audit-level=high (ci.yml, two CI tests, README; 26 lines, no dependency changes). NOTE: advisory GHSA-fc5q-39xc-vjpf was withdrawn on 2026-11-18, not patched; picomatch 4.0.7 is still a dev dependency (Q-1, auto-accepted). Verified: npm test 1454 passed, lint/typecheck pass, local audits at high report 0 vulnerabilities, CI run 45812549642 green, judge round 1 PASS (5/5), review had NITs only. Assumptions to review: A-1 keep both audit steps, A-2 keep step name, A-3 README updated in place. Risk: if the advisory is reinstated, CI fails at this step (intended).
<!-- SECTION:FINAL_SUMMARY:END -->
