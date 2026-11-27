---
id: TASK-6.29
title: 'Close the last bot-boundary escapes: Function constructor and the global alias'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-26T23:06:00Z'
updated_date: '2026-11-27T07:17:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-6.27
references:
  - doc-175
parent_task_id: TASK-6
priority: low
ordinal: 262000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-6.27 (doc-175, judge J-1-01/J-1-02, review r3 MINORs). In src/bots and src/advice, deliberate code can still reach the Function constructor through (fn).constructor, [].constructor.constructor, globalThis.Function or Reflect.apply(Function, ...), and the Node 'global' alias (global.Math.random(), global['indexedDB']) slips past the determinism and headless rules. Either could reach stored hands or break determinism. Only deliberate evasion gets there; nothing does it today.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a src/bots or src/advice file using .constructor property access, globalThis.Function, Reflect.apply/construct with Function, or the bare name global, When lint runs, Then it fails with a boundary or determinism message, and the whole repo still lints clean
- [ ] #2 Given the new bans, When the toolchain acceptance tests run, Then a probe for each form fails lint and removing any one ban makes a test fail
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add Function-constructor bans B1-B5 and global-alias ban B6 to BOT_DETERMINISM_RESTRICTED_SYNTAX; globalThis.Function / globalThis.global property bans
2. New acceptance test with one probe per form, clean probes, repo lints clean
3. Manual mutation check: removing any ban fails a test

Full spec: doit/TASK-6.29/spec.md
<!-- SECTION:PLAN:END -->
