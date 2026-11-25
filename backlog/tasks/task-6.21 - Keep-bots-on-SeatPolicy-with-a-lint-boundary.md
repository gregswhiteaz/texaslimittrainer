---
id: TASK-6.21
title: Keep bots on SeatPolicy with a lint boundary
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-18T07:03:00Z'
updated_date: '2026-11-25T22:22:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-1.5
references:
  - doc-13
  - tools/lint/headless-boundary.js
parent_task_id: TASK-6
priority: medium
type: chore
ordinal: 174000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.5. The PlayerView boundary is enforced by types only; a cast or a direct import of hand internals in bot or advice code would let a bot see hidden cards. A lint rule makes the fairness boundary mechanical.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given code under src/bots imports HandState, createHand, applyAction or any non-type export of src/engine/hand.ts, When npm run lint runs, Then it fails naming the file
- [ ] #2 Given code under src/bots imports only PlayerView, SeatPolicy and other src/engine/player-view.ts types, When npm run lint runs, Then it passes
- [ ] #3 Given src/bots code that reaches engine runtime code through export-from, a side-effect import or a dynamic import(), When npm run lint runs, Then it fails; and the SPEC-09 source-scan test in tests/bots/tag.test.ts is replaced by this rule
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Lint boundary for src/bots: only type imports from player-view and Action/SeatNumber/Street from hand; other engine modules and packages banned; side-effect engine imports banned
2. Acceptance tests (sandbox lint probes + in-process ESLint); replace the SPEC-09 source scan in tag.test.ts
3. No src change; playtest byte-identical

Full spec: doit/TASK-6.21/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-6.1 follow-up (doc-18).

Build: botSeatPolicyConfig lint boundary for src/bots (type-only player-view, Action/SeatNumber/Street from hand, no other engine modules or packages, no side-effect engine imports); acceptance tests fail without the config; SPEC-09 source scan replaced; no src change, playtest byte-identical. gate PASS.
<!-- SECTION:NOTES:END -->
