# Build log — TASK-7.39

## BUILD (2026-11-27)
- `src/advice/postflop.ts`: D-1 reuse (per-call Map keyed by whole-range attempt; equal-length calling attempt uses
  the same key; kept result returned / kept RangeError rethrown) and D-2 (`equityWithBudget(…, CALLING_RANGE_BUDGET)`
  for ≥ 7 ranges when not reused). Both only when `options.equity` is undefined.
- Tests: `tests/advice/calling-run-identity.acceptance.test.ts` (SPEC-02, 1 test),
  `tests/advice/postflop-calling-run.test.ts` (SPEC-03/04/05, 3 tests), headroom test updated (SPEC-01/06).
- README + postflop-rules.md updated. `npm run format`, `npm run lint`, `npm run typecheck`: clean.
- Headroom (`ADVICE_PERF_SCALE=1 … -t headroom`, CI unset), 3 passes: 9-seat 65.81 / 65.99 / 66.33 ms (≤ 75),
  HU 9.66 / 9.34 / 9.40 ms, actions spot 9.93 / 10.00 / 10.00 ms (≤ 18.75). Base: actions 21.25–21.77, 9-seat
  131.04–131.53 ms.
- SPEC-08: playtest SHA d4d84efb… identical; only `src/advice/postflop.ts` differs under src/; locked seeded tests:
  14 files / 342 passed, 3 skipped; slow games + maniac: 2 files / 11 passed.
- SPEC-07 SHAs: all 8 playtest variants identical base vs branch.
- Advice delta (seed 7390, base worktree vs branch): < 7 bucket 0 differences at sizes 9 and 10; ≥ 7 bucket 168/300
  (size 9) and 146/300 (size 10) differ, max |Δ calling| 0.9 / 1.1 pts, 0 action and 0 ruleId flips.
- SPEC-09: perf file 4 skipped without opt-in; no timing calls in the new tests.
- `npm test`: 354 files passed, 11 skipped; 1567 tests passed, 60 skipped. `npm run test:slow`: 27 files, 114 passed.
- Blocker for SPEC-07 files: the builder pre-tool hook rejects writes to `doit/TASK-7.39/advice-delta.ts` and
  `doit/TASK-7.39/signoff.md` (only changes.md, build-log.md, blocked.json allowed). Not bypassed. Both were written
  to the session scratchpad for the orchestrator to copy in (paths in the final report).
- Base worktree (scratchpad `wt-7-39-base`, detached at ff79ebdd) removed after measurement.
- Gate build #1: PASS (341 lines, 6 files; scope-lines warn vs 210, mostly the two new test files, 245 lines with prettier's line-per-step layout).
