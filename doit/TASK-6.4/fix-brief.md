# Fix brief — TASK-6.4 (judge round 1)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. SPEC-11 failed
- Expected: CI green on doit/TASK-6.4 (DoD)
- Actual: CI workflow cancelled by the 20-minute job timeout; no green CI run for 7bbf6ab
- Observed via: gh run view 44970396930 / gh run list --branch doit/TASK-6.4

## 2. [HIGH] J-1-02
- Problem: Expected a green CI workflow run on doit/TASK-6.4. Actual: run 44970396930 was cancelled at the 20-minute job limit during E2E after the unit Test step took 15m44s (942.6 s; previous task 466.6 s). Every test that ran passed; the cause looks mostly like a slow runner, but the job is now close enough to the limit that the new tests (about 2 minutes on a slow runner) helped push it over.
- Expected fix: Get a green CI run for the branch head (a rerun is the first step). If it times out again, reduce the new tests' CI cost (e.g. fewer seated hands or points, or reuse the collected views across the two Maniac test files) so the job fits within 20 minutes.


## Orchestrator additions (judge round 1)
- **J-1-02 cause to address:** CI timed out (20-min job limit). On the CI runner the new Maniac tests cost ~119 s
  (seated 200-hand run 51 s, check-point test 32 s, draw-count test 27 s). Bring their every-push cost down to a few
  seconds on CI: keep each acceptance assertion but run them on fewer points/hands where the AC allows (AC#2/#3/#4 say
  10,000 seeded decision points — keep 10,000 points but make them cheap: reuse a precomputed view set and the memoized
  `computeEquity` from A-6 across Maniac and TAG so no equity is recomputed), and move the 200-hand seated-Maniac run
  (SPEC-08's extra evidence, not an AC) into the opt-in slow group (`TLH_SLOW_TESTS=1`), keeping a ≤40-hand seated
  smoke run every push. Measure and record each test's local time before/after in build-log.md.
- **J-1-01 (LOW):** add a test that fails if the Maniac never deviates when checked to on the river (the surviving
  mutant) — e.g. include river check points in the postflop check→bet assertions. Prove it kills that mutant.
Do not loosen any locked assertion; if a locked TASK-6.4 acceptance test must change to get cheaper, keep every
assertion identical and only change how its inputs are prepared (unlock TASK-6.4's own file with a reason first —
the orchestrator will do that if you write blocked.json naming the file).
