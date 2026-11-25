# Fix brief — TASK-11.3 (review round 1)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. [MAJOR] tests/stats/g2-target.acceptance.test.tsx:baseline-order-unverified-fixtures-already-chronological (code review)
- Where: tests/stats/g2-target.acceptance.test.tsx:199
- Problem: No test catches a target computed from the hands in input order instead of orderHands order. In every fixture (statRecords in AC#3, seeded() in AC#4/AC#5, the unit cases, and the e2e seed) the records array is already in chronological order, so the 'first 1,000 in orderHands order' rule (A-2, SPEC-03) is only checked against a sessionId-order sort, not against skipping the sort. In production trendData() returns IndexedDB key order, which is not chronological, so that bug would ship unnoticed.
- Evidence: Mutation: I replaced `g2Target(all === data ? order() : orderHands(all))` with `g2Target(all.hands)` in src/stats/trends.ts:219. Then `npx vitest run tests/stats/g2-target.acceptance.test.tsx tests/stats/trends.test.ts` gave 10/10 passing. The file has been restored.
- Expected fix: In AC#3, pass the records in non-chronological order, e.g. `dataOf({ ...stored, records: [...records].sort((a, b) => a.sessionId < b.sessionId ? -1 : a.sessionId > b.sessionId ? 1 : a.handNumber - b.handNumber) })` or reversed, and keep the expectedTarget check. In AC#5, also build `all` from a reversed or sessionId-sorted copy so the `orderHands(all)` branch is exercised against shuffled input (the session ids '6','2','c','1' are not in start order, so a sessionId sort changes the first 1,000).

