---
id: doc-151
title: 'TASK-7.18: Restore equity calculation performance headroom'
type: other
created_date: '2026-11-26T01:40:00Z'
updated_date: '2026-11-26T01:40:00Z'
---
# TASK-7.18: Restore equity calculation performance headroom

Status: Done · Completed: 2026-11-25 · Epic: TASK-7 — Get trustworthy advice · Milestone: m-1 · Requirements: n/a (follow-up of TASK-7.1, TASK-7.3, TASK-7.8) · Branch: doit/TASK-7.18

## What was asked
The sampled equity engine ran the full-ring scenario at about 90% of its p95 target. After TASK-7.8 added a second (calling-range) equity run, 9-opponent postflop advice took about 202 ms against a 100 ms target. The global 30 s `testTimeout` also loosened every test. ACs: (1) equity p95 <= 75% of target, (2) no global 30 s timeout, (3) 9-opponent advice facing a bet <= 75 ms, (4) 9-opponent value-bet advice <= 100 ms. Spec: doit/TASK-7.18/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | "Reference Mac" = this machine (M4 Pro, Node 22.18, `CI` unset). Baselines measured here 2026-11-25. | yes | README names this setup | Re-measure elsewhere |
| A-2 | AC#1 is checked by running the existing test at `EQUITY_PERF_SCALE=0.75`, 3 passes in a row. | yes | Uses the test's own knob | Add a separate 75% assertion |
| A-3 | AC#3's 75 ms applies to the existing "10-seat flop vs 9 opponents" scenario (it faces a bet and makes both equity runs). The task text's "71.5 ms" predates TASK-7.8; measured baseline was about 202-208 ms. | yes | Same spot and target | New scenario |
| A-4 | AC#4's value-bet spot is a new scenario: 10 seats, limped pot, flop checked to the SB (nothing owed, `bet` legal). Target 100 ms. It runs only with `TLH_SLOW_TESTS=1`, and `postflop.perf.test.ts` is added to `npm run test:slow`. | yes | Speed checks are opt-in | Reuse AC#3's scenario only |
| A-5 | "Tests that need longer" = tests with no timeout of their own that take over 1,000 ms under `npm test` (coverage) on the reference Mac. | yes | Q-3 threshold | 2,000 ms (26 files) |
| A-6 | The inline generator is seeded and drawn exactly like `Xoshiro128` (splitMix32 of `deriveSeed`, `floor(u32*n/2^32)`), so results are byte-identical. | yes | Same stream required | Add a state accessor to `Xoshiro128` |

## Clarifications and decisions
All three questions were auto-accepted (autopilot, recommended option).
- Q-1 early abort: auto-accepted. The sampler throws the existing `RangeError('Sampling rejected too many deals')` once a statistical projection says the 3M-rejection cap cannot be met. Corrected in review, see below.
- Q-2 15 untimed warm-ups per scenario: auto-accepted. `process.cpuUsage` counts V8's background compiler threads, so run 8 measured 19.0 ms CPU but 7.9 ms wall. With 1 warm-up the HU flop scenario stayed at 75-110% of target.
- Q-3 per-file 30 s timeouts: auto-accepted via a one-line `vi.setConfig({ testTimeout: 30_000 })` per file. The orchestrator chose a **1,000 ms threshold, not the recommended 2,000 ms**, because CI runners are slower (TASK-1.56). That gives 43 files (spec said 42; judge J-1-01 added `equity-reference.test.ts`, about 4 s in full `npm test`). 30 of them were locked; each is unlocked for a timeout-only edit.
- D-1 loop speed-up with an unchanged random stream. D-2 early abort. D-3 15 warm-ups. D-4 remove global timeout.
- **Recorded deviation from spec §5 (orchestrator-approved, review r1 MAJOR).** The spec rule compared `r + expected remaining rejections` with the cap and ignored the spread of the remaining count. A simulation showed false aborts of feasible runs when acceptance is near 1/101 (for example 15 in 2,024 successes at T=500, p=0.0099). Round 2 subtracts `z * sqrt(rem*(1-pHi)) / pHi` (z SDs of the remaining negative-binomial count) from the projection. One worked example changes: T=500, M=50,000, a=0, r=8,192 is now `false` (spec said `true`). The 9-opponent calling-range spot (a=150, r=32,768) still aborts.

