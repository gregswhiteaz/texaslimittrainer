# Build log: TASK-1.17

## BUILD (builder)

- Implemented `src/playtest/shards.ts`, `tools/playtest/million.ts`, the `playtest:million` script, `.github/workflows/million.yml` (checkout/setup-node pins copied from `ci.yml`), README sections, and the four test files named in spec §10.
- New tests run alone: `tests/playtest/million.acceptance.test.ts` (4), `tests/ci/million-workflow.acceptance.test.ts` (1), `tests/playtest/throughput.acceptance.test.ts` (1), `tests/playtest/shards.test.ts` (2) — 8 passed. One of my own expectations was corrected during development: `Invariant violations` counts violations, not hands, so the SPEC-07 test total is 3 + 3 = 6.
- `npm run format`: done. `npm run lint`: exit 0. `npm run typecheck`: exit 0.
- `npm test`: exit 0. 134 files passed, 473 tests passed, 6 skipped. Coverage: all files 97.54% lines; `src/playtest/shards.ts` 100% lines.
- `npm run playtest -- --hands 10000 --seed 42`: exit 0, `Invariant violations: 0`. Engine, `cli.ts` and `runner.ts` are unchanged.
- Timing (SPEC-06 / DoD#1): `time npm run playtest -- --hands 100000 --size 6` on an Apple M4 Pro (14 cores) with Node 22.18.0: real 4.81 s and 4.83 s, `Hands played: 100000`, `Invariant violations: 0`. Recorded in the task's implementation notes (`backlog task edit TASK-1.17 --append-notes`) and under README Speed targets.
- `npm run playtest:million` (no options): exit 0, real 7.88 s, user 47.34 s, 129 stdout lines, empty stderr. Shard headers and the combined report (each shard's own report, all `Invariant violations: 0`, omitted here):

```
TLH Trainer million-hand playtest
Plan: 1000000 cash hands over table sizes 2 to 10 in 9 shards, one seed per shard
Shard 1 of 9: npm run playtest -- --hands 111112 --seed 1000002 --size 2
Shard 2 of 9: npm run playtest -- --hands 111111 --seed 1000003 --size 3
Shard 3 of 9: npm run playtest -- --hands 111111 --seed 1000004 --size 4
Shard 4 of 9: npm run playtest -- --hands 111111 --seed 1000005 --size 5
Shard 5 of 9: npm run playtest -- --hands 111111 --seed 1000006 --size 6
Shard 6 of 9: npm run playtest -- --hands 111111 --seed 1000007 --size 7
Shard 7 of 9: npm run playtest -- --hands 111111 --seed 1000008 --size 8
Shard 8 of 9: npm run playtest -- --hands 111111 --seed 1000009 --size 9
Shard 9 of 9: npm run playtest -- --hands 111111 --seed 1000010 --size 10
Combined report
Shards passed: 9 of 9
Hands played: 1000000
Invariant violations: 0
Violations by invariant: chips 0, legal-action 0, bet-cap 0, pot-eligibility 0, cards 0
Result: PASS
```

- No shard child processes remain after the run (`pgrep -fl tools/playtest` printed nothing).

## FIX (judge round 1)

- J-1-02: fixed — added `sums the same invariant across shards` in `tests/playtest/shards.test.ts` (chips 2 + chips 3 -> combined 5). Mutation check: replacing the sum in `combineShards` with `Math.max(before ?? 0, count)` failed it (`expected 3 to be 5`); source restored, no diff.
- J-1-01: no code change per brief — `e2e/cards.spec.ts` untouched; orchestrator handles CI.
- `npx vitest run tests/playtest/shards.test.ts`: 3 passed. `npm run format` run.

## FIX (Q-1: make the 100k throughput test opt-in)

1. Fixed: `tests/playtest/throughput.acceptance.test.ts` now uses `describe.runIf(process.env.TLH_SLOW_TESTS === '1')`; assertions and timeouts unchanged. Without the env var: 1 file / 1 test skipped (57 ms).
2. Fixed: `package.json` adds `"test:slow": "TLH_SLOW_TESTS=1 vitest run tests/playtest/throughput.acceptance.test.ts"`.
3. Fixed: README Speed targets playtest bullet says the 60-minute check is opt-in (`npm run test:slow`), a speed guard rather than a real scenario, kept out of `npm test` and every push.
4. Fixed: `npm run test:slow` — 1 file passed, 1 test passed (5209 ms, 100,000 hands, 0 violations). SPEC-06 holds.
`npm run format` run.
