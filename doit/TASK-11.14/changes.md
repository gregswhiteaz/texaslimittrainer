# TASK-11.14 changes

- `src/stats/trends.ts`: `TrendSource` is now `CashTrendSource | OtherTrendSource` (cast-free `trendHand`); iterative `gcd`; `bb100Value` keeps the exact LCM path while the LCM is a safe integer and falls back to the float per-hand sum (half away from zero, never -0) above it.
- `tests/stats/bb100-tampered.acceptance.test.tsx` (new): SPEC-01, 500 cash hands with prime big bets in fake-indexeddb render one finite BB/100 point.
- `tests/stats/trends.test.ts`: SPEC-02..SPEC-05 unit cases (exact vs fallback values, tampered groupings, `@ts-expect-error` type cases, all-negative geometry).
- `docs/stats/trends.md`: group-value rule now states the safe-LCM fallback.

No new dependencies.
