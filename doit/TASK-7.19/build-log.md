# Build log — TASK-7.19

## BUILD
- Added `src/advice/chart-print.ts` (pure formatter), `tools/chart-print/main.ts` and the `chart:print` script.
- Wrote `tests/advice/chart-print.acceptance.test.ts` (SPEC-01) and `tests/advice/six-max-chart.acceptance.test.ts`
  (SPEC-02/03/04/05/07). Against the pre-task chart all five chart tests failed (mutation check); SPEC-01 passed.
- D-3 band edit in `tests/advice/six-max-chart.test.ts` (BTN re-raise `[6, 41]`).
- Revised `six-max.json`: UTG/HJ/CO/BTN/SB re-raise grids (shares 0.887, 0.858, 0.832, 0.844, 0.882; premium-only
  raises), BB blind-defence offsuit inversions fixed (K9o/K8o/Q8o/J8o firm calls, K7o borderline call, 87o and
  76o folded), BTN unopened 98o `F`, SB unopened K9o `R` and 98o `F`; rewrote 23 spot texts plus the chart text.
  UTG unopened, CO unopened and UTG raise-and-calls are unchanged.
- First full `npm test` run: 1 failure in locked `tests/table/review.acceptance.test.ts` (CO A9o after cold-call
  + re-raise expects Fold). Folded A9o (and A8o, to keep SPEC-05) in CO re-raise; CO share 0.832 stays in range.
- Commands: `npm run typecheck` (exit 0), `npm run lint` (exit 0), `npm run playtest -- --hands 10000 --seed 42`
  (Invariant violations: 0), `npm test` (75 files passed; 276 passed, 2 skipped; no coverage error).
- Saved `chart-print.txt` (full `npm run chart:print` output) and `chart-changes.md` for the user's sign-off.
