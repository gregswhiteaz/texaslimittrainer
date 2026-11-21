# Fix brief — TASK-1.46 (judge round 1)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. SPEC-04 failed
- Expected: Without the mutation, EVALUATOR_MIN_EVALS_PER_SEC=10000000 EVALUATOR_MAX_BUILD_MS=50 npx vitest run tests/engine/hand-evaluator.perf.test.ts passes both idle and under the SPEC-03 load (also stated by the new README sentence: full-speed commands are not failed by a busy machine)
- Actual: It passes idle but fails every run under the SPEC-03 load: the table-build CPU time inflates from about 32 ms to 50-55 ms (about 1.6-1.7x), which exceeds the 50 ms real target
- Observed via: run command (the README real-target command) with CI unset, with and without 42 busy node processes

## 2. [HIGH] J-1-01
- Problem: Expected: the unmutated evaluator real-target command (EVALUATOR_MIN_EVALS_PER_SEC=10000000 EVALUATOR_MAX_BUILD_MS=50) passes under 3x core-count busy load, as SPEC-04 and the new README sentence ('including the full-speed commands ... a busy machine does not fail them') state. Actual: it failed 6 of 6 runs under that load on the table-build check (50.4-55.3 ms CPU vs 50 ms; about 32 ms idle). Throughput was also near its floor (10.06M vs 10M in one run).
- Expected fix: Under 3x core-count load, the full-speed evaluator command must pass without changing any limit or env default. For example, make the table-build and throughput measurements robust to load-induced CPU inflation, such as the best of several timed repetitions. If the orchestrator or user decides that is out of scope, the spec and the README sentence must stop claiming that the full-speed commands are immune to a busy machine.


Orchestrator decision for J-1-01: fix it in code, not by weakening the claim — make the hand-evaluator perf measurements robust to load by taking the best (minimum CPU time / maximum throughput) of a few timed runs (e.g. 3) for both table build and throughput, keeping every limit, env name and log line unchanged. The SPEC-04 mutation (evaluate doing its work twice) must still fail the real-target command when idle.
