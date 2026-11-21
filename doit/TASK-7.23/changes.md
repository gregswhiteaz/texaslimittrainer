# Changes — TASK-7.23

- `src/advice/grade.ts` — private `finitePct` guard; the call-fold rule (`equityPct`, `requiredEquityPct`) and the aggression-margin rule (`equityVsCallingRangePct`, after the undefined/null early return) now throw `RangeError` "<field> must be a finite number, got <value>" for NaN/±Infinity/missing; doc comment updated (SPEC-01..03).
- `tests/advice/grade-hardening.acceptance.test.ts` — new acceptance tests: non-finite call-fold equity throws, non-finite calling-range equity throws (undefined/null still `aggression-no-range`), unused non-finite numbers do not throw, -15 wrong-way margin is Minor (SPEC-01..04).
- `tests/advice/grade.test.ts` — renamed the float-subtraction test to `exactly 10 points is Major whether float subtraction is exact (26.7-16.7) or falls short (16.4-6.4)` and added `expect(26.7 - 16.7).toBe(10)`; nothing removed (SPEC-05).

No new dependencies.