## What was built
- `src/advice/equity.ts` — `sampledEquity` loop: generation stamps instead of a reset loop, opponent picks copied to `hands` only when a deal is accepted, xoshiro128** state in locals with both draw sites inlined (a shared closure cost about 10 ms). New `@internal` exports `SAMPLER_CHECK_EVERY = 8192`, `SAMPLER_ABORT_Z = 8` and `rejectionsOverBudget(accepted, rejections, trials, maxRejections)`. The abort check runs every 8,192 rejections. Signature, errors and successful results are unchanged.
- `tests/advice/equity.test.ts` — SPEC-05 byte-identical SHA-256 pin and SPEC-06 early-abort test, with a seeded `Xoshiro128(91)` regression run (p=0.0099, T=500, M=50,000) that the old rule aborted.
- `tests/advice/equity.perf.test.ts`, `tests/advice/postflop.perf.test.ts` — `WARMUP_RUNS = 15`; new SLOW-gated value-bet scenario; `owed` flag on `slowScenarios`.
- `vite.config.ts` — global `testTimeout` removed (default 5,000 ms). `package.json` — `test:slow` includes the advice perf file. `README.md` — Speed targets gain the advice command and the 0.75 headroom commands.
- 43 test files — one `vi.setConfig({ testTimeout: 30_000 });` line each (plus `vi` import where missing).

