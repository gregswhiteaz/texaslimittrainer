# TASK-6.9: Prove the engine over 1,000,000 cash hands with every line-up preset

Status: Done (pending Judge) · Completed: 2026-11-22 · Epic: TASK-6 · Milestone: m-1 · Requirements: REQ-056.2, REQ-062.4, REQ-062.5 · Branch: doit/TASK-6.9

## What was asked
Add a million-hand run that plays every line-up preset (Mixed, Tough, Soft) at every table size 2 to 10 with fixed seeds, reports hand counts per line-up, and exits 0 only with zero invariant violations. Run it from a workflow. Prove 100,000 6-max Mixed hands with style bots fit inside 60 minutes. Give bots the earlier showdowns, provide a way to compose style checks with `checkStep`, and prove a 6-player line-up exercises postflop betting and the cap. Spec: doit/TASK-6.9/spec.md.

## Not proven here (read first)
- AC#3's live GitHub run of `million-lineups.yml` has NOT been done. Q-2 forbids dispatching because it costs Actions minutes, and GitHub can only dispatch workflows on the default branch. The rest of AC#3 is proven locally (full run, byte-identical re-run, workflow-file test). The live dispatch waits on the budget decision TASK-1.51.
- Style bots play only in 6-seat hands (Q-3). At sizes 2-5 and 7-10 the shards run the preset's seats with the random-move fallback until TASK-7.6 AC#11.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Shard seeds are `1_000_000 + 100p + size` (p: Mixed 1, Tough 2, Soft 3) | yes | Fixed, distinct, same style as TASK-1.17 | Change the seed formula in `planLineUpShards` |
| A-2 | Shards ordered preset-first, sizes 2-10; leftover hands go one each to the earliest shards (shard 1: 37,038, others 37,037) | yes | Same rule as `planShards` | Reorder in `planLineUpShards` |
| A-3 | Earlier showdowns kept per table run, newest 1,000 only (`EARLIER_SHOWDOWN_LIMIT`), reset on table restart (violation, abandoned hand, new sit-and-go); each hand gets a fresh array | yes | Bounds memory for 10^9-hand runs; matches the seat/stack reset | Change the limit or reset rule in `runPlaytest` |
| A-4 | AC#5 delivered as exported `composeChecks(...hooks)` in `runner.ts`; no new parameter on runner functions or seams | yes | Follows doc-16 A-5; real style checks are TASK-6.11 | Remove the helper, compose in callers |
| A-5 | AC#6 proven with Tough at 6 seats, seed 42, 2,000 hands (908 postflop bets/raises, 7 capped streets at base commit) | yes | Measured at `e7f7166` | Use a larger Mixed sample |
| A-6 | Workflow mirrors `million.yml`: pinned actions, no `npm ci`, 30-minute timeout, `contents: read`, one job | yes | TASK-1.17 A-5/A-6, TASK-1.50 | Change `timeout-minutes` |
| A-7 | AC#2 throughput test is a new opt-in file (`TLH_SLOW_TESTS=1`), added to `test:slow` | yes | Slow checks stay out of every push; the TASK-1.17 test is locked | Merge into the locked test (needs approval) |

## Clarifications and decisions
All auto-accepted (autopilot, recommended option); see doit/TASK-6.9/qa.md.
- Q-1 / D-1: opt-in `--lineups` flag on `playtest:million` plus a new dispatch-only `million-lineups.yml`. The default run, `million.yml` and all TASK-1.17 locked tests are unchanged.
- Q-2 / D-2: no `schedule:` trigger and no live dispatch in this task (no Actions spend).
- Q-3 / D-3: style bots only in 6-seat hands until TASK-7.6 AC#11; other sizes show the `Line-up note:` line.
- D-4: earlier showdowns travel through an optional `HandSetup.earlierShowdowns`, not a seam.

