# Fix brief — TASK-11.14 (review round 1)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. [MAJOR] tests/stats/trends.test.ts:fallback-negative-zero-guard-untested (code review)
- Where: tests/stats/trends.test.ts:607
- Problem: The 'never -0' rule of the fallback (A-2, SPEC-02) has no test that can fail. The all-zero-nets case gives v = +0, so Math.sign(0) = 0 and tenths is +0 whatever the guard does.
- Evidence: Mutation run in a scratch copy: changing floatBb100 to `return tenths / 10;` (guard removed) leaves all 14 tests in trends.test.ts and bb100-tampered.acceptance.test.tsx passing.
- Expected fix: Add a fallback case where v is a tiny negative number. For example, primes(500) hands with net 0 except net -1 on the bigBet-3571 hand gives v ≈ -5.6e-5. Assert `Object.is(bb100Value(...), 0)`. The unguarded code returns -0 here.

## 2. [MAJOR] tests/stats/trends.test.ts:fallback-half-away-rounding-untested (code review)
- Where: tests/stats/trends.test.ts:605
- Problem: Half-away-from-zero rounding in the fallback (A-2) is not pinned. The ±3.125 cases are not ties (31.25), so the Math.round alternative that A-2 explicitly rejects gives the same results.
- Evidence: Mutation run: replacing the tenths line with `Math.round(v * 10)` leaves all 14 tests passing.
- Expected fix: Add a negative-tie fallback case: in primeHands, net -2 on the bigBet-2 hand gives v = -6.25 exactly (v*10 = -62.5 is exact in float). Assert -6.3. Math.round would give -6.2.


## Also (orchestrator): fix the MINOR too — pin the fallback switch point with a case whose LCM is just above MAX_SAFE_INTEGER vs just below (exact and float results differ), so a threshold of >120 or >1e6 fails.
