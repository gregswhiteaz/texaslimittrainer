---
id: TASK-6.22
title: Make the headless bot step use the seeded TAG decision
status: Done
assignee:
  - '@claude'
created_date: '2026-11-21T22:26:00Z'
updated_date: '2026-11-26T00:07:00Z'
labels:
  - follow-up
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-6.2
references:
  - doc-73
documentation:
  - doc-150
parent_task_id: TASK-6
priority: medium
ordinal: 213000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-6.2 (doc-73). src/table/session.ts stepBot still defaults to the pure tagPolicy, so headless bot play never mixes while the app worker and playtest do. Aligning it changes the locked TASK-3.1 session acceptance test (tests/table/session.acceptance.test.ts:177), which needs its owner's approval (exact-equality edit only).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a bot turn stepped headlessly with stepBot's default policy, When it is a mixed spot, Then the action equals the seeded decision decideTag(view, {random: botRandom(botDecisionSeed(code, view))}) — the same as the app worker
- [x] #2 Given the locked TASK-3.1 session test, When it is updated with its owner's approval, Then it compares to the exact seeded decision with no widened assertion
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. stepBot(table, policy?) defaults to the seeded decideTag decision using the seed botTurn already computes
2. Re-pin the locked TASK-3.1 session test's expected action to the seeded decision (Q-1)
3. New acceptance test comparing headless steps with the real advice worker on the two hands that differ

Full spec: doit/TASK-6.22/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: stepBot(table, policy?) defaults to the seeded decideTag decision; locked TASK-3.1 expected action re-pinned (Q-1); new test matches the real advice worker and fails on the old default; table e2e 24 pass. gate PASS.

Judge r1 PASS 4/4: 1,711 bot steps over 200 codes — headless stepBot default identical to the real worker (TAG, same seed) and the playtest seeded policy, including 9 mixed spots; explicit policies unchanged. CI 45721837009 green (incl. E2E).

Follow-ups: none (style-aware default outside AC#1; stale comment noted).

Locked test(s) unlocked for TASK-7.18 Q-3: one vi.setConfig({ testTimeout: 30_000 }) line added after the global testTimeout was removed; no assertion touched.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
stepBot's default (no policy) now decides with the seeded decideTag(view, {random: botRandom(seed)}), matching the app worker and playtest for TAG; an explicit policy is unchanged. The locked TASK-3.1 test (line 177) was re-pinned to the seeded decision (Q-1) and a new acceptance test pins a real mixed spot (code 26, seat 3: raise seeded vs fold unseeded). Verified: npm test 1420 passed, judge 4/4 PASS, 200-code/1711-step holdout matched the worker, CI green. Review A-1..A-3: default is TAG for every seat regardless of style. Risks: stepBot has no app caller so live play is unchanged; stale comment at src/table/session.ts:67 remains.
<!-- SECTION:FINAL_SUMMARY:END -->
