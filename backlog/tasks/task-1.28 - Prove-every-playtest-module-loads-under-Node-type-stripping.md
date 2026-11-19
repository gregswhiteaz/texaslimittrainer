---
id: TASK-1.28
title: Prove every playtest module loads under Node type stripping
status: Done
assignee:
  - '@claude'
created_date: '2026-11-18T19:40:00Z'
updated_date: '2026-11-19T22:31:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-6.1
references:
  - doc-18
documentation:
  - doc-34
parent_task_id: TASK-1
priority: medium
type: chore
ordinal: 182000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-6.1 (doc-18). npm run playtest runs TypeScript through Node's built-in type stripping, which rejects some TypeScript syntax (parameter properties, enums) and JSON imports without an attribute. Two such blockers in src/advice went unnoticed until TASK-6.1 because nothing loads the advice code through the playtest path; Vitest uses its own transformer.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given every module reachable from tools/playtest/main.ts, When a test loads them through the playtest loader, Then all load without ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX or import-attribute errors
- [x] #2 Given a module in src/ that uses a parameter property or a JSON import without an attribute, When npm test or npm run lint runs, Then it fails naming the file
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. tools/lint/type-stripping.js: @typescript-eslint/parameter-properties (class-property), no-restricted-syntax for attribute-less JSON imports/re-exports and enums; shared selector array so the headless-boundary block keeps both.
2. tsconfig.json: erasableSyntaxOnly as a typecheck backstop.
3. Acceptance test: real playtest entry runs through the type-stripping loader cleanly; negative controls show the loader rejects a parameter property and an attribute-less JSON import.
4. Sandbox lint test: probe files fail lint naming the file; headless dynamic-import ban still fires.

Full spec: doit/TASK-1.28/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: type-stripping lint (parameter-properties, attribute-less JSON imports, enums) shared with the headless block; erasableSyntaxOnly; real-loader playtest test with negative controls; gate PASS

Judge R1 PASS 5/5, no findings.

Follow-ups (Step 6a): TASK-1.42 chart-print load test + dynamic import() gap.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added two guards so playtest modules can't break under Node type stripping. An acceptance test runs the real playtest entry through the real loader (plus negative controls for parameter properties, enums and attribute-less JSON imports). ESLint rules in tools/lint/type-stripping.js fail `npm run lint` on those constructs in src/ and tools/, naming the file; the headless-boundary block spreads the shared selectors so it doesn't drop them. tsconfig gets erasableSyntaxOnly. Verified: npm test 313 passed/3 skipped, lint/typecheck clean, 10000-hand playtest 0 violations, review and judge PASS in round 1. Assumptions to review: A-1..A-6 in doc-34 (lint not scan test; erasableSyntaxOnly; scope src+tools; enums banned). Follow-up: tools/chart-print/main.ts uses the same loader but has no load test.
<!-- SECTION:FINAL_SUMMARY:END -->
