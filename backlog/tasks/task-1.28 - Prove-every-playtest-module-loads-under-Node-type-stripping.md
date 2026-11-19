---
id: TASK-1.28
title: Prove every playtest module loads under Node type stripping
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-18T19:40:00Z'
updated_date: '2026-11-19T22:26:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-6.1
references:
  - doc-18
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
- [ ] #1 Given every module reachable from tools/playtest/main.ts, When a test loads them through the playtest loader, Then all load without ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX or import-attribute errors
- [ ] #2 Given a module in src/ that uses a parameter property or a JSON import without an attribute, When npm test or npm run lint runs, Then it fails naming the file
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. tools/lint/type-stripping.js: @typescript-eslint/parameter-properties (class-property), no-restricted-syntax for attribute-less JSON imports/re-exports and enums; shared selector array so the headless-boundary block keeps both.
2. tsconfig.json: erasableSyntaxOnly as a typecheck backstop.
3. Acceptance test: real playtest entry runs through the type-stripping loader cleanly; negative controls show the loader rejects a parameter property and an attribute-less JSON import.
4. Sandbox lint test: probe files fail lint naming the file; headless dynamic-import ban still fires.

Full spec: doit/TASK-1.28/spec.md
<!-- SECTION:PLAN:END -->