### Before / after, CPU-time p95 ms (3 passes each, from build-log.md)
| Scenario | Target | Before p1 / p2 / p3 | After p1 / p2 / p3 |
|---|---|---|---|
| HU preflop hand vs hand | 15 | 5.21 / 5.46 / 5.45 | 5.25 / 5.27 / 5.25 |
| HU flop hand vs hand | 2 | 0.62 / 0.25 / 0.65 | 0.14 / 0.14 / 0.14 |
| HU flop vs every unseen combo | 20 | 12.56 / 15.94 / 12.41 | 4.78 / 4.77 / 4.60 |
| HU turn vs every unseen combo | 15 | 6.62 / 6.49 / 6.48 | 6.47 / 6.05 / 6.16 |
| Three-way preflop AA vs KK vs QQ | 20 | 8.18 / 8.31 / 8.14 | 7.58 / 7.74 / 7.53 |
| 6-max preflop vs 5 ranges | 50 | 17.49 / 17.55 / 17.55 | 16.03 / 16.19 / 16.02 |
| Full ring flop vs 9 ranges | 80 | 73.36 / 73.34 / 73.16 | 51.95 / 52.22 / 52.32 |
| Advice: HU flop facing a bet | 25 | 23.10 / 23.81 / 24.54 | 21.37 / 13.30 / 13.63 |
| Advice: 6-max flop vs 3 opponents | 50 | 21.59 / 20.96 / 20.88 | 19.39 / 19.04 / 19.78 |
| Advice: 10-seat flop vs 9 opponents (AC#3) | 100 | 206.88 / 208.40 / 206.96 (FAIL) | 53.26 / 53.54 / 53.97 |
| Advice: 10-seat flop checked to SB vs 9 (AC#4, new) | 100 | n/a | 53.15 / 53.52 / 53.12 |
| Advice actions: 6-max facing a bet, one opponent | 25 | 22.06 / 22.42 / 22.32 | 19.69 / 19.56 / 20.18 |
| Advice actions: 6-max flop vs 3 opponents | 50 | 25.78 / 25.90 / 26.28 | 23.07 / 23.49 / 23.19 |

## How it was verified
| SPEC | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | `EQUITY_PERF_SCALE=0.75` equity perf, 3 runs | PASS | Full ring 51.1-51.9 ms (limit 60); HU flop vs every combo 4.5-4.6 ms (limit 15) |
| SPEC-02 | AC#2 | no `testTimeout` in vite.config; `npm test` | PASS | 1422 passed, 0 failed; judge confirmed the timeout-only diffs |
| SPEC-03 | AC#3 | `ADVICE_PERF_SCALE=1` advice perf x3 | PASS | 53.11 / 52.90 / 53.14 ms (limit 75) |
| SPEC-04 | AC#4 | `TLH_SLOW_TESTS=1` value-bet scenario | PASS | 52.29 ms (limit 100); skipped without the env var |
| SPEC-05 | AC#1,3,4 | pinned SHA-256 test; judge holdout | PASS | 521 holdout inputs byte-identical vs base 6622918 (374 successes, 143 identical errors) |
| SPEC-06 | AC#3,4 | unit test; judge simulation | PASS | 0 false aborts in about 23k simulated runs near the cap; infeasible runs still abort early |
| SPEC-07 | AC#3,4 | playtest hash; golden/value-bet/determinism/equity acceptance | PASS | playtest SHA equal to base (`acd5b173…`); 301 tests pass, no assertion edits |

- Suite: `npm test` 315 files passed | 5 skipped; 1422 tests passed | 47 skipped. Lint and typecheck clean. `npm run test:slow` (21 files) 99 passed.
- Gates: 5 gate runs, no failures.
- Judge round 1: PASS 7/7 (doit/TASK-7.18/judge/round-1.json). One MEDIUM, J-1-01: `equity-reference.test.ts` took about 4 s with no timeout of its own. The orchestrator fixed it with the same one-line timeout.

## Review
- Round 1 code review: 1 MAJOR, `early-abort-ignores-remaining-variance`. Resolved in round 2 by the recorded deviation above. The round-2 reviewer replayed the old rule against the new one: 0 false aborts, versus 1-17 per configuration under the old rule.
- Round 1 security review: no findings. Round 2 code and security: no findings.

### Non-blocking review notes (deliberately not fixed)
- Round 1 MINOR `inlined-xoshiro-duplicated`: the xoshiro step is copied at two sites. It was kept for speed and addressed in round 2 with a "keep both identical to Xoshiro128.nextUint32" comment and a corrected stale comment. No NIT findings.

## How to try it
```
for i in 1 2 3; do EQUITY_PERF_SCALE=0.75 npx vitest run tests/advice/equity.perf.test.ts || exit 1; done
ADVICE_PERF_SCALE=1 npx vitest run tests/advice/postflop.perf.test.ts
TLH_SLOW_TESTS=1 ADVICE_PERF_SCALE=1 npx vitest run tests/advice/postflop.perf.test.ts
npm test
```

## Run metrics
Questions 3 (all auto-accepted) · assumptions 6 · review rounds 2 · judge rounds 1 (PASS) · gate runs 5 · escalations 0 · sendbacks 0 · changed lines in src/tests/config/README: +330 / -63 across 49 files.

## Known limitations and follow-ups
- Scope: lines came to 389 against the 380 budget.
- SC-1 `[trainer]`: both perf files (`tests/advice/equity.perf.test.ts`, `tests/advice/postflop.perf.test.ts`) still run in every `npm test` at 20x slack, against the rule that speed checks are opt-in. Candidate follow-up: gate them behind `TLH_SLOW_TESTS` or move them into `test:slow` only. Owner: no existing task known.
- SC-2 `[trainer]`: HU advice facing a bet is at 90% of its 25 ms target in the baseline (21-24 ms; 13-21 ms after) and the 8-opponent calling-range run still takes about 97 ms. Both are outside the ACs. Candidate follow-up: a headroom AC for them if wanted.

## Lessons for the factory (proposals — not applied)
- Spec §5 stated a safety bound (false-abort below 1e-14) without a simulation. Review found it false. Proposal: when a spec rule claims a probability bound, require the spec writer to include a quick simulation near the boundary.
- The spec's measured timeout list (42 files) missed one file (`equity-reference.test.ts`, caught only by the judge). Proposal: measure the list once on the final tree, not only at spec time.
