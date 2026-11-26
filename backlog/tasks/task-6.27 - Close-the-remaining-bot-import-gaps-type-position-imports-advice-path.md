---
id: TASK-6.27
title: Close the remaining bot import gaps (type-position imports, advice path)
status: Done
assignee:
  - '@claude'
created_date: '2026-11-25T23:03:00Z'
updated_date: '2026-11-26T23:06:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-6.21
references:
  - doc-149
documentation:
  - doc-175
parent_task_id: TASK-6
priority: low
ordinal: 252000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-6.21 judge (doc-149). A type-position import('../engine/hand').HandState in src/bots passes lint and tsc (types only; cannot reach hidden cards at runtime). Bots may also import src/advice, which imports engine runtime — an indirect path outside TASK-6.21's scope.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a src/bots file using a type-position import('../engine/…') outside the allow-list, When lint runs, Then it fails with the REQ-025.1 boundary message (TSImportType selector), and allowed PlayerView types still pass
- [x] #2 Given the indirect src/bots → src/advice → engine path, When the user decides whether bots may import src/advice, Then the decision is recorded and, if barred, a lint test enforces it
- [x] #3 Given a src/bots or src/advice file (other than src/advice/golden.ts), When it imports any project module outside its allow-list (bots: src/bots, src/advice except golden, the allowed engine types, and only the LineUpName/SessionConfig/SessionSeat types from src/table/session; advice: its own files except golden plus the five allowed engine modules) by value, type, re-export or type-position import, Then lint fails with the boundary message, and every current import still lints clean
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Bot lint rule also catches type-position import('../engine/...') outside the allow-list (TSImportType); PlayerView types still pass
2. New adviceHiddenStateConfig: advice code (except golden.ts) can't import engine hand state; bots can't import advice/golden
3. Tests in a new tooling acceptance file (sandbox lint)
4. Record Backlog decision (Q-1 = a)

Full spec: doit/TASK-6.27/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
doit autopilot skipped (2026-11-26): AC#2 needs a user decision (may bots import src/advice?). AC#1 is buildable on its own once that is decided or the AC is split out.

Build: TSImportType selectors in the bot boundary rule; bots barred from advice/golden; adviceHiddenStateConfig keeps engine hand state out of advice code (golden.ts excepted); new tooling acceptance tests; repo lints clean; gate PASS

Recorded decision-3 (accepted): bots may import src/advice; lint guard keeps hidden hand state out of it (Q-1 = a).

AC#3 added (user, review r1 escalation): turn both boundaries into allow-lists so bots can't reach hand state via table/storage/playtest modules or advice/golden.

Judge r1 PASS (SPEC-01..08 and AC#3 judged on substance)

Follow-ups: TASK-6.29 (Function constructor and global alias escapes). NITs not tracked (typecheck-caught or bind nothing).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Closed the bot import gaps. Type-position imports (import('../engine/hand').HandState) in src/bots now fail lint with the REQ-025.1 message (AC#1); allowed PlayerView types pass. AC#2: decision-3 (accepted), Q-1 option (a): bots may keep using src/advice, with a lint guard (adviceHiddenStateConfig) that keeps engine hand state out of advice and bars bots from advice/golden. D-3 rationale: every bot builds on the advice engine (TAG plays it exactly, REQ-026.1), the path is safe today (advice takes only a PlayerView plus pure helpers), so a per-file guard against drift enforces REQ-025.1 without rewriting five bots. Q-2 (user-approved scope change): review r1 showed table/session, storage and playtest were reachable, so both import boundaries became allow-lists; AC#3 added. Verified: 1497 tests pass, lint and typecheck clean, judge round 1 PASS (~75 holdout probes), 3 review rounds (r1 four MAJORs, r2 one MAJOR import.meta.glob plus MINORs, r3 none blocking). No src/ change. Follow-ups: Function constructor via .constructor / globalThis.Function and the Node `global` alias (J-1-01, J-1-02); NITs: case-sensitive golden type-position match, bindless side-effect imports, repeated SESSION_TYPE_NAMES. Doc: doc-175
<!-- SECTION:FINAL_SUMMARY:END -->
