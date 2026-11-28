# TASK-7.39: Restore advice speed headroom on the 6-max actions spot and the 9-seat calling-range spot

Status: Done (pending orchestrator) · Completed: 2026-11-27 · Epic: TASK-7 — Get trustworthy advice · Milestone: m-1 · Requirements: n/a (follow-up of TASK-7.34, doc-167) · Branch: doit/TASK-7.39

## What was asked
Two advice speed spots lacked the 25% headroom that the opt-in perf test wants.
- AC#1: the "actions: 6-max flop facing a bet, one opponent" spot must reach p95 at most 75% of 25 ms, with advice results unchanged (playtest SHA identical).
- AC#2: the 9-seat vs 8 opponents spot must reach p95 at most 75 ms (75% of 100 ms). Any change to seeded advice or bot results had to be measured and approved by the user before merge.

Spec: doit/TASK-7.39/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | "Runs at real targets" means `ADVICE_PERF_SCALE=1 npx vitest run tests/advice/postflop.perf.test.ts -t headroom`, `CI` unset, on the reference Mac (M4 Pro, Node 22.18.0), 3 passes in a row. | yes | Same method as TASK-7.34 A-4 and TASK-7.18 A-1. | Grep a single run instead |
| A-2 | The actions spot is timed inside the existing headroom test, after the 9-seat and HU scenarios. | yes | One command covers both ACs. A scenario timed first in a fresh worker is bimodal (TASK-7.34). | Separate `-t` test |
| A-3 | "9-seat vs 8 opponents spot" is the existing `NINE_SEAT_FACING_BET` headroom scenario; its target returns to 100 ms (limit 75). | yes | It is the spot TASK-7.34 Q-1 moved to 200 ms. | A new scenario |
| A-4 | "Playtest SHA identical" is proven three ways: (a) default `npm run playtest` SHA equals the base value d4d84efb...2992; (b) the advice-delta sample shows 0 differing recommendations with fewer than 7 live opponents; (c) unit identity check SPEC-02. | yes | The default playtest seats only bots, which inject `BOT_EQUITY` and never reach the changed path, so (a) alone says little about user advice. | (a) only |
| A-5 | Both postflop changes apply only when the caller passes no `equity` option (the default `computeEquity`). | yes | Many locked tests and all bots count or inject the equity seam. | Apply to injected seams too (breaks locked tests) |
| A-6 | The delta sample: every seat plays calling-station, sizes 9 and 10, seed 7390, up to 3,000 hands per size, up to 300 views per bucket (7+ and under 7 opponents), advised with `ACTION_RANGE_ADVICE`. | yes | Calling stations reach 7+-way flops often. Golden spots never do. | Mixed line-up |

state.json records `questions: 0` and `assumptions: 0` although one question (Q-1) was asked and six assumptions are in the spec. The counters were not updated (see Lessons).

