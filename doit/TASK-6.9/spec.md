# Spec: TASK-6.9 — Prove the engine over 1,000,000 cash hands with every line-up preset

Status: READY (approved 2026-11-22)
Task: TASK-6.9 · Parent/epic: TASK-6 · Requirements: REQ-056.2, REQ-062.4, REQ-062.5 · Dream: limit-holdem-trainer

## 1. Summary
The million-hand tool gets a line-up mode: `npm run playtest:million -- --lineups` plays 1,000,000 cash hands as 27
shards, one per line-up preset (Mixed, Tough, Soft) and table size (2 to 10). Each shard has a fixed seed. The
combined report prints the hand count for each line-up and size, and the run exits 0 only when every shard reports
zero invariant violations. A new dispatch-only workflow runs this mode. The TASK-1.17 random-seat run stays
byte-identical.

The playtest runner also gains three things:
- It passes each seat the earlier showdowns from the same table instead of `[]`.
- It exports a helper that composes extra per-action checks (such as bot style checks) with `checkStep` through the
  existing `onAction` hook.
- A test proves that a 6-player line-up exercises postflop betting and the postflop cap.

## 2. Scope
- In scope:
  - `src/playtest/shards.ts`: line-up shard plan, `--lineups` option, `--lineup <name>` in each line-up shard's
    arguments, and per-line-up/size hand counts in the combined report (line-up mode only).
  - `.github/workflows/million-lineups.yml`: a new `workflow_dispatch`-only workflow that runs
    `npm run playtest:million -- --lineups` in one job with a 30-minute limit.
  - `src/playtest/runner.ts`:
    - earlier showdowns carried between hands of a run (AC#4);
    - `composeChecks` (AC#5).
  - Tests for AC#1–#6. An opt-in slow test for the 100,000-hand 6-max Mixed throughput (AC#2), added to `test:slow`.
  - The reference-machine timing of `npm run playtest -- --hands 100000 --size 6 --lineup mixed`, recorded by the
    docs stage in the story notes (DoD#1).
- Not doing:
  - Style bots at table sizes other than 6. Hands without 6 seats dealt in keep TASK-6.6's random-move fallback and
    its `Line-up note:` line until TASK-7.6 AC#11 (heads-up and full-ring charts). See Q-3.
  - Sit-and-go line-up coverage (E05, TASK-5.10).
  - Any change to the default `npm run playtest:million` run, `.github/workflows/million.yml`, or any TASK-1.17 locked
    test (D-1).
  - A `schedule:` (nightly) trigger, and any live workflow dispatch during this task (D-2, Q-2: costs money).
  - Real style-band checks (VPIP/PFR/aggression, `--check-styles`): TASK-6.11. This task only provides and proves the
    composition path those checks must use (AC#5).
  - Attributing earlier showdowns to players rather than seats, and freezing entries: TASK-6.19.
  - Passing earlier showdowns to bots in the app session (`src/table/session.ts:297`) and in replay mode.
  - Any bot reading `earlierShowdowns`. No bot reads it today, so every existing output stays identical.
  - Any UI change.
- Scope budget: files=11, lines=700

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Line-up shard seeds are `1_000_000 + 100 × p + size`, with p = 1 Mixed, 2 Tough, 3 Soft (Mixed size 2 → 1000102, Soft size 10 → 1000310). | yes | Fixed, distinct per shard, readable, and the same style as TASK-1.17's `1_000_000 + size` (`src/playtest/shards.ts:60`). Never collides with those seeds. | Reuse `1_000_000 + size` for every preset |
| A-2 | Shards are ordered by preset first (Mixed sizes 2–10, then Tough, then Soft), indexed 1–27. Leftover hands go one each to the earliest shards, as in `planShards` (`src/playtest/shards.ts:49-61`). For 1,000,000 hands: shard 1 gets 37,038 and shards 2–27 get 37,037. | yes | Same rule as the existing plan | Size-major order |
| A-3 | Earlier showdowns are kept per table run. After every completed hand that ended at showdown, `showdownOf(final)` is appended, oldest first. The list resets to `[]` whenever the runner restarts the table: after a violating or abandoned hand, and when a new sit-and-go starts. Only the most recent 1,000 entries are kept (`EARLIER_SHOWDOWN_LIMIT`). Each hand gets a new array, so a list a policy already holds never changes. | yes | Bounds memory for up to 10⁹-hand runs (TASK-1.6 A-6 flagged unbounded growth). No bot reads the list yet. The restart rule matches the existing seat/stack reset (`src/playtest/runner.ts:350-353`). | Unbounded per run; window of 100 |
| A-4 | AC#5 is delivered as an exported `composeChecks(...hooks: ActionHook[]): ActionHook` in `runner.ts`. It returns, in hook order, the concatenation of every hook's violations. Callers pass `composeChecks(checkStep, styleCheck)` as `seams.onAction`. `PlaytestSeams`, `PlaytestOptions`, `runPlaytest`, `playHand` and `main` get no new parameter for checks. | yes | doc-16 A-5 / follow-up: "add style checks via `onAction` composed with `checkStep`". The real style checks are TASK-6.11. | Leave composition to each caller with no helper |
| A-5 | AC#6 is proven with the Tough preset at 6 seats (seat 2 Maniac, others TAG): seed 42, 2,000 hands. Measured on the base commit: 908 postflop bets/raises, 7 postflop streets capped at 4 bets, 0 violations. Mixed at 6 has postflop bets (98) but no postflop cap in that sample, and Soft has none. | yes | Measured with `runPlaytest` at `e7f7166` | A 10,000-hand Mixed sample |
| A-6 | The new workflow mirrors `million.yml` (`.github/workflows/million.yml:1-22`): same pinned checkout/setup-node, no `npm ci`, `timeout-minutes: 30`, `permissions: contents: read`, one job. | yes | TASK-1.17 A-5/A-6. The TASK-1.50 rule gives every job a 30-minute limit (`tests/ci/ci-jobs.acceptance.test.ts`). | 60 or 360 minutes |
| A-7 | The AC#2 throughput test is a new opt-in file, `tests/playtest/lineup-throughput.acceptance.test.ts`, skipped unless `TLH_SLOW_TESTS=1` and listed in `test:slow`. | yes | Standing rule: speed/scale checks stay out of every push. The existing throughput test is locked (TASK-1.17) and has no `--lineup`. | Edit the locked throughput test |

## 3. Current system
- Million tool:
  - `src/playtest/shards.ts:5-8`: `MILLION_HANDS`, `SHARD_SIZES` 2–10, and `SHARD_SEED_BASE` (one shard per size,
    seed `1_000_000 + size`).
  - Shard functions: `shardArgs` (`:64`), `shardNodeArgs` (`:76`), `checkReport` (`:98`, which requires exactly one
    `Options: <shardArgs>` line and `Hands played: <n>`), `combineShards` (`:151`), `formatMillionReport` (`:172`),
    `runShards` (`:205`), `parseMillionArgs` (`:232`) and `millionMain` (`:266`).
  - The process entry `tools/playtest/million.ts` spawns `shardNodeArgs(shard)` per shard, with concurrency
    `os.availableParallelism()`. It needs no change: line-up shards carry `--lineup` through `shardArgs`.
- Playtest CLI (`src/playtest/cli.ts`):
  - The `Options:` line is `--hands H --seed S --size Z[ --game sng][ --lineup name]` (`:379`). A line-up shard's
    `shardArgs` must end with `--lineup <name>` to match it.
  - Line-up cash runs print `Bots replaced: <n>` (`:216`).
  - For size ≠ 6, line-up runs print the `Line-up note:` line (`:342-344`).
- Runner (`src/playtest/runner.ts`):
  - `playHand` builds each view with `playerView(state, state.toAct)`, which gives an empty `earlierShowdowns`
    (`:220`). This is TASK-1.6 A-6.
  - `PlaytestSeams.onAction` defaults to `checkStep`, and a custom hook replaces it (`:92-93`, `:205`).
  - `runPlaytest` carries stacks, seats and button between hands. It restarts the table after a violation (`:350-353`)
    and for a new sit-and-go (`:371`).
- Views: `EarlierShowdown` and `PlayerView.earlierShowdowns` ("oldest first, as supplied (not copied)") are at
  `src/engine/player-view.ts:21-23` and `:56`. `showdownOf(state)` is at `:124`.
- Policies: `seatStylesPolicyFactory` (`src/playtest/policy.ts:30-42`) plays styles only when
  `view.players.length === 6`, and random moves otherwise (TASK-6.6 D-2). TASK-7.6 AC#11 removes that fallback.
- Presets: Tough = Maniac at bot 1 (sizes ≥ 3) plus TAG; Mixed cycles TAG/Calling station/Maniac/Rock; Soft alternates
  Calling station/Rock (`src/bots/lineup.ts:50-55`).
- Tests run with Vitest (`npm test` = `vitest run --coverage`). `TLH_SLOW_TESTS=1` gates the slow tests and `test:slow`
  lists their files (`package.json`).
- Locked tests that touch this area (none needs to change):
  - TASK-1.17: `tests/playtest/million.acceptance.test.ts`, which pins `planShards`, the 9-shard default report and
    `shardNodeArgs` for planShards output.
  - TASK-1.17: `tests/ci/million-workflow.acceptance.test.ts`, which pins `million.yml` (exactly one run line
    `npm run playtest:million`, timeout 30, dispatch only).
  - TASK-1.17: `tests/playtest/throughput.acceptance.test.ts`.
  - TASK-1.50: `tests/ci/ci-jobs.acceptance.test.ts`, which reads only `ci.yml`, `visual.yml` and `million.yml`.
  - TASK-6.6/6.8: the line-up and replacement acceptance tests.
- Measured on the base commit (Apple M4 Pro, 14 cores), 10,000 hands, `--lineup`:

  | Size and preset | Time |
  |---|---|
  | 6 Mixed | 7 s |
  | 6 Tough | 7 s |
  | 6 Soft | 1 s |
  | 10 Mixed | 1 s |
  | 2 Soft | < 1 s |

  The whole 27-shard million run is about 150 s of CPU, so roughly 0.5–1 min wall time locally. Baselines:
  - `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256` = `aacd5e94dccba90b4b50936ba1bb2b08aff2bda37d427efdfb56a6b07e488e01`
  - `npm run -s playtest -- --hands 2000 --seed 42 --lineup tough | shasum -a 256` = `757901b0fd8a41c58e787ab4f29fb81f65e85227bbeadefa8eca0556acb14cbd`
  - `npm run -s playtest:million -- --hands 900 | shasum -a 256` = `1b561d2156b03267291c0b596421ef5f3c00d3e7f5b542a359787d886a71176a`
- Existing code to reuse:
  - `src/playtest/shards.ts` → `runShards`, `readShard`/`checkReport`, `combineShards` and the report layout, all
    unchanged for line-up shards.
  - `src/engine/player-view.ts` → `showdownOf` and the `earlierShowdowns` parameter of `playerView`.
  - `src/engine/invariants.ts:438` → `checkStep` as the first hook in `composeChecks`.
  - `tests/playtest/million.acceptance.test.ts` → its `npmRun`, `inProcessRunner` and `shardSection` patterns. Copy
    them into the new test; the locked file must not be edited.
  - `tests/ci/million-workflow.acceptance.test.ts` → its text assertions and `pinned()` approach for the new
    workflow test.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Add the line-up mode as an opt-in `--lineups` flag on `playtest:million`, with its own dispatch-only workflow. The default run, `million.yml` and every locked TASK-1.17 test stay unchanged. | (b) Make line-ups the default and edit the locked TASK-1.17 tests (cross-story, needs user approval). (c) A new npm script `playtest:million:lineups`. | It meets AC#1/AC#3 with no locked-test edits and keeps the random-seat coverage of every size (still valuable while styles play only at 6 seats). | yes | user (Q-1, auto-accepted) |
| D-2 | `million-lineups.yml` is `workflow_dispatch` only, with no `schedule:`. AC#3 is proven on the branch without any dispatch: a workflow-file test, a full local run, and a shard re-run for byte-identity. | Nightly cron. A live dispatch after merge. | The account is over its free minutes and the TASK-1.51 budget spike is undecided. GitHub can only dispatch workflows on the default branch (TASK-1.17 D-4), so a pre-merge dispatch is impossible anyway. | yes | user (Q-2, auto-accepted) |
| D-3 | Style bots play only in 6-seat hands. At sizes 2–5 and 7–10 the line-up shards run the preset's seats with the random-move fallback, and each shard section shows the `Line-up note:` line. Full style coverage at every size arrives with TASK-7.6 AC#11 with no change here. | Block this story until TASK-7.6. | The story asks for "real style bots in every line-up preset ... at every table size", but advice has only a 6-max chart. Proceeding gives replacement and line-up seating coverage now. The million line-up run picks up styles automatically once 7.6 lands. | yes | user (Q-3, auto-accepted) |
| D-4 | Earlier showdowns are passed through a new optional `HandSetup.earlierShowdowns` (per-hand table data, like `stacks`/`previous`). It is not a seam or option. | A new `PlaytestSeams` field | It is table state, not a test seam | no | n/a |

## 5. Design

### Files to create / modify
- `src/playtest/shards.ts` — modify: `LINEUP_SHARD_PRESETS`, `planLineUpShards`, optional `Shard.lineUp`, `--lineups`
  parsing, per-line-up counts in the line-up report, updated `MILLION_USAGE`.
- `src/playtest/runner.ts` — modify: `HandSetup.earlierShowdowns`, `EARLIER_SHOWDOWN_LIMIT`, carrying showdowns in
  `runPlaytest`, `composeChecks`.
- `.github/workflows/million-lineups.yml` — create: dispatch-only line-up million workflow.
- `package.json` — modify: add `tests/playtest/lineup-throughput.acceptance.test.ts` to `test:slow`.
- `tests/playtest/million-lineups.acceptance.test.ts` — create: AC#1, AC#3 (SPEC-01, SPEC-03).
- `tests/ci/million-lineups-workflow.acceptance.test.ts` — create: AC#3 (SPEC-04).
- `tests/playtest/lineup-throughput.acceptance.test.ts` — create: AC#2, slow, opt-in (SPEC-07).
- `tests/playtest/style-bots.acceptance.test.ts` — create: AC#4, AC#5, AC#6 (SPEC-08, SPEC-09, SPEC-10).
- `tests/playtest/shards.test.ts` — modify: unit tests for `--lineups` parsing and planning (SPEC-06).
- `tests/playtest/runner.test.ts` — modify: unit tests for the showdown window and `composeChecks` (SPEC-08, SPEC-09).

### Components, interfaces and data
- `shards.ts`
  - `export type ShardLineUp = 'mixed' | 'tough' | 'soft'`.
  - `export const LINEUP_SHARD_PRESETS: readonly ShardLineUp[] = ['mixed', 'tough', 'soft']`.
  - `Shard` gains `readonly lineUp?: ShardLineUp`. `planShards` output never sets it.
  - `export function planLineUpShards(totalHands: number): Shard[]`:
    - 27 shards: for p = 0..2, for size 2..10, index = 9p + (size − 1).
    - Seed is `1_000_000 + 100 × (p + 1) + size` (A-1). Hands are spread as in A-2.
    - Throws `RangeError('Total hands must be a whole number from 27 to 1000000000')` below 27, above 10⁹, or for a
      non-integer.
  - `shardArgs(shard)` appends `'--lineup', shard.lineUp` when `lineUp` is set. Output is unchanged otherwise, so
    `shardNodeArgs` for `planShards` is unchanged.
  - `MillionArgs` run variant gains `readonly lineUps: boolean`.
- `runner.ts`
  - `HandSetup.earlierShowdowns?: readonly EarlierShowdown[]`, default `[]`. `playHand` passes it as the third
    argument of `playerView`.
  - `export const EARLIER_SHOWDOWN_LIMIT = 1000`.
  - `export function composeChecks(...hooks: readonly ActionHook[]): ActionHook` returns
    `(step) => hooks.flatMap((hook) => hook(step))`.
  - No new parameter on `runPlaytest`, `playHand`, `main` or `PlaytestSeams`/`PlaytestOptions`.

### Rules and algorithms
- `parseMillionArgs`:
  - It accepts `--lineups` (no value) at most once, in any order with `--hands`.
  - With `--lineups`, the default is 1,000,000 and the range is 27..10⁹.
  - The run variant carries `lineUps: true|false`.
  - `millionMain` plans with `planLineUpShards` when `lineUps` is set, else `planShards`.
- Line-up report (`formatMillionReport` when the shards carry `lineUp`):
  - Plan line: `Plan: <N> cash hands over line-ups mixed, tough and soft at table sizes 2 to 10 in 27 shards, one seed per shard`.
  - Shard headers: `Shard <i> of 27: npm run playtest -- --hands <h> --seed <s> --size <z> --lineup <name>`, followed
    by that shard's stdout verbatim. The stdout includes `Line-up:`, `Line-up note:` (size ≠ 6) and
    `Bots replaced: <n>`.
  - Combined report, in order:
    ```
    Combined report
    Shards passed: <p> of 27
    Hands played: <N>
    Hands for line-up mixed: size 2 <h>, size 3 <h>, size 4 <h>, size 5 <h>, size 6 <h>, size 7 <h>, size 8 <h>, size 9 <h>, size 10 <h>
    Hands for line-up tough: …
    Hands for line-up soft: …
    Invariant violations: <v>
    Violations by invariant: <id n, …>
    Result: PASS|FAIL
    ```
    Each `<h>` is that shard's `handsPlayed` (0 for a failed shard).
  - The default (non-line-up) report is byte-identical to today.
  - Worked example, `--lineups --hands 270`: every shard gets 10 hands. Shard 1 header is
    `Shard 1 of 27: npm run playtest -- --hands 10 --seed 1000102 --size 2 --lineup mixed`. Shard 14 header is
    `Shard 14 of 27: npm run playtest -- --hands 10 --seed 1000206 --size 6 --lineup tough`. Each `Hands for line-up …`
    line lists `size k 10` for k = 2..10.
- Earlier showdowns in `runPlaytest` (A-3):
  - Hand 1 gets `[]`.
  - After hand k completes with no violation:
    - If `showdownOf(final)` is not null, the next hand gets `[...prev, entry].slice(-EARLIER_SHOWDOWN_LIMIT)`.
    - Otherwise (a fold-out) the next hand gets `prev`.
  - On the restart paths (violation or abandoned hand; a new sit-and-go) the next hand gets `[]`.
  - Replay mode (`main` with `--replay-code`) passes `[]`.
  - No bot reads the list, so all baselines in §3 stay identical.

### Error handling and configuration
- `npm run playtest:million` new usage errors, all exit 2 with the message, a newline, then `MILLION_USAGE` on stderr:
  - `Error: --lineups given more than once.`
  - `Error: --hands must be a whole number from 27 to 1000000000 with --lineups.` (for `--lineups` with an out-of-range
    or non-digit `--hands`).
  - `--help` with `--lineups` gives the existing `Error: --help cannot be combined with other options.`
- `MILLION_USAGE` becomes:
  ```
  Usage: npm run playtest:million -- [--hands <9-1000000000>] [--lineups]
  Defaults: --hands 1000000; cash hands spread over table sizes 2 to 10, one shard per size with seed 1000000 + size
  --lineups: cash hands spread over line-ups mixed, tough and soft at table sizes 2 to 10, one shard per line-up and size (27 or more hands)
  ```
- Workflow `.github/workflows/million-lineups.yml`:
  - `name: Million-hand line-up playtest`;
  - `on: workflow_dispatch` only;
  - `permissions: contents: read`;
  - one job `million-lineups` on `ubuntu-24.04` with `timeout-minutes: 30`;
  - steps: the same pinned checkout and setup-node (`node-version-file: .nvmrc`) as `million.yml`, then
    `run: npm run playtest:million -- --lineups`;
  - no `continue-on-error`, `|| true` or `if:`.

## 6. Behaviour specification

### SPEC-01: An on-demand line-up run plays every preset at every size and reports per-line-up counts
- Verifies: AC#1
- Behaviour: Given `planLineUpShards` and the CLI:
  - When `planLineUpShards(1_000_000)` is called, Then it returns 27 shards:
    - presets are `mixed`×9, `tough`×9, `soft`×9;
    - sizes are 2..10 within each preset;
    - hands are `[37038, ...26 × 37037]`, summing to 1,000,000;
    - seeds are `1_000_000 + 100p + size`;
    - indexes are 1..27.
  - When `npm run playtest:million -- --lineups --hands 270` runs, Then it exits 0, and:
    - the 27 `Shard i of 27:` headers match §5;
    - each shard section contains `Invariant violations: 0` and a `Bots replaced: <n>` line;
    - the combined report equals the §5 block with `Shards passed: 27 of 27`, `Hands played: 270`, three
      `Hands for line-up …` lines each listing `size k 10` for k = 2..10, `Invariant violations: 0`,
      `Violations by invariant: chips 0, legal-action 0, bet-cap 0, pot-eligibility 0, cards 0` and `Result: PASS`.
  - With an in-process runner where shard 14 (tough, size 6) gets a forced `chips` violation:
    - the run exits 1;
    - `Shards passed: 26 of 27`;
    - `Hands for line-up tough:` shows `size 6 10`;
    - the shard section contains a `Replay: npm run playtest -- --replay-code … --lineup tough` line.
- Verification: acceptance `tests/playtest/million-lineups.acceptance.test.ts::an on-demand line-up run plays Mixed, Tough and Soft at every table size 2 to 10 and reports zero violations`

### SPEC-02: The full 1,000,000-hand line-up run passes
- Verifies: AC#1, AC#3
- Behaviour: Given the reference machine, When `npm run playtest:million -- --lineups` runs, Then it exits 0 and prints:
  - `Hands played: 1000000`;
  - `Hands for line-up mixed: size 2 37038, size 3 37037, …, size 10 37037` (tough and soft: all 37037);
  - `Shards passed: 27 of 27`, `Invariant violations: 0` and `Result: PASS`.

  The expected wall time is about 1 minute on 14 cores. Every shard therefore finishes far inside the 360-minute
  GitHub job limit and the workflow's 30-minute timeout. The Judge records the `time` output. A live GitHub dispatch
  is out of scope (Q-2); it stays a post-merge item under TASK-1.51.
- Verification: command `time npm run playtest:million -- --lineups`

### SPEC-03: Re-running a line-up shard with its seed gives byte-identical output
- Verifies: AC#3
- Behaviour: Given the line-up shard `--hands 2000 --seed 1000206 --size 6 --lineup tough`:
  - When it runs twice through `npm run playtest`, Then both runs exit 0 with identical stdout.
  - When `npm run playtest:million -- --lineups --hands 270` runs twice, Then the stdout is identical.
  - Shard 14's section equals the stdout of `npm run playtest -- --hands 10 --seed 1000206 --size 6 --lineup tough`.
- Verification: acceptance `tests/playtest/million-lineups.acceptance.test.ts::re-running a line-up shard with its seed gives byte-identical output`

### SPEC-04: The line-up million run has a dispatch-only workflow in one bounded job
- Verifies: AC#3
- Behaviour: Given `.github/workflows/million-lineups.yml`, When its text is read, Then:
  - it has exactly the `workflow_dispatch:` trigger (no `schedule:`, `push:`, `pull_request:` or `workflow_run:`);
  - it has `permissions: contents: read` and exactly one job, running on `ubuntu-24.04` with `timeout-minutes: 30`
    (≤ 360);
  - its only `run:` is `npm run playtest:million -- --lineups`;
  - it has no `continue-on-error`, `|| true` or `if:`;
  - it has exactly two `uses:`, which are the checkout and setup-node pins used in `ci.yml`.
- Verification: acceptance `tests/ci/million-lineups-workflow.acceptance.test.ts::the line-up million workflow runs on manual dispatch as one bounded job that fails on a non-zero exit`

### SPEC-05: The TASK-1.17 random-seat million run is unchanged
- Verifies: AC#3
- Behaviour: Given no `--lineups`, When `npm run -s playtest:million -- --hands 900 | shasum -a 256` runs, Then the hash is
  `1b561d2156b03267291c0b596421ef5f3c00d3e7f5b542a359787d886a71176a`. The locked
  `tests/playtest/million.acceptance.test.ts` and `tests/ci/million-workflow.acceptance.test.ts` pass unedited.
- Verification: command `npm run -s playtest:million -- --hands 900 | shasum -a 256`

### SPEC-06: `--lineups` argument handling
- Verifies: AC#1
- Behaviour: `parseMillionArgs`:
  - `['--lineups']` gives `{kind:'run', hands:1000000, lineUps:true}`.
  - `['--hands','270','--lineups']` and `['--lineups','--hands','270']` both give `{kind:'run', hands:270, lineUps:true}`.
  - `[]` gives `{kind:'run', hands:1000000, lineUps:false}`.
  - `['--lineups','--lineups']` gives `Error: --lineups given more than once.`
  - `['--lineups','--hands','26']` gives `Error: --hands must be a whole number from 27 to 1000000000 with --lineups.`
  - `['--help','--lineups']` gives `Error: --help cannot be combined with other options.`
  - `millionMain` on a usage error returns 2 and writes the message and `MILLION_USAGE` to `err`.
  - `planLineUpShards(26)` throws `RangeError`.
- Verification: unit `tests/playtest/shards.test.ts::--lineups parsing and the line-up shard plan`

### SPEC-07: 100,000 6-max Mixed hands with style bots finish within 60 minutes
- Verifies: AC#2, DoD#1
- Behaviour: Given `TLH_SLOW_TESTS=1`, When `npm run playtest -- --hands 100000 --size 6 --lineup mixed` runs, Then:
  - it exits 0 within 3,600,000 ms;
  - stdout contains `Hands played: 100000` and `Invariant violations: 0`.

  It is skipped in the normal suite. The expected time is about 70 s on the reference machine. The docs stage records
  the measured `time` (real) in the story notes, with the machine and Node version.
- Verification: acceptance `tests/playtest/lineup-throughput.acceptance.test.ts::100,000 6-max Mixed hands with style bots finish within 60 minutes with zero violations`

### SPEC-08: Each seat receives the earlier showdowns of the session
- Verifies: AC#4
- Behaviour: Given `runPlaytest({hands: 300, seed: 42, size: 6, lineUp: 'Tough'})` with a `makePolicy` seam that wraps
  `seatStylesPolicyFactory(seatLineUp('Tough', 6, 1))` and records `view.earlierShowdowns` at every decision, When it
  runs, Then:
  - every decision in hand 1 sees `[]`;
  - every decision in hand k sees exactly the `showdownOf(final)` entries of hands 1..k−1 that ended at showdown,
    oldest first, deep-equal (fold-outs contribute nothing);
  - at least one decision sees a non-empty list;
  - the run's summary is identical to the same run without the recording wrapper.

  With an `onAction` seam that forces a violation in hand 5, hand 6 sees `[]` again (table restart). Unit:
  - after 1,001 showdown hands the list holds the last 1,000 entries (`EARLIER_SHOWDOWN_LIMIT`);
  - an array handed to hand k is not mutated by later hands.

  Baselines in §3 for `--hands 10000 --seed 42 --size 6` and `--hands 2000 --seed 42 --lineup tough` keep their hashes.
- Verification: acceptance `tests/playtest/style-bots.acceptance.test.ts::the playtest passes each seat the earlier showdowns from previous hands`

### SPEC-09: Bot style checks compose with checkStep through onAction
- Verifies: AC#5
- Behaviour: Given a test `styleCheck: ActionHook` that reports `{invariant: 'style-check', message}` when a Maniac seat
  folds preflop with no bet owed, and otherwise `[]`, When `runPlaytest` runs a `--lineup`-style run (`lineUp: 'Tough'`,
  size 6) with `seams.onAction = composeChecks(checkStep, styleCheck)`, Then:
  - the hook sees every action;
  - a clean run reports `Invariant violations: 0`;
  - with a faulty test engine (adds a chip on the first action) the summary counts `chips` (from `checkStep`);
  - with a style check that always fires, the summary counts `style-check`;
  - both kinds appear in one hand's violation when both fire, in hook order.

  `composeChecks()` with no hooks returns `[]`. `runPlaytest.length`, `playHand.length` and `main.length` are unchanged
  (2, 3 and 2), and `PlaytestSeams` has no new key.
- Verification: acceptance `tests/playtest/style-bots.acceptance.test.ts::bot style checks are composed with checkStep through the onAction hook`

### SPEC-10: A 6-player line-up exercises postflop betting and the postflop cap
- Verifies: AC#6
- Behaviour: Given `runPlaytest({hands: 2000, seed: 42, size: 6, lineUp: 'Tough'})` with the default `checkStep`, When it
  runs, Then:
  - more than 0 postflop `bet`/`raise` actions are applied;
  - at least 1 postflop street reaches 4 bets (the cap);
  - `violations` is 0.

  Measured at the base commit: 908 bets/raises and 7 capped streets (A-5). The same run with `lineUp: 'Mixed'` has more
  than 0 postflop bets/raises.
- Verification: acceptance `tests/playtest/style-bots.acceptance.test.ts::a 6-player line-up with betting policies exercises postflop bets and the postflop cap`

### SPEC-11: 10,000-hand playtests report zero violations with unchanged output
- Verifies: DoD#7
- Behaviour: `npm run playtest -- --hands 10000 --seed 42` exits 0 with `Invariant violations: 0`, and its `-s` output hash
  equals `aacd5e94dccba90b4b50936ba1bb2b08aff2bda37d427efdfb56a6b07e488e01`.
  `npm run -s playtest -- --hands 2000 --seed 42 --lineup tough | shasum -a 256` equals
  `757901b0fd8a41c58e787ab4f29fb81f65e85227bbeadefa8eca0556acb14cbd`.
- Verification: command `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256`

### SPEC-12: Quality gates
- Verifies: DoD#2, DoD#3, DoD#5, DoD#6, DoD#11
- Behaviour: Every AC has a passing automated test (SPEC-01, 03, 04, 07, 08, 09, 10). `npm run lint`,
  `npm run typecheck` and `npm test` pass with zero errors. Coverage thresholds hold. `src/playtest/*` imports no UI
  or browser-only module (the existing boundary tests pass). CI is green on the branch through the normal push
  workflow; the new workflow is never dispatched.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-13: Not-applicable DoD items
- Verifies: DoD#4, DoD#8, DoD#9, DoD#10, DoD#12, DoD#13
- Behaviour: These DoD items are not applicable or are handled by a later stage.
  - Not applicable:
    - Golden-spot suite (DoD#4): not created yet (E07-S14).
    - Screens (DoD#8, DoD#13): no screen or dialog changes.
    - Network (DoD#9): no network code; the workflow adds no step beyond the pinned checkout and setup-node.
    - Strategy content (DoD#10): no strategy content.
  - The story documentation, including the DoD#1 timing, is published to Backlog.md by the docs stage (DoD#12).
- Verification: manual `grep -rn "fetch(\|XMLHttpRequest\|WebSocket" src/playtest` finds nothing; the docs stage publishes the story doc

## 7. Edge cases
- Minimum hands: `--lineups --hands 27` gives one hand per shard (SPEC-06 boundary). 26 is a usage error (SPEC-06).
- Leftover distribution: `--hands 28` gives shard 1 two hands and the rest one (A-2; unit in SPEC-06).
- Failed or killed shard: the existing `checkReport` path makes the shard count 0 hands in its `Hands for line-up` cell
  and the run exit 1 (SPEC-01 forced violation).
- A line-up shard's stdout carries `Bots replaced:` and `Line-up note:` lines. `checkReport` ignores extra lines but
  requires the exact `Options:` line. That line includes `--lineup <name>` (SPEC-01, SPEC-03).
- Sizes other than 6 play the random fallback (D-3). The shard still passes its invariant checks (SPEC-01/02).
- Earlier showdowns:
  - fold-out hands add nothing;
  - after a violation or a new sit-and-go the list restarts;
  - it is bounded at 1,000 (SPEC-08).
- Concurrency: shards run in separate processes with no shared state; output order is the shard order (existing
  `runShards`).
- Interruption: a killed child gives `stopped before finishing`, the existing path.

## 8. Security considerations
- Trust boundaries: CLI argv only. `--lineups` is a fixed flag and `--hands` is digit-validated against bounds (SPEC-06).
  No shell is used to spawn shards (`spawn` with an args array, `tools/playtest/million.ts:12`).
- Workflow: `permissions: contents: read`, pinned action SHAs, no secrets, no `npm ci` (no dependency download).
- New dependencies: none.
- Randomness: deterministic seeded PRNG by design (replayable), not security-sensitive.
- Logs: hand histories only; no sensitive data.

## 9. Non-functional
- Throughput: 100,000 6-max Mixed hands in ≤ 60 min on the reference machine (REQ-062.5, SPEC-07). Expected about 70 s.
- Million line-up run: every shard < 360 min. On a 14-core Mac the whole run takes about 1 min. On a hosted 2-vCPU
  runner the estimate is 3–5 min (≤ 30-minute job timeout).
- Determinism: same seed and options give byte-identical output (REQ-062.4, SPEC-03).
- Memory: the earlier-showdown list is O(1) in hands (≤ 1,000 entries, A-3).
- Cost: no GitHub Actions minutes are spent by this task. Each future dispatch of `million-lineups.yml` is an
  estimated 3–5 billed minutes (Q-2).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest:million -- --lineups`
- New tests (path → SPEC ids):
  - `tests/playtest/million-lineups.acceptance.test.ts` → SPEC-01, SPEC-03
  - `tests/ci/million-lineups-workflow.acceptance.test.ts` → SPEC-04
  - `tests/playtest/lineup-throughput.acceptance.test.ts` → SPEC-07 (slow, opt-in via `npm run test:slow`)
  - `tests/playtest/style-bots.acceptance.test.ts` → SPEC-08, SPEC-09, SPEC-10
  - `tests/playtest/shards.test.ts` → SPEC-06
  - `tests/playtest/runner.test.ts` → SPEC-08 (window/immutability), SPEC-09 (`composeChecks` units)
- Slow group: `test:slow` adds `tests/playtest/lineup-throughput.acceptance.test.ts`.
- End-to-end scenario for the Judge (local only; do not dispatch any workflow):
  1. `time npm run playtest:million -- --lineups`: exits 0 with `Shards passed: 27 of 27`, `Hands played: 1000000`,
     three `Hands for line-up …` lines and `Result: PASS`. Expect about 1 min (SPEC-02).
  2. Run `npm run playtest -- --hands 37037 --seed 1000206 --size 6 --lineup tough` twice and diff the outputs: they are
     identical (AC#3 byte-identity at full shard size).
  3. `time npm run playtest -- --hands 100000 --size 6 --lineup mixed`: exits 0, ≤ 60 min (expect about 70 s); the
     timing goes in the story notes (SPEC-07, DoD#1).
  4. Check the baseline hashes in SPEC-05 and SPEC-11.

## 11. Open questions
- None. Resolved in `doit/TASK-6.9/qa.md`. Autopilot auto-accepted the recommended option for each:
  - Q-1 (D-1): opt-in `--lineups` mode, new dispatch-only `million-lineups.yml`, report text as in §5. The TASK-1.17
    run, `million.yml` and its locked tests stay unchanged. Approved.
  - Q-2 (D-2): no `schedule:` trigger and no live dispatch in this task, so no Actions minutes are spent. Approved.
  - Q-3 (D-3): style bots play in 6-seat hands only until TASK-7.6 AC#11. Approved.
- AC#3 live-dispatch limitation: a real GitHub run of `million-lineups.yml` is NOT proven in this task. It is a
  post-merge item tracked under the user's budget decision (TASK-1.51). SPEC-02, SPEC-03 and SPEC-04 prove the rest of
  AC#3 locally: every shard finishes far inside the limit, shard re-runs are byte-identical, the combined report covers
  1,000,000 hands, and the workflow is dispatch-only with a 30-minute bound.

## 12. Clarifications log
See `doit/TASK-6.9/qa.md`.
