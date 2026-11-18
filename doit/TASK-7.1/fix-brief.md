# Fix brief — TASK-7.1 (judge round 1)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. SPEC-15 failed
- Expected: The latest CI run on doit/TASK-7.1 concludes 'success'.
- Actual: Conclusion 'failure': the AC#2 test exceeds Vitest's default 5 s per-test timeout on the CI runner with coverage (it takes about 4.1 s locally, so it overruns on the slower runner).
- Observed via: gh run list / gh run view --log-failed

## 2. SPEC-16 failed
- Expected: 
- Actual: 
- Observed via: public interface / run command

## 3. [HIGH] J-1-01
- Problem: Expected: CI on doit/TASK-7.1 concludes success. Actual: run 44231570428 (51eddcb) failed because the locked AC#2 test (120 sampled heads-up computeEquity calls, no explicit timeout) exceeded Vitest's default 5000 ms per-test timeout on the CI runner with coverage. Locally it takes about 4.1 s, only about 17% headroom.
- Expected fix: AC#2 must finish well inside the 5 s per-test timeout on the CI runner with coverage, without editing the locked acceptance test. Either make 120 heads-up preflop sampled computeEquity calls substantially faster (for example, remove the per-trial allocations in the sampler's hot loop), or, if the orchestrator approves it as a deviation, raise the per-test timeout in the test configuration. Then push and get a green CI run.

