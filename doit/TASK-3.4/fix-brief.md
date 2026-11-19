# Fix brief — TASK-3.4 (review round 1)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. [MAJOR] tests/table/hand-result.test.ts:full-house-pair-above-trips-untested (code review)
- Where: tests/table/hand-result.test.ts:36
- Problem: SPEC-05 never covers a full house whose pair ranks above its trips (e.g. 555KK). Every full-house example has the pair below the trips or is two trips, so the Rule-1 clause 'p = highest other rank with count >= 2' is not pinned down. A wrong implementation passes.
- Evidence: Mutants run in a scratch copy. (a) `const pair = withAtLeast(2)[1]` and (b) `withAtLeast(2).find((rank) => rank < trips)` both pass all 5 tests in hand-result.test.ts and hand-result.acceptance.test.tsx. For 5h 5s + 5c Kd Kh 2c 3d, (a) returns 'Full house, fives over fives' and (b) returns 'Full house, fives over undefined'. The current code correctly returns 'Full house, fives over kings'.
- Expected fix: Add an example where the pair outranks the trips, e.g. ['5h 5s', '5c Kd Kh 2c 3d', 'Full house, fives over kings'], and one with trips plus two pairs, e.g. ['5h 5s', '5c Kd Kh Qc Qd', 'Full house, fives over kings'].

