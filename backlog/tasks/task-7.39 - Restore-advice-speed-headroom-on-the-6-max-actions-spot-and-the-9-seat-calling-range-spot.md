---
id: TASK-7.39
title: >-
  Restore advice speed headroom on the 6-max actions spot and the 9-seat
  calling-range spot
status: Done
assignee:
  - '@claude'
created_date: '2026-11-26T17:06:00Z'
updated_date: '2026-11-28T03:47:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.34
references:
  - doc-167
documentation:
  - doc-201
parent_task_id: TASK-7
priority: low
ordinal: 260000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.34 (doc-167). 'actions: 6-max flop facing a bet, one opponent' sits at ~79% of its 25 ms target (~15 ms outside equity, likely estimateOpponentRanges). The 9-seat vs 8 opponents spot needed a 200 ms target (TASK-7.34 Q-1) and runs ~132 ms against a 150 ms headroom limit; reaching 100 ms needs a faster multiway calling-range sampler, which may change seeded results.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the opt-in advice perf test, When 'actions: 6-max flop facing a bet, one opponent' runs at real targets, Then its p95 is at most 75% of 25 ms with advice results unchanged (playtest SHA identical)
- [x] #2 Given a faster multiway calling-range sampler, When the 9-seat vs 8 opponents spot runs, Then its p95 is at most 75 ms (75% of 100 ms), and any change to seeded advice or bot results is measured and approved by the user before merge
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. AC#1: reuse the whole-range outcome when the calling range equals it (advice byte-identical)
2. AC#2: CALLING_RANGE_BUDGET 10,000 deals at 7+ live opponents (Q-1 A), only when no equity option is passed (bots unchanged)
3. Opt-in perf test: actions spot timed, 9-seat target back to 100 ms
4. signoff.md delta package for the user before code review

Full spec: doit/TASK-7.39/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
User sign-off 2026-11-28 (AC#2): approved 10,000 calling-range deals at 7+ live opponents per doit/TASK-7.39/signoff.md — 9-seat p95 131 -> 66 ms, actions spot 21.3 -> 10.0 ms; bots and 8 playtest variants byte-identical; user advice changes only in 7+-way pots (calling-range number max 1.1 pts, mean ~0.1, no action/rule changes in 600 sampled views).

Step 6a: none (test-helper move and RangeError-rethrow view are below the value bar).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Reused the repeated exact equity run in recommendPostflop (default equity only) and cut the user's calling-range run to 10,000 deals when 7+ opponents are live (src/advice/postflop.ts). Headroom p95: actions spot 21.3 -> 10 ms (limit 18.75), 9-seat vs 8 opponents 131 -> 66 ms (limit 75); perf target for 9-seat back to 100 ms. Verified: npm test 1567 passed, test:slow 114 passed, 3 headroom passes green, 8 playtest variants byte-identical (default SHA d4d84efb...), judge PASS 9/9, reviews clean. Assumptions to review: A-1..A-6 in doc (notably the delta sample method and that changes apply only without an injected equity seam). User advice changes only in 7+-way pots: calling-range number max 1.1 pts, mean ~0.1, no action or rule changes; user approved the delta package (Q-1 A). Risks/follow-ups: MINOR duplicated viewAfter test helper; no test for a kept RangeError rethrow at attempt 0.
<!-- SECTION:FINAL_SUMMARY:END -->
