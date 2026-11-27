---
id: doc-194
title: >-
  TASK-1.53: Cut CI wall time to about 3.5 minutes: shard E2E and rebalance the
  sweep shards
type: other
created_date: '2026-11-27T19:15:00Z'
updated_date: '2026-11-27T19:15:00Z'
---
# TASK-1.53: Cut CI wall time to about 3.5 minutes: shard E2E and rebalance the sweep shards

Status: In progress (not Done; AC#3 awaits 2 main runs) · Built: 2026-11-27 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-1 · Requirements: n/a (CI infrastructure) · Branch: doit/TASK-1.53

## What was asked
Main run 46046670509 took 439 s of wall time; the single E2E job (216 tests x 2 browsers, 378 s of tests) was the whole critical path. The story asks for three things.
- AC#1: sweep shards balanced by duration (longest job <= 1.5x the shortest, well under 6 min).
- AC#2: E2E split into parallel shards, every test still run once per browser.
- AC#3: a CI wall time of about 3.5 min (210 s) on main.

Spec: doit/TASK-1.53/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Sweeps use 3 shards, and the split is duration-weighted | yes | A balanced 2-way split would be ~154 s of step time, a 3-way ~103 s. This leaves headroom under the E2E jobs | Set the matrix to 2 shards and `--shard=N/2` |
| A-2 | E2E matrix uses `fail-fast: false` | yes | One failing shard must not cancel the others | Remove the key |
| A-3 | A sweep file missing from the weights file weighs 1.0 s; a weight for a deleted file is ignored | yes | A new sweep file must never be dropped or break CI | Fail on a missing weight |
| A-4 | Weights = each file's summed per-test durations (s, 0.1) from main run 46046670509 logs; total ~848 s | yes | Latest real CI timing | Re-measure and edit `tools/ci/sweep-weights.json` |
| A-5 | E2E artifacts are named `playwright-report-<project>-<shard>`, same path, condition and 7-day retention | yes | upload-artifact v4+ rejects duplicate names in a run | One merged report (needs a merge job) |
| A-6 | Wall time = `updatedAt - startedAt` from `gh run view`; a job's time = `completedAt - startedAt` | yes | Matches the task's quoted numbers and is repeatable | Use `createdAt` (includes queueing) |

state.json logs 0 assumptions; the table above is from the spec's Assumptions section.

## Clarifications and decisions
- Q-1 (how AC#3 is proven): branch runs now, main later. The judge checks 2 pushed-branch runs. AC#3 stays unticked at Done. After merge the orchestrator records 2 main runs (ids, wall time, sweep ratio) in the task notes and ticks AC#3. If main exceeds ~3.5 min it opens a fix story.
- Q-2 (design and locked-test edits): approved as designed. E2E is a chromium/webkit x 2 shard matrix, sweeps are 3 weighted shards, and the three locked CI tests are re-pinned.
- Q-3 (check names): "E2E (chromium, shard 1 of 2)" … "E2E (webkit, shard 2 of 2)" and "Sweep tests (shard 1 of 3)" … "(shard 3 of 3)".
- D-3 and D-4: each E2E job still builds and previews on its own, and still installs both browsers. The cache key is shared across jobs.
- D-5: the locked CI tests are edited only to pin the new shape; no assertion is removed.
- Branch protection is not enabled (404 on the API), so renaming the jobs breaks no required check.

## What was built
- `.github/workflows/ci.yml`: `e2e` is a `fail-fast: false` matrix `project: [chromium, webkit]` x `shard: [1, 2]`. It runs `npm run e2e -- --project=… --shard=…/2` and uploads `playwright-report-<project>-<shard>` on failure. `sweeps` is `shard: [1, 2, 3]` with `--shard=N/3`.
- `tools/ci/sweep-shards.ts` (new): `assignShards` is a weighted longest-processing-time-first greedy. It is deterministic, total, and treats invalid weights (-1, NaN, string) as the 1 s default. `WeightedSequencer` is a Vitest sequencer that overrides only `shard` and keeps Vitest's default `sort`.
- `tools/ci/sweep-weights.json` (new): 222 per-file weights.
- `vite.config.ts`: `test.sequence.sequencer: WeightedSequencer`, imported as `./tools/ci/sweep-shards.js`.
- Tests: new `tests/ci/ci-shards.acceptance.test.ts` and `tests/ci/sweep-shards.test.ts`. Locked re-pins in `tests/ci/ci-jobs.acceptance.test.ts`, `workflow.test.ts` and `branch-protection.acceptance.test.ts`.
- `README.md`: CI jobs table, artifact sentence, ten branch-protection contexts, and a note on refreshing the weights.
- Recorded deviation: `tests/support/sandbox.ts` (+2 lines) was not in the spec's file list. The sandbox copies `vite.config.ts`, which now imports the sequencer. Without the two new files in `CONFIG_FILES`, every sandboxed toolchain test failed with "Could not resolve './tools/ci/sweep-shards.js'".

No new dependencies. No change to `playwright.config.ts`.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..03 | AC#1 | `ci-shards.acceptance.test.ts`: sweeps command and name, every sweep file once, weighted loads <= 1.5x | PASS | gates/fix-8.json |
| SPEC-04, 05 | AC#1 | `sweep-shards.test.ts`: sequencer wiring, determinism, invalid weights, default weights file | PASS | review r2 |
| SPEC-06..08 | AC#2 | E2E matrix, each browser runs every test once, per-shard report names | PASS | `ci-shards.acceptance.test.ts` |
| SPEC-09, 10 | AC#1, 2 | Locked tests and README match; no assertion removed | PASS | test integrity gate |
| SPEC-11 | AC#1, 3 | 2 branch CI runs (manual) | PASS on branch; main pending | below |

Gates: 8 runs, last (fix-8) PASS. Two warnings: 662 changed lines vs budget 650, and 11 files vs budget 10 (the sandbox.ts deviation).

Branch CI runs (A-6 definition):
| Run | Wall | Sweep steps | Note |
|---|---|---|---|
| 46052341998 | 187 s | 95 / 91 / 92 s | Within the 210 s target |
| 46053833069 | 204 s | 154 / 156 / 81 s (raw ratio 1.82x) | Slower runners; the unit job was also 1.87x slower |

Before: main run 46046670509 took 439 s. Both branch runs are under 210 s. The 1.5x ratio holds in run 1 and fails raw in run 2. The judge and orchestrator attributed run 2 to runner slowness.

Judge: PASS in round 1 (test suite PASS, end-to-end PASS, no unproven AC).

## Review
- Round 1, MAJOR: the invalid-weight test in `sweep-shards.test.ts` could not fail. The bad value sat on the lightest file, so using it as-is gave the same result as replacing it with 1. Fixed with a `{x: bad, y: 1}` fixture. Round 2 confirmed by mutation that the "no >= 0 check" and "use the raw value" mutants are caught.
- Round 1, MINOR: the production default weights were untested. Fixed with a test that `new WeightedSequencer(ctx)` matches `assignShards` over the committed weights.
- Round 2: no blocking findings. Security review: no findings.

### Non-blocking review notes (deliberately not fixed)
- MINOR: `tests/ci/ci-shards.acceptance.test.ts:102` uses a literal `?? 1` instead of `DEFAULT_WEIGHT_SECONDS`. The file is locked.
- NIT: `tests/ci/sweep-shards.test.ts:52`. The sequencer shard test passes specs in path order, so it can't tell "keeps input order" from "sorted by path".
- Two surviving mutants (`drop Number.isFinite`, `drop typeof`) are equivalent for the spec's values; only Infinity would separate them.
- Judge J-1-01: record the step times and per-test totals at the main measurement.
- Judge J-1-02: the webkit shard 2 job is the critical path (184–200 s).

## How to try it
- `npx vitest run tests/ci` runs the CI tests.
- `npm run test:sweeps -- --shard=1/3 --list` shows a shard's files.
- `gh run view <id> --json startedAt,updatedAt` gives the wall time of a run.

## Run metrics
Questions 3 · assumptions logged 6 (spec) · review rounds 2 · judge rounds 1 · gate runs 8 · escalations 0 · changed lines 662 across 11 files (gate count, excluding doit/ files).

## Known limitations and follow-ups
- AC#3 is open until 2 main runs are recorded. After merge, the orchestrator records ids, wall time, sweep ratio, step times and per-test totals (J-1-01) in the task notes, ticks AC#3, and opens a fix story if main exceeds ~3.5 min. This is already the Q-1 plan, so it is not a new item.
- Weight drift: a new heavy sweep file defaults to 1 s, so the shards can drift apart. The README explains how to refresh the weights by hand. [trainer-adjacent, CI] A script that rebuilds the weights from a CI log would be a follow-up, but nothing has failed, so it is below the bar for now.
- Headroom: the webkit shard 2 job is the critical path (184–200 s) against a 210 s target. Run 2 was 204 s. If main misses the target, the levers are 3 shards per browser or `--workers` in CI.

Not tracked (infra, below the value bar): the weights-refresh script, the `?? 1` literal and the input-order NIT. None has caused or would plausibly cause a real failure today.

## Lessons for the factory (proposals — not applied)
- The spec's file list missed `tests/support/sandbox.ts`, which copies config files the sandbox needs. A spec check could list the files that mirror `vite.config.ts` imports.
- Wall-time targets near measured values (204 s vs 210 s) are sensitive to runner speed. A spec for timing ACs could state a tolerance or a median of N runs.
