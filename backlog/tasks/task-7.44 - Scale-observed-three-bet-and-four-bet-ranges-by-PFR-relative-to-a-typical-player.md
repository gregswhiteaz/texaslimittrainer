---
id: TASK-7.44
title: >-
  Scale observed three-bet and four-bet ranges by PFR relative to a typical
  player
status: Done
assignee:
  - '@claude'
created_date: '2026-11-27T03:28:00Z'
updated_date: '2026-11-27T06:46:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.43
references:
  - doit/TASK-7.29/spec.md
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-104
  - doc-180
parent_task_id: TASK-7
priority: medium
type: enhancement
ordinal: 267000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.29 (decision: Q-3 C). Today every three-bet and four-bet line scales toward raw PFR, so a 22/18 player's 6-max UTG four-bet range goes 2.56% to 18% at 100 hands and even a 12/9 player's goes to 9%. Apply REQ-035.6 as reworded by TASK-7.29: for three-bet and four-bet lines o = min(100, d x observed PFR / typical PFR), typical PFR = midpoint of the healthy PFR band in src/stats/healthy-ranges.json (heads-up 57.5, 6-max 18, full ring 12.5); open-raise keeps raw PFR and calling lines raw VPIP; blend formula and 30-hand threshold unchanged. No new stat, no persisted-format change; no locked test should need a re-pin (observed-ranges AC#2 covers only open-raise and call-raise). Expected values: doit/TASK-7.29/spec.md §5. Re-verify the 4 observed golden postflop spots.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a 6-max UTG four-bettor seen for 100 hands with PFR 18, When the range is estimated, Then its scaled width is 2.56% (the default), within 0.01
- [x] #2 Given the same seat with PFR 45 or PFR 9 at 100 hands, When the range is estimated, Then the width is 6.41% or 1.28% respectively, within 0.01
- [x] #3 Given heads-up and full-ring tables, When a three-bet or four-bet range is scaled, Then the typical PFR is 57.5 and 12.5 respectively, and o is capped at 100
- [x] #4 Given open-raise and calling lines, When ranges are scaled, Then they are unchanged from FU-A (raw PFR and raw VPIP)
- [x] #5 Given the 4 observed golden postflop spots, When npm test runs, Then each still agrees and is clear-cut, or each changed one is re-justified with the user's sign-off
- [x] #6 Given docs/advice/range-model.md, When the story is done, Then its line-to-stat table and Known limits state the relative re-raise rule
- [x] #7 Given a full-ring UTG four-bet line (default width 1.21%) and an opponent observed for 100 hands, When the observed PFR is 12.5 or 25, Then the scaled widths are 1.21% and 2.42%; and given any three-bet or four-bet line where default × PFR ÷ typical PFR exceeds 100, Then the scaled width is 100% (heads-up uses typical PFR 57.5 and is covered by one concrete width in the same test)
- [x] #8 Given resizeRange in src/advice/ranges.ts, When its empty-default branch is either covered by a unit test or removed as unreachable, Then no untested branch remains; and the tautological 'expected contains default' check at tests/advice/observed-resize.acceptance.test.ts:143 is replaced by a check that can fail (owner TASK-7.43 unlock), with no assertion dropped
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. TYPICAL_PFR table + typicalPfr/relativePfrPct in src/advice/ranges.ts
2. three-bet/four-bet lines scale by relative PFR (capped 100) in estimateOpponentRanges
3. Tests: new observed-reraise acceptance, drift test vs HEALTHY_RANGES, update unit test, resizeRange empty-default tests, fix tautological check (TASK-7.43 unlock)
4. Docs range-model.md

Full spec: doit/TASK-7.44/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-7.29 follow-up (review r1 MINOR: AC#3 had no observable widths)

AC added from TASK-7.43 follow-up (review r1 MINOR + NIT)

Build: TYPICAL_PFR + relativePfrPct; three-bet/four-bet scale by PFR relative to typical (cap 100); drift test vs HEALTHY_RANGES; empty-default resizeRange tests; TASK-7.43 locked line 143 replaced (unlock noted); gate PASS

Step 6a: no new tasks (comment NIT not tracked; TASK-7.45 owns position-aware scaling).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Three-bet and four-bet observed ranges now scale by min(100, default x PFR / typical PFR), typical PFR = healthy band midpoint (57.5 heads-up, 18 6-max, 12.5 full ring), per the TASK-7.29 Q-3 C decision. Open-raise and calling lines are unchanged. Also covers the resizeRange empty-default branch and replaces the tautological check at observed-resize line 143 (locked edit, owner TASK-7.43). Verified: npm test, lint and typecheck pass; judge PASS round 1; review round 1 had two NITs only; the 4 golden spots are unaffected. Review: A-1 (TYPICAL_PFR constant plus drift test, because advice cannot import src/stats), A-2 (2.42 checked within 0.01), A-3 (cap tested on a synthetic default), A-4, A-5. Risks: change is 388 lines vs 260 budget; a stale test comment at observed-reraise.acceptance.test.ts:222. Follow-up: TASK-7.45 position-aware scaling.
<!-- SECTION:FINAL_SUMMARY:END -->
