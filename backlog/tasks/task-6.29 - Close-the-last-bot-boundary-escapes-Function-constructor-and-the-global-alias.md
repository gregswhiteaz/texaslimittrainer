---
id: TASK-6.29
title: 'Close the last bot-boundary escapes: Function constructor and the global alias'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-26T23:06:00Z'
updated_date: '2026-11-27T07:59:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-6.27
references:
  - doc-175
documentation:
  - doc-182
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
- [x] #1 Given a src/bots or src/advice file using .constructor property access, globalThis.Function, Reflect.apply/construct with Function, or the bare name global, When lint runs, Then it fails with a boundary or determinism message, and the whole repo still lints clean
- [x] #2 Given the new bans, When the toolchain acceptance tests run, Then a probe for each form fails lint and removing any one ban makes a test fail
- [x] #3 Given a src/bots or src/advice file (or src/engine/bot-random.ts) using the Node process global (process.hrtime/uptime/getBuiltinModule) or globalThis.process, When lint runs, Then it fails with a determinism message, a probe covers each form, and removing the ban makes a test fail
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add Function-constructor bans B1-B5 and global-alias ban B6 to BOT_DETERMINISM_RESTRICTED_SYNTAX; globalThis.Function / globalThis.global property bans
2. New acceptance test with one probe per form, clean probes, repo lints clean
3. Manual mutation check: removing any ban fails a test

Full spec: doit/TASK-6.29/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: B1-B6 syntax bans (constructor access forms, Function as value, global as value) in BOT_DETERMINISM_RESTRICTED_SYNTAX; B7/B8 globalThis.Function / globalThis.global property bans; new acceptance test; each ban removal fails a test (8/8); gate PASS

Review r1 security MAJOR (process global open, same class as global alias): fixed in this story, AC#3 added (autopilot; same choice as the user's TASK-6.27 'Fix both here'). Recorded deviation from the locked spec.

Step 6a: no new tasks. Not tracked (lint tooling, below the value bar): node:* imports in src/engine/bot-random.ts (core engine file, nothing does it, outside the bot-contributor threat model); FUNCTION_AND_GLOBAL_ESCAPES name/doc omits process.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added lint bans in tools/lint/headless-boundary.js for the Function-constructor routes (.constructor, 'constructor' string, destructuring, bare Function, globalThis.Function) and the Node global alias, plus process (review MAJOR, AC#3, autopilot deviation). Two new acceptance test files hold one probe per ban plus clean probes; no src/ change. Verified: npm test PASS (4 gate runs), judge PASS r1, review r2 clean. Review: the autopilot decision to fix process in-story. Risks: runtime-built keys and node:* imports in bot-random.ts remain open; the name/doc of FUNCTION_AND_GLOBAL_ESCAPES omits process.
<!-- SECTION:FINAL_SUMMARY:END -->