## Clarifications and decisions
- Q-1: how should the 9-seat calling-range run reach 75 ms? The user chose A: 10,000 deals for the user's calling-range run when 7 or more opponents are live. Rejected options: 8,000 deals; 10,000 deals for every sampled calling run; an importance-weighted sampler; keeping the 200 ms target.
- Sign-off (AC#2): the user approved the before/after delta package (signoff.md) on 2026-11-28, as shown.
- D-1: within one `recommendPostflop` call with the default equity, a calling-range attempt whose ranges all have the same length as the whole-range attempt's ranges reuses that attempt's outcome (result, or the same `RangeError`). Equal input means equal result, so advice is byte-identical.
- D-2: with the default equity and at least 7 opponents, a calling-range attempt that is not reused runs `equityWithBudget` with `CALLING_RANGE_BUDGET = { exactLimit: EXACT_EVALUATION_LIMIT, trials: 10_000 }`.
- D-3: sign-off by the user before code review.
- D-4: before and after are measured in one process against a `git worktree` at the base commit.
- Finding behind D-1: the AC#1 time was not in `estimateOpponentRanges` (0.23 ms, contrary to the task's guess). It was two identical exact equity runs.

## What was built
- `src/advice/postflop.ts` (the only `src/` file changed).
  - Whole-range outcomes are kept per attempt in a per-call `Map` keyed by array identity. An identical calling-range attempt returns the kept result or rethrows the kept `RangeError`, so the A-7 fallback behaves as before.
  - With at least 7 ranges, a non-reused calling run uses the 10,000-trial budget.
  - New exports: `REDUCED_CALLING_OPPONENTS = 7` and `CALLING_RANGE_BUDGET`.
  - Injected `equity` seams (every bot, every spy test) take the unchanged path.
- `tests/advice/postflop.perf.test.ts`: headroom test now has the 9-seat target at 100 ms (was 200), adds the actions spot (25 ms target, 18.75 limit), and the 8-way check uses the reduced budget.
- `tests/advice/calling-run-identity.acceptance.test.ts` (new, locked): default advice equals two-run advice below 7 opponents.
- `tests/advice/postflop-calling-run.test.ts` (new): reuse, seam untouched, reduced budget at 7+.
- `README.md` (Speed targets) and `docs/advice/postflop-rules.md` (one sentence on 10,000 deals at 7+ opponents).
- Work folder only: `advice-delta.ts` and `signoff.md`. The builder hook blocks writes there, so the orchestrator copied them in.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | Headroom command, 3 passes | PASS | Actions spot p95 9.93 / 10.00 / 10.00 ms (base 21.25-21.77; limit 18.75). Judge re-run: 10.09 / 10.23 / 9.88 |
| SPEC-02 | AC#1 | Acceptance: default equals two-run advice below 7 opponents | PASS | Locked test |
| SPEC-03 | AC#1 | Unit: identical calling run not repeated | PASS | `computeEquity` once, `equityWithBudget` 0 times |
| SPEC-04 | AC#1, AC#2 | Unit: injected seams untouched | PASS | Stub called twice per view |
| SPEC-05 | AC#2 | Unit: 7+ opponents use reduced budget | PASS | Budget with 10,000 trials |
| SPEC-06 | AC#2 | Headroom command, 3 passes | PASS | 9-seat p95 65.81 / 65.99 / 66.33 ms (base 131.04-131.53; limit 75). Judge: 65.85 / 66.11 / 65.95. HU unchanged at about 9.4 ms |
| SPEC-07 | AC#1, AC#2 | Sign-off package, user approval | PASS | signoff.md; user approved |
| SPEC-08 | AC#1, AC#2 | Playtest SHAs and locked seeded tests | PASS | 8 playtest variants byte-identical; only `postflop.ts` differs under `src/`; locked seeded tests 14 files / 342 passed |
| SPEC-09 | AC#1, AC#2 | Perf file skipped without opt-in | PASS | 4 skipped; no timing calls in new tests |

- `npm test`: 354 files passed, 11 skipped; 1567 tests passed, 60 skipped. `npm run test:slow`: 27 files, 114 tests passed.
- Advice delta (seed 7390, user advice, base vs branch):

| Size | Opponents | Views | Differing | Max abs change in calling number (pts) | Mean | Action / rule flips |
|---|---|---|---|---|---|---|
| 9 | under 7 | 300 | 0 | 0.0 | 0.000 | 0 / 0 |
| 9 | 7+ | 300 | 168 | 0.9 | 0.133 | 0 / 0 |
| 10 | under 7 | 300 | 0 | 0.0 | 0.000 | 0 / 0 |
| 10 | 7+ | 300 | 146 | 1.1 | 0.106 | 0 / 0 |

  Only the calling-range number and the explanation text that quotes it move. `equityPct` is unchanged everywhere.
- Judge round 1: PASS, 9 of 9 items, with independent oracle checks and a clean integrity check. The full-file scale-1 run (all scenarios) is in signoff.md section 1.
- Gates: build #1 PASS, fix #2 PASS.

## Review
Round 1: no blocking findings, security review clean (the cache is per-call and a kept `RangeError` is rethrown into the same fallback). No send-backs.

### Non-blocking review notes (deliberately not fixed)
- MINOR: `viewAfter` and the step lists are copied into both new test files, and it already exists in three other test files. The acceptance file is locked. Optional later move to `tests/support`.
- NIT: no test view where whole-range attempt 0 throws a `RangeError`, so the rethrow of a kept error is not tested directly. The spec made this optional.

## How to try it
- `for i in 1 2 3; do ADVICE_PERF_SCALE=1 npx vitest run tests/advice/postflop.perf.test.ts -t headroom; done`
- `npm run -s playtest | shasum -a 256` (expect d4d84efb...2992)
- `npx vitest run tests/advice/calling-run-identity.acceptance.test.ts tests/advice/postflop-calling-run.test.ts`
- Delta: `node --import ./tools/playtest/resolve-ts.js doit/TASK-7.39/advice-delta.ts <baseWorktree> .`

## Run metrics
Questions: 1 asked (state.json says 0) · assumptions logged: 6 in spec (state.json says 0) · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · changed lines 341 across 6 files (budget 210; the two new test files account for most of it, about 245 lines with prettier's layout).

## Known limitations and follow-ups
- User advice in 7+-way pots now uses 10,000 deals for the calling-range number, so it can differ by up to about 1.1 points from before (approved). No golden spot reaches 7 opponents.
- At 9 opponents (10-seat) the calling run still throws and falls back to `equityPct` as before (A-7).
- Follow-up [trainer]: move `viewAfter` and the shared HU/actions-spot step lists into `tests/support`, and add a view where whole-range attempt 0 throws a `RangeError` to the unit file (owner: none known; low value).

## Lessons for the factory (proposals — not applied)
- The builder pre-tool hook blocks writes to `doit/<TASK>/advice-delta.ts` and `signoff.md`, which the spec itself requires. The orchestrator had to copy them. Proposal: allow spec-listed work-folder deliverables in the hook, or have the spec name only paths the hook permits.
- state.json `questions` and `assumptions` stayed at 0 despite Q-1 and six assumptions. Proposal: update them when the spec is approved or the Q&A is recorded.
- The scope gate warned (341 lines vs budget 210). The spec budgeted new test files at about 100 lines, but prettier's one-step-per-line layout doubled them. Proposal: estimate test-file size with that layout.
