# TASK-1.46 build log

## BUILD
- Added `cpuNowMs()` to `tests/support/speed.ts`. Replaced `performance.now()` with it in the four perf files, the equity "bounds the work…" test and the preflop 10,000-call timing. Added CPU-time header lines and comments, plus a README sentence.
- New `tests/support/cpu-clock.acceptance.test.ts` (SPEC-01, SPEC-02): 2/2 pass. Each N = 20M sqrt-sum run is about 13 ms of CPU time idle.
- Spec run command (7 files): 13/13 pass.
- SPEC-03 grep: the first grep prints nothing and the second prints 0.
- SPEC-03 load (42 busy `node` loops = 3 x 14 cores): `vitest run --coverage` on the six files gave 11/11 tests passed, evaluator 2,359,754 evals/s. Exit code was 1, but only because global coverage thresholds fail when a subset of files runs (lines 59.84% < 70%, and the src/{engine,bots,advice,stats} lines threshold 83.85% < 90%). The same command idle also exits 1 for the same reason. No test failed. For the judge: the spec's `exit=0` expectation for this command cannot hold with `--coverage` on a file subset. Read the test counts instead, or add `--coverage.thresholds.lines=0` / drop the thresholds for that run.
- `npm run format`: clean. `npm run lint`: exit 0. `npm run typecheck`: exit 0.
- `npm test`: exit 0. 101 files, 362 passed, 6 skipped.

## FIX (judge round 1)
- SPEC-04 / J-1-01: fixed. `tests/engine/hand-evaluator.perf.test.ts` now times throughput and table build over RUNS = 10 repetitions and keeps the best (minimum CPU time). The checksum is checked on every run. Limits, env names and the log line are unchanged. Best of 3 was not enough: under 42 busy node processes it failed 1 of 6 runs (build 51.4 ms). With best of 10, 8 of 8 runs passed under 42 busy processes: build 30.5-38.5 ms, throughput 12.4M-14.4M evals/s, about 5.7 s per run. Idle: about 15.9M evals/s and 23.5 ms build.
- Mutation check (idle): with evaluate temporarily doing its work twice, the real-target command failed 2 of 2 runs (8.8M-9.0M < 10M evals/s). The source was restored and `git diff src/` is empty.
- `npm test`: 101 files, 362 passed, 6 skipped. format, lint and typecheck: exit 0.
