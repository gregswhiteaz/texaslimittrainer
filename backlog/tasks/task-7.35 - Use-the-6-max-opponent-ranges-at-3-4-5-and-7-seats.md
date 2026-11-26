---
id: TASK-7.35
title: Use the 6-max opponent ranges at 3, 4, 5 and 7 seats
status: Done
assignee:
  - '@claude'
created_date: '2026-11-26T01:56:00Z'
updated_date: '2026-11-26T10:09:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.26
documentation:
  - doc-158
parent_task_id: TASK-7
priority: medium
ordinal: 254000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.26 Q-4. After TASK-7.26 only 2, 6 and 8-10 seat tables have default action ranges; 3, 4, 5 and 7 dealt-in seats still assume every unseen combo, the TASK-7.32 'bots never fold' cause.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a postflop spot at 3, 4, 5 or 7 dealt-in seats, When advice is computed with action ranges, Then it uses default typical-player ranges (6-max, keyed by referenceSizeOf) rather than every unseen combo, and the change to advice and bot play is measured and reviewed
- [x] #2 Given rangesFor, When called with every seat count from 2 to 10, Then it returns the heads-up ranges for 2, the full-ring ranges for 8-10 and the 6-max ranges for 3-7 (each count pinned by a test); and DEFAULT_RANGES is either used by rangesFor or no longer exported
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. rangesFor(n) = DEFAULT_RANGES[referenceSizeOf(n)]; 3-7 seats use 6-max ranges
2. OpponentRange fields non-null; drop the dead null branch
3. Tests pin every seat count 2-10; update postflop-ranges unit block
4. Measure before/after stats at 3/4/5/7 seats; opt-in slow 100k check
5. Docs: range-model.md effect table

Full spec: doit/TASK-7.35/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-7.26 follow-up (review MINOR + NIT)

AC#2 (added by the orchestrator from TASK-7.26) reworded: it pinned 3/4/5/7 → null, which contradicts AC#1; it now pins every seat count to the ranges AC#1 requires.

Build: rangesFor = DEFAULT_RANGES[referenceSizeOf(n)], 3-7 seats use 6-max ranges; WTSD at 4/5/7 seats back inside 30-42 over 100k; 3-seat VPIP 31.1 (preflop, out of scope) logged for follow-up; gate PASS

Judge r1 PASS (10/10 SPEC items)

Follow-ups: TASK-7.37 created (3/4-seat preflop VPIP). 4-seat WTSD 42.5@10k is noise (41.5@100k), not tracked.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
rangesFor now returns the 6-max ranges at 3-7 seats (heads-up at 2, full-ring at 8-10), so advice and bots at 3/4/5/7 seats use typical-player ranges instead of every unseen hand. Verified: npm test 1454 pass, e2e 383 pass, lint/typecheck clean, judge 10/10; 2/6/9-seat output byte-identical to base. Measured 10k all-TAG: WTSD at 4/5/7 seats drops from 44-46.5 to 40-42.5 and runs are about 30% faster. Assumptions: none; AC#2 was reworded by the orchestrator. Remaining misses: 3-seat VPIP 31.1, 4-seat VPIP 28.1 (preflop chart, out of scope), 4-seat WTSD 42.5 at 10k (41.5 at 100k). Follow-ups: tighten the short-handed preflop opening range; no existing task owns it.
<!-- SECTION:FINAL_SUMMARY:END -->