## What was built
- `src/playtest/shards.ts`: `ShardLineUp`, `LINEUP_SHARD_PRESETS`, `planLineUpShards` (27 shards), optional `Shard.lineUp` (`shardArgs` appends `--lineup <name>`), `--lineups` parsing with usage errors, a line-up plan line and `Hands for line-up <name>: size 2 <h>, …` lines in the combined report, updated `MILLION_USAGE`. The default report is unchanged.
- `src/playtest/runner.ts`: `HandSetup.earlierShowdowns` passed to every `playerView`; `EARLIER_SHOWDOWN_LIMIT`; showdowns carried between hands; exported `composeChecks(...hooks)` that concatenates hook violations in order (`seams.onAction = composeChecks(checkStep, styleCheck)`).
- `.github/workflows/million-lineups.yml`: `workflow_dispatch` only, one job, 30-minute timeout, runs `npm run playtest:million -- --lineups`.
- `package.json`: `test:slow` lists the new throughput test.
- Tests: `tests/playtest/million-lineups.acceptance.test.ts`, `tests/ci/million-lineups-workflow.acceptance.test.ts`, `tests/playtest/lineup-throughput.acceptance.test.ts`, `tests/playtest/style-bots.acceptance.test.ts`; additions to `tests/playtest/shards.test.ts` and `tests/playtest/runner.test.ts`.
- No new dependencies. No bot reads `earlierShowdowns` yet, so existing outputs are identical.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | acceptance `million-lineups.acceptance.test.ts` (27 shards, 270-hand run, forced-violation shard) | pass | gates/fix-2.json |
| SPEC-02 | AC#1, AC#3 | full `npm run playtest:million -- --lineups` | PASS: 27/27 shards, 0 violations, 26.0 s real | build run (judge re-checks) |
| SPEC-03 | AC#3 | acceptance: byte-identical shard re-run | pass | gates/fix-2.json |
| SPEC-04 | AC#3 | workflow-file acceptance test | pass | gates/fix-2.json |
| SPEC-05 | AC#3 | `--hands 900` hash `1b561d…176a` unchanged | pass | code review re-ran it |
| SPEC-06 | AC#1 | unit `shards.test.ts` | pass | gates/fix-2.json |
| SPEC-07 | AC#2, DoD#1 | opt-in test; `npm run playtest -- --hands 100000 --size 6 --lineup mixed` | 27.3 s real, 0 violations (Apple M4 Pro, Node v22.18.0); limit is 60 min | build run |
| SPEC-08 | AC#4 | acceptance: showdown lists per hand, restart, 1,000 window, immutability | pass | gates/fix-2.json |
| SPEC-09 | AC#5 | acceptance: `composeChecks` with `checkStep` and a test style check | pass | gates/fix-2.json |
| SPEC-10 | AC#6 | acceptance: Tough 6-max, 2,000 hands, bets and cap seen, 0 violations | pass | gates/fix-2.json |
| SPEC-11 | DoD#7 | baseline hashes `aacd5e…8e01` and `757901…4cbd` unchanged | pass | code review re-ran them |
| SPEC-12 | DoD gates | `npm test`, lint, typecheck | pass; coverage 97.31% stmts, 95.55% branches, 94.83% funcs, 97.55% lines | gates/fix-2.json |

- Gates: build-1 PASS, fix-2 PASS. Scope budget: 794 changed lines vs 700 budget (warning only), 10 files vs 11.
- Judge: see doit/TASK-6.9/judge/.

## Review
Round 1: 0 blocking findings (code and security reviewers). Only NITs.

### Non-blocking review notes (deliberately not fixed)
- Code NIT: the SPEC-08 and SPEC-10 acceptance tests take 5.4 s and 6.8 s locally; within the timeout.
- Code NIT: `expect(Object.keys(seamKeys)).toHaveLength(3)` always passes at runtime; only typecheck guards `PlaytestSeams` against new keys.
- Code NIT: the plan-line text and `MILLION_USAGE` hard-code "mixed, tough and soft" instead of using `LINEUP_SHARD_PRESETS`.
- Security NIT: `actions/checkout` keeps `persist-credentials: true` (read-only token, same as `million.yml`); optional hygiene fix.

## How to try it
- `npm run playtest:million -- --lineups` (27 shards, 1,000,000 hands; about 26 s on a 14-core Mac)
- `npm run playtest:million -- --lineups --hands 270` (quick check)
- `npm run playtest -- --hands 100000 --size 6 --lineup mixed`
- `TLH_SLOW_TESTS=1 npm run test:slow`

## Run metrics
Questions 3 (auto-accepted) · assumptions 7 · review rounds 1 · judge rounds: see judge/ · gate runs 2 · escalations 0 · changed lines 794.

## Known limitations and follow-ups
- [infra] Live dispatch of `million-lineups.yml` after merge (AC#3 live evidence). Add an AC to TASK-1.51 or a tracker; waits on the user's budget decision. Orchestrator handles it.
- [trainer] Earlier showdowns are keyed by seat, not player, and not frozen: owned by TASK-6.19 (its ACs #1-#2 cover attribution and freezing; the playtest runner now also supplies this list, so cover it there).
- [trainer] The app session (`src/table/session.ts:297`) and replay mode still pass no earlier showdowns. TASK-6.15 (replay) does not mention showdowns in its ACs, and no AC found covers the session. Add an AC there, or to TASK-6.19.
- [trainer] Style bots at sizes other than 6: TASK-7.6 AC#11; `--lineups` picks them up unchanged.
- [trainer] Real style-band checks (VPIP/PFR/aggression) must use `composeChecks`: TASK-6.11.

### Not tracked (infra, below the value bar)
- `persist-credentials: false` on the checkout in both million workflows: no real failure path (read-only token, trusted dispatch).

## Lessons for the factory (proposals — not applied)
- The spec's size estimates were low (794 changed lines vs 700 budget); count test files when budgeting. No other slowdowns recorded in the artifacts.
