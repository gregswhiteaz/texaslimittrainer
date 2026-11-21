---
id: doc-64
title: 'TASK-1.17: Prove the engine with a 1,000,000-hand invariant run'
type: other
created_date: '2026-11-21T10:06:00Z'
updated_date: '2026-11-21T14:48:00Z'
---
# TASK-1.17: Prove the engine with a 1,000,000-hand invariant run

Status: Done · Completed: 2026-11-21 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-1 · Requirements: REQ-056, REQ-062 · Branch: doit/TASK-1.17

## What was asked
Add an on-demand 1,000,000-hand cash-game run over table sizes 2-10 with zero invariant violations (AC#1), sharded with fixed seeds and runnable by nightly schedule or manual dispatch (AC#2), reproducible by replay code (AC#3), with a 100,000-hand throughput bound of 60 minutes (AC#4) using the default invariant checker (AC#5). Spec: doit/TASK-1.17/spec.md.

## Cost-driven decisions — please review first
| ID | Decision | Why / cost | To reverse |
|---|---|---|---|
| D-1 | One Actions job running 9 parallel shard processes, not a 9-job matrix | ~2-3 billed min per run vs ~10-20 for a matrix plus combine job | Convert to a matrix |
| D-2 | `million.yml` is `workflow_dispatch` only, no nightly | Deterministic code re-run nightly proves nothing new; nightly would be ~60-90 min/month. Dispatch is 0 min/month unless used (a few runs/month is under 1% of the 2,000 free minutes) | Add a `schedule:` trigger |
| D-4 | The live dispatch run happens after merge (GitHub only dispatches workflows on the default branch). The orchestrator will try `gh workflow run million.yml --ref main`; if not permitted it becomes a tracker task | Avoids a temporary push trigger | n/a |

Other decisions: D-3 combine by reading each shard's existing text report (no new `--json` option on `npm run playtest`); D-5 each shard runs the same `tools/playtest/main.ts` entry with only `--hands --seed --size`, so the default checker is guaranteed and each shard header is a re-runnable command.

## Assumptions made without asking — please review
Autopilot run; one question asked (Q-1, A-9, answered by the user: opt-in).

| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Shard seed = 1,000,000 + table size (1000002..1000010) | yes | Fixed, distinct, far from CI seed 42 | Change base seed |
| A-2 | 1,000,000 mod 9 leftover goes one each to the smallest sizes (size 2 gets 111,112; sizes 3-10 get 111,111) | yes | Hands sum exactly | Leftover to size 10 |
| A-3 | Concurrency = `os.availableParallelism()` (min 1); 2 on a hosted runner | yes | Uses every core | Fixed 9 or a `--jobs` flag |
| A-4 | Shard output is buffered and printed in shard order after all finish | yes | Byte-identical re-runs | Stream |
| A-5 | Workflow skips `npm ci` and cache | yes | Playtest imports only `node:` builtins and `src/`; saves ~20-30 s | `npm ci` like ci.yml |
| A-6 | Job `timeout-minutes: 30` | yes | ~10x expected run, a hang fails fast | 60 or 360 |
| A-7 | A crashed, killed or mismatched shard fails the run (exit 1), same as a violation | yes | Workflow must fail either way | Distinct exit code |
| A-8 | `--hands` range 9..1,000,000,000, default 1,000,000 | yes | At least one hand per size; same max as `npm run playtest` | n/a |
| A-9 | REVERSED by the user (qa.md Q-1, 2026-11-21): the 100,000-hand throughput test (AC#4) is opt-in, run with `npm run test:slow` (TLH_SLOW_TESTS=1) and skipped by `npm test`; 5.2-5.4 s, 0 violations | yes | User decision; keeps `npm test` fast | Run in every `npm test` |

## What was built
- `src/playtest/shards.ts` (new): shard plan, shard argv, report parsing/validation, per-invariant combining, report text, bounded-concurrency runner, `parseMillionArgs`, `millionMain`. Pure apart from the injected runner.
- `tools/playtest/million.ts` (new): process entry; spawns one `tools/playtest/main.ts` child per shard with fixed argv, no shell.
- `package.json`: `playtest:million` script.
- `.github/workflows/million.yml` (new): dispatch-only, one job, 30-min timeout, `contents: read`, same pinned action SHAs as ci.yml.
- `README.md`: command row, "Million-hand playtest" section (dispatch command `gh workflow run million.yml --ref main`, shard plan and seeds, exit codes), 100,000-hand timing under Speed targets.
- Tests: `tests/playtest/million.acceptance.test.ts`, `tests/ci/million-workflow.acceptance.test.ts`, `tests/playtest/throughput.acceptance.test.ts`, `tests/playtest/shards.test.ts`.
- Engine, bots, invariants, `cli.ts` and `runner.ts` unchanged. No new dependencies.

Behaviour: prints each shard's report as written, then a combined report. Exit 0 only if all 9 shards pass; 1 on any violation, crash or mismatched report.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01, 03, 05, 07 | AC#1, #3, #5 | `million.acceptance.test.ts` (spawned tool, violation/replay, determinism, summed counts) | Pass | gates/fix-2.json |
| SPEC-02 | AC#2 | `million-workflow.acceptance.test.ts` | Pass | gates/fix-2.json |
| SPEC-04, 08 | edges | `shards.test.ts` | Pass | gates/fix-2.json |
| SPEC-06 | AC#4 | `throughput.acceptance.test.ts` (opt-in via `npm run test:slow`); local timing below | Pass | build-log.md |
| SPEC-09 | checks | `npm test`, lint, typecheck, 10,000-hand playtest (seed 42, 0 violations) | Pass | gates |
| SPEC-10 | docs | this doc, README sections | Pass | README diff |

- Gate (fix-2): PASS. 134 files, 473 tests passed, 6 skipped; lines coverage 97.54%, `shards.ts` 100% lines; lint and typecheck exit 0. Scope warning: 965 changed lines vs budget 750 (fail above 1500).
- Timing (AC#4, Apple M4 Pro 14 cores, Node 22.18.0): `time npm run playtest -- --hands 100000 --size 6` took real 4.81 s and 4.83 s, 100000 hands, 0 violations (limit 60 min).
- Local `npm run playtest:million` (no options): exit 0, real 7.88 s, user 47.34 s, empty stderr, no leftover child processes. Combined report (each shard's own report also printed, all with 0 violations):

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
- Actions-minutes estimate: hosted 2-vCPU runner, ~1-2 min shards + ~20-30 s setup = ~2-3 billed min per dispatch. Live dispatch not yet run (D-4).
- Judge: round 3 PASS 10/10 (CI run 44914932294 green on bec0c2f). The WebKit logo flake is tracked as TASK-3.25. See doit/TASK-1.17/judge/.

N/A DoD items: DoD#4 no golden-spot suite yet; DoD#8 no screen; DoD#9 headless tooling, no network requests from the app; DoD#10 no strategy content; DoD#13 no screen and no service worker.

## Review
Round 1: 0 blocking findings (code and security). Security: clean; only untrusted input is the argv, validated and never echoed; no shell; workflow has no inputs or secrets.

### Non-blocking review notes (deliberately not fixed)
- MINOR: throughput test timeout (60/61 min) exceeds ci.yml's 20-min job timeout, so a hang kills the job instead of failing the test.
- NIT: `--help` given twice error message is not in the spec.
- NIT: redundant `max(1)` in `tools/playtest/million.ts`.
- NIT (security): `actions/checkout` keeps default `persist-credentials: true` (matches ci.yml; no reachable path).

## How to try it
- `npm run test:slow` runs the 100k throughput test.
- `npm run playtest:million` (about 8 s on 14 cores); `npm run playtest:million -- --hands 90000` for a smaller run.
- Re-run one shard: copy the command from its header, e.g. `npm run playtest -- --hands 111111 --seed 1000006 --size 6`.
- After merge: `gh workflow run million.yml --ref main`.

## Run metrics
Questions 1 · assumptions 9 · review rounds 1 · judge rounds 3 · gate runs 2 · escalations 0 · changed lines 965 (9 files).

## Known limitations and follow-ups
- [trainer] Run the live `million.yml` dispatch on main after merge and record the result on TASK-1.17 (D-4); orchestrator tries `gh workflow run million.yml --ref main`, else makes a tracker task.
- Sit-and-go shards (TASK-5.10) and bot line-up shards (TASK-6.9) are out of scope and owned by those tasks.

### Not tracked (infra, below the value bar)
- Throughput test timeout above ci.yml job timeout (MINOR; not a real failure, test takes seconds).
- `persist-credentials: false` on checkout (NIT).
- The two code NITs above.

## Lessons for the factory (proposals — not applied)
- Build exceeded the 750-line scope budget (965); spec could estimate test lines separately from source lines.
