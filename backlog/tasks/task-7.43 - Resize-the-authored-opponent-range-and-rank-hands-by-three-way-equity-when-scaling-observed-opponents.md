---
id: TASK-7.43
title: >-
  Resize the authored opponent range and rank hands by three-way equity when
  scaling observed opponents
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-27T03:27:00Z'
updated_date: '2026-11-27T05:33:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.29
references:
  - doit/TASK-7.29/spec.md
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-104
parent_task_id: TASK-7
priority: medium
type: enhancement
ordinal: 266000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.29 (decision: Q-1 B resize the authored default range, Q-2 B hand order by equity against three random hands). Today estimateOpponentRanges replaces an observed opponent's range with the strongest width % of the hand order (TASK-7.13 A-8), so at the default width the 6-max BB call-raise range swaps 22, 54s-98s for AA, KK, QQ, JJ, AKs, AQs, AKo, AQo. The order (equity against one random hand) ranks K2o #87, Q2o #108 and J2o #123 above 87s #99, 76s #116 and 65s #128. Build the observed range by resizing the authored default with TASK-7.29 rule A-5, and regenerate src/advice/ranges/hand-order.json (format v1, same path) by seeded computeEquity against three random hands. Facts and locked-test map: doit/TASK-7.29/spec.md §3. Locked re-pin: tests/advice/observed-ranges.acceptance.test.ts AC#2 (owner TASK-7.13) asserts the prefix rule and must be unlocked and re-pinned under its owner to the resize rule; AC#5 and AC#6 and tests/advice/observed-range-tidy.acceptance.test.ts AC#1 (TASK-7.30) must pass unchanged. Re-verify the 4 observed golden postflop spots (tests/golden/postflop-spots.json lines 277, 799, 828, 1181). Any full 169-class recomputation check goes only in the opt-in npm run test:slow group.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given an observed opponent whose scaled width equals the default width, When the range is estimated, Then the start classes equal the authored default range
- [ ] #2 Given a scaled width above the default, When the range is estimated, Then it is the default plus hand-order classes not in the default, strongest first, up to the first count of combos that reaches the width (all 169 classes at 100 or more)
- [ ] #3 Given a scaled width below the default, When the range is estimated, Then it is the shortest strongest-first run of the default classes, in hand order, whose combos reach the width, and never less than the default's strongest class
- [ ] #4 Given the regenerated hand-order.json, When it loads, Then AA is first, 87s, 76s and 65s rank above K2o, Q2o and J2o, and spot-checked stored equities match seeded computeEquity against three random hands
- [ ] #5 Given the locked observed-ranges AC#2 (TASK-7.13), When the rule changes, Then it is unlocked and re-pinned under its owner to the resize rule with the edit listed in the task notes, and observed-ranges AC#5, AC#6 and observed-range-tidy AC#1 pass unchanged
- [ ] #6 Given the 4 observed golden postflop spots, When npm test runs, Then each still agrees and is clear-cut, or each changed one is re-justified with the user's sign-off
- [ ] #7 Given docs/advice/range-model.md and the hand-order justification, When the story is done, Then they describe the resize rule and the three-random-hands order and drop the matching Known limits sentence
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. resizeRange: resize the authored default range (add strongest missing classes when wider, keep strongest default run when narrower, floor = default's strongest class)
2. Regenerate hand-order.json by equity vs three random hands (v1 format)
3. Re-pin observed-ranges AC#2 (TASK-7.13), review-numbers equity (TASK-9.3), golden spot 6max-turn-bb-call-a6s (TASK-7.14)
4. New acceptance tests; full 169-class recompute in test:slow only
5. Update docs/advice/range-model.md

Full spec: doit/TASK-7.43/spec.md
<!-- SECTION:PLAN:END -->
