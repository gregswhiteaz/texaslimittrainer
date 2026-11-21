# Spec: TASK-1.17 — Prove the engine with a 1,000,000-hand invariant run

Status: READY (approved 2026-11-21)
Task: TASK-1.17 · Parent/epic: TASK-1 · Requirements: REQ-056, REQ-062 · Dream: limit-holdem-trainer

## 1. Summary
This task adds `npm run playtest:million`. It splits 1,000,000 cash hands over table sizes 2 to 10 into nine
shards, one per table size, each with a fixed seed. The shards run as parallel child processes of the existing
`npm run playtest` entry. The tool prints every shard's report as written, then a combined report that sums the
hands and the per-invariant violation counts. It exits 1 if any shard has a violation or fails. A new GitHub
Actions workflow, `million.yml`, runs the tool on manual dispatch only. The run is fast: 9 shards (1,000,000
hands) took 7 s wall time locally, and 100,000 6-max hands took 4.75 s. So one cheap job is enough and no
nightly schedule is needed.

## 2. Scope
- In scope:
  - `src/playtest/shards.ts`: the shard plan, shard argv, reading a shard report, combining, the report text,
    a bounded-concurrency shard runner and `millionMain`. All pure apart from the injected runner.
  - `tools/playtest/million.ts`: the process entry. It spawns one child per shard and passes no seams.
  - `package.json`: the `playtest:million` script.
  - `.github/workflows/million.yml`: `workflow_dispatch` only, one job.
  - README: a command row, a "Million-hand playtest" paragraph and the AC#4 timing under Speed targets.
  - Tests: listed in §10.
- Not doing:
  - Engine, bot, invariant or `src/playtest/cli.ts` / `runner.ts` changes. The single-run CLI's options and
    output stay byte-for-byte the same.
  - Sit-and-go shards (TASK-5.10) and bot line-up shards (TASK-6.9).
  - A nightly `schedule:` trigger, a job matrix, artifacts, caching, or any change to `ci.yml`.
  - A `--json` or other new option on `npm run playtest`.
  - Progress output, timings in stdout, or options on `playtest:million` beyond `--hands` and `--help`.
- Scope budget: files=9, lines=750

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Shard seed = 1,000,000 + table size (1000002 … 1000010) | yes | Fixed, distinct per shard, and far from the CI seed 42 | `size`; base seed × index |
| A-2 | `total mod 9` leftover hands go one each to the smallest sizes first (1,000,000 → size 2 gets 111,112, sizes 3–10 get 111,111) | yes | The hands sum exactly to the total | Leftover to size 10 |
| A-3 | Concurrency = `os.availableParallelism()` (at least 1) | yes | Uses every core; 2 on a GitHub-hosted private runner | Fixed 9; a `--jobs` flag |
| A-4 | Shard outputs are buffered and printed in shard order once all shards finish. Nothing goes to stdout or stderr while they run | yes | Output stays deterministic (byte-identical re-runs) | Stream as shards finish |
| A-5 | The workflow skips `npm ci` and the npm cache | yes | The playtest imports only `node:` builtins and `src/` (no package imports in `src/{engine,bots,advice,playtest}`). Saves ~20–30 s per run | `npm ci` like `ci.yml` |
| A-6 | Job `timeout-minutes: 30` | yes | About 10× the expected run and well under the 6-hour limit. A hang fails fast | 60; 360 |
| A-7 | A shard that crashes, is killed, or prints a report that doesn't match its plan counts as a failed shard: overall exit 1, same as a violation | yes | Either way the workflow must fail | Distinct exit code 3 |
| A-8 | `--hands` range for `playtest:million` is 9–1,000,000,000, default 1,000,000 | yes | At least one hand per table size; same maximum as `--hands` on `npm run playtest` | — |
| A-9 | The AC#4 throughput test runs in every `npm test`. It adds ~5 s locally and ~10–15 s in CI | yes | DoD#2 needs an automated test. The 60-min bound is loose enough to enforce everywhere | Opt-in env var like the perf suites |

## 3. Current system
- Playtest entry: `tools/playtest/main.ts:5` calls `main(argv, io)` without seams. So every `npm run playtest`
  run uses the default checker `checkStep` (`src/playtest/runner.ts:186` `onAction = checkStep`) and the
  default policies.
- `package.json` script `playtest` = `node --import ./tools/playtest/resolve-ts.js tools/playtest/main.ts`. Node
  22.18.0 type stripping (`.nvmrc`). The loader `tools/playtest/resolve-ts.js` resolves extensionless imports.
- The CLI report is deterministic text (`src/playtest/cli.ts:146-170` `formatReport`):
  - Header `TLH Trainer playtest`, then `Options: --hands H --seed S --size N` (`cli.ts:259`) and the Table line.
  - Then `Hands played:`, …, `Invariant violations: V`.
  - When V > 0 it adds a violation block (`cli.ts:183-210`): `Violations by invariant: chips n, legal-action n,
    bet-cap n, pot-eligibility n, cards n[, custom n]`, `First violation: …`, `Violation: …` lines,
    `Replay: npm run playtest -- --replay-code … --size … --button …`, and the hand's action history
    (`formatHand`, `cli.ts:220-247`: seats/cards, board, `Preflop:`…`River:` lines, `Result:`).
- Exit codes (`cli.ts:270`): 0 clean, 1 violations, 2 usage error.
- `violationCounts` (`runner.ts:126`) counts hands violating each id: every `INVARIANTS` id
  (`src/engine/invariants.ts:15-21`), then custom ids in first-seen order.
- Hand codes depend on (seed, game, hand number) and not on size (`runner.ts:155-170`). So shards need
  distinct seeds, or every size would deal the same decks.
- Tests: Vitest (`npm test` = `vitest run --coverage`), with ≥ 90% line coverage on `src/playtest/**`
  (`vite.config.ts:16-19`). Playtest acceptance tests spawn `npm run playtest -- …` with
  `sandboxEnv()`/`REPO_ROOT` from `tests/support/sandbox.ts:16,46` and strip npm's `>` header lines
  (`tests/playtest/playtest.acceptance.test.ts:16-30`). Workflow tests read the YAML as text
  (`tests/ci/workflow.test.ts:6`).
- Headless boundary lint (`tools/lint/headless-boundary.js:7`) covers `src/playtest`. `node:` builtins are
  allowed, browser APIs are not.
- CI (`.github/workflows/ci.yml`) runs on push/PR and already runs a 10,000-hand playtest. Its pinned actions
  are `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1` and
  `actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0`. Dependabot keeps them updated
  (`.github/dependabot.yml`).
- Measured at spec time (Apple M4 Pro, 14 cores, Node 22.18.0):
  - `npm run playtest -- --hands 100000 --size 6`: real 4.75 s, `Invariant violations: 0`.
  - 10,000 hands per size: 0.35 s (size 2) to 0.83 s (size 10).
  - The nine planned shards (A-1, A-2) run in parallel with plain `node`: 7 s wall, all
    `Invariant violations: 0`, ~50 s CPU in total.
  - Re-running the size-10 shard gave byte-identical output.
- Existing code to reuse:
  - `tools/playtest/main.ts` (via `resolve-ts.js`) → the shard child process. Nothing new is needed to run a
    shard.
  - `src/engine/invariants.ts` `INVARIANTS` → the order of combined counts.
  - `src/playtest/cli.ts` `CliIo` → the io type for `millionMain`. `main(argv, io, seams)` → tests build
    violating shard reports in-process.
  - `tests/support/sandbox.ts` `REPO_ROOT`, `sandboxEnv` → spawning in tests.
  - The `npm run playtest` spawn helper pattern in `tests/playtest/playtest.acceptance.test.ts:16-30`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Shards are 9 parallel child processes inside **one** Actions job, one shard per table size | A 9-job matrix plus a combine job (~10 jobs × ≥1 billed min each ≈ 10–20 min per run); run outside CI on the reference machine | The shards run in parallel with fixed seeds, as AC#2 requires. Each shard is bounded by the job's 30-min timeout, far under 6 h. Est. ~2–3 billed min per run against ~10–20 for a matrix. The user prefers a single cheap job | yes | n/a — the brief's cost rule (single cheap job, minimal infra); user reviews after completion |
| D-2 | `million.yml` triggers on `workflow_dispatch` only, with no `schedule:` | Nightly cron (~2–3 min × 30 ≈ 60–90 min/month, 3–5% of the 2,000 free minutes) | AC#2 accepts "nightly schedule or a manual dispatch". The run is deterministic, so a nightly re-run of unchanged code proves nothing new. Dispatch costs 0 minutes/month unless triggered. Cheapest option that meets the ACs | yes | n/a — the brief's cost rule (cheapest option meeting the ACs) |
| D-3 | Combine by reading each shard's existing text report (`Options`, `Hands played`, `Invariant violations`, `Violations by invariant` lines) | A new `--json` option on `npm run playtest`; worker threads that return summaries | No change to the CLI's public interface. The shard output is exactly what a user re-runs. The parser checks the Options line against the plan | no | n/a |
| D-4 | Branch proof of AC#2: workflow-file acceptance test, plus the tool's violation/combine tests, plus a full local `npm run playtest:million`. The **live dispatch moves to a tracker task**: GitHub can only dispatch a workflow whose file is on the default branch, so it can't run before merge | Add a temporary `push` trigger for the doit branch | No extra triggers or infra. The live run needs a post-merge event | yes | n/a — forced by the GitHub dispatch rule; the orchestrator creates the tracker AC (see scope concerns) |
| D-5 | Each shard runs the same entry as `npm run playtest` (`tools/playtest/main.ts`) with only `--hands --seed --size` | Call `runPlaytest` in-process | This guarantees the default checker (AC#5) and default policies. Each shard header shows a command the user can re-run to get byte-identical output (AC#3) | no | n/a |

## 5. Design

### Files to create / modify
- `src/playtest/shards.ts` — new: plan, argv, report reading, combine, format, runner, `millionMain`.
- `tools/playtest/million.ts` — new: process entry (spawns shards, sets `process.exitCode`).
- `package.json` — add script `"playtest:million": "node --import ./tools/playtest/resolve-ts.js tools/playtest/million.ts"`.
- `.github/workflows/million.yml` — new dispatch-only workflow.
- `README.md` — command table row, a "Million-hand playtest" paragraph under Continuous integration, and the
  100,000-hand timing under Speed targets.
- `tests/playtest/million.acceptance.test.ts` — new (AC#1, AC#2, AC#3, AC#5).
- `tests/playtest/throughput.acceptance.test.ts` — new (AC#4).
- `tests/ci/million-workflow.acceptance.test.ts` — new (AC#2 workflow).
- `tests/playtest/shards.test.ts` — new unit tests.

### Components, interfaces and data
`src/playtest/shards.ts` (headless, no `node:` imports needed):
```ts
export const MILLION_HANDS = 1_000_000;
export const SHARD_SIZES: readonly number[] = [2, 3, 4, 5, 6, 7, 8, 9, 10];
export const SHARD_SEED_BASE = 1_000_000;
export interface Shard { readonly index: number; /* 1-based */ readonly size: number; readonly hands: number; readonly seed: number }
export interface ShardRun { readonly code: number | null; readonly stdout: string; readonly stderr: string }
export type ShardRunner = (shard: Shard) => Promise<ShardRun>;
export interface ShardResult {
  readonly shard: Shard; readonly run: ShardRun;
  readonly passed: boolean;            // problem === null && violations === 0
  readonly handsPlayed: number;        // 0 when problem !== null
  readonly violations: number;         // 0 when problem !== null
  readonly violationCounts: Readonly<Record<string, number>>; // {} when problem !== null
  readonly problem: string | null;
}
export interface CombinedReport {
  readonly shards: number; readonly passed: number;
  readonly handsPlayed: number; readonly violations: number;
  readonly violationCounts: Readonly<Record<string, number>>;
}
export function planShards(totalHands: number): Shard[];          // RangeError unless integer 9..1e9
export function shardArgs(shard: Shard): string[];                // ['--hands', H, '--seed', S, '--size', N]
export function shardNodeArgs(shard: Shard): string[];            // ['--import', './tools/playtest/resolve-ts.js', 'tools/playtest/main.ts', ...shardArgs]
export function readShard(shard: Shard, run: ShardRun): ShardResult;
export function combineShards(results: readonly ShardResult[]): CombinedReport;
export function formatMillionReport(totalHands: number, results: readonly ShardResult[]): string;
export function runShards(shards: readonly Shard[], runShard: ShardRunner, concurrency: number): Promise<ShardResult[]>;
export type MillionArgs = { kind: 'run'; hands: number } | { kind: 'help' } | { kind: 'error'; message: string };
export function parseMillionArgs(argv: readonly string[]): MillionArgs;
export const MILLION_USAGE: string;
export function millionMain(argv: readonly string[], io: CliIo, runShard: ShardRunner, concurrency: number): Promise<number>;
```

`tools/playtest/million.ts` (thin, like `main.ts`):
- The repo root is `fileURLToPath(new URL('../..', import.meta.url))`.
- The runner `spawn(process.execPath, shardNodeArgs(shard), { cwd: root, stdio: ['ignore','pipe','pipe'] })`
  collects stdout and stderr as UTF-8 and resolves `{code, stdout, stderr}` on `close`. On a spawn `error` it
  resolves `{code: null, stdout: '', stderr: error.message}`. It never rejects.
- Then `process.exitCode = await millionMain(process.argv.slice(2), io, runner, os.availableParallelism())`.

### Rules and algorithms
- **Plan** (`planShards(t)`): `base = floor(t / 9)`, `extra = t mod 9`. Shard i (1..9) has
  `size = SHARD_SIZES[i-1]`, `hands = base + (i <= extra ? 1 : 0)` and `seed = 1_000_000 + size`.
  - `planShards(1_000_000)` → size 2: 111,112 hands, seed 1000002. Sizes 3..10: 111,111 hands, seeds
    1000003..1000010. The hands sum to 1,000,000.
  - `planShards(900)` → 100 hands per shard. `planShards(10)` → size 2: 2 hands, the rest 1.
- **Read a shard** (`readShard`). Set `problem` by the first rule that fails:
  1. `run.code` is 0 or 1. Otherwise `problem = 'exit code <code>'`, or `'stopped before finishing'` when
     `code` is null.
  2. stdout has exactly one line equal to `Options: --hands H --seed S --size N` (the planned values, nothing
     else). It has a line `Hands played: H` with the planned H and a line `Invariant violations: V`, where V is
     decimal digits. Exit code 0 requires V = 0, and exit code 1 requires V > 0. If V > 0 there must be a line
     `Violations by invariant: ` followed by `id n` pairs joined by `, ` (`id` matches `[a-z0-9-]+`, `n` is
     digits). Otherwise `problem = 'report does not match the shard plan'`.
  - If there is no problem: `handsPlayed = H` and `violations = V`. `violationCounts` comes from the pairs
    line, or is every `INVARIANTS` id → 0 when V = 0 and the line is absent.
  - A shard with any extra option in its Options line (e.g. ` --game sng`) fails rule 2. So only
    default-checker runs of the CLI are accepted.
- **Combine**: `shards = results.length`. `passed` counts results with `passed`. `handsPlayed` and
  `violations` are sums. `violationCounts[id]` is the sum over shards. Key order: every `INVARIANTS` id
  (zero if unseen), then custom ids in first-seen order (shard order, then line order).
  - Example: shard 1 `chips 3`, shard 2 `bet-cap 2, x-test 1` → `chips 3, legal-action 0, bet-cap 2,
    pot-eligibility 0, cards 0, x-test 1`.
- **Report** (`formatMillionReport`). Every line ends in `\n`:
  ```
  TLH Trainer million-hand playtest
  Plan: <T> cash hands over table sizes 2 to 10 in 9 shards, one seed per shard
  Shard <i> of 9: npm run playtest -- --hands <H> --seed <S> --size <N>
  <shard stdout verbatim, plus "\n" if it does not end with one; nothing if empty>
  [only if problem]  Shard <i> failed: <problem>
  [only if problem and stderr non-empty]  Shard <i> stderr:
  [then]  <stderr verbatim, newline-terminated>
  … (shards 1..9 in order)
  Combined report
  Shards passed: <P> of 9
  Hands played: <sum>
  Invariant violations: <sum>
  Violations by invariant: chips <n>, legal-action <n>, bet-cap <n>, pot-eligibility <n>, cards <n>[, <custom> <n>…]
  Result: PASS        (or "Result: FAIL" unless every shard passed)
  ```
  A shard with violations prints its own violation block verbatim. That block has the `Replay:` line and the
  hand's action history (AC#2).
- **runShards**: calls `runShard` for at most `concurrency` shards at a time. When one settles, the next shard
  in index order starts. Results are returned in shard index order whatever order they finish in. A rejected
  runner promise becomes `{code: null, stdout: '', stderr: String(reason)}`. `concurrency` must be an integer
  ≥ 1, otherwise RangeError. If concurrency > number of shards, all start at once.
- **millionMain**:
  - Parse argv. `--help` alone → write `MILLION_USAGE` to `io.out` and return 0.
  - An error → write `<message>\n` + `MILLION_USAGE` to `io.err` and return 2.
  - Otherwise: plan, then `runShards`, then write the report to `io.out`. Return 0 if every shard passed,
    else 1.
- **parseMillionArgs**: only `--hands <digits>` (once) and `--help` (alone). Default hands 1,000,000.
  - `MILLION_USAGE` =
    `Usage: npm run playtest:million -- [--hands <9-1000000000>]\nDefaults: --hands 1000000; cash hands spread over table sizes 2 to 10, one shard per size with seed 1000000 + size\n`.
  - Errors: `Error: unknown option.`, `Error: --hands needs a value.`, `Error: --hands given more than once.`,
    `Error: --hands must be a whole number from 9 to 1000000000.`,
    `Error: --help cannot be combined with other options.` (the same wording style as `cli.ts:73-145`).

### Error handling and configuration
- Exit codes: 0 all shards passed; 1 any violation or failed shard; 2 usage error.
- `planShards` throws `RangeError('Total hands must be a whole number from 9 to 1000000000')`.
- `runShards` throws `RangeError('Concurrency must be a whole number of at least 1')`.
- Workflow `.github/workflows/million.yml` (exact structure; Prettier formatting):
  ```yaml
  name: Million-hand playtest

  on:
    workflow_dispatch:

  permissions:
    contents: read

  jobs:
    million:
      name: 1,000,000 cash hands over table sizes 2 to 10
      runs-on: ubuntu-24.04
      timeout-minutes: 30
      steps:
        - name: Check out
          uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        - name: Set up Node from .nvmrc
          uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
          with:
            node-version-file: .nvmrc
        - name: Million-hand playtest
          run: npm run playtest:million
  ```

## 6. Behaviour specification

### SPEC-01: An on-demand run covers 1,000,000 cash hands over sizes 2–10 with zero violations
- Verifies: AC#1
- Behaviour: Given an on-demand run, When it completes, Then it covers the planned hands over sizes 2–10 with zero violations:
  - Given the default plan, When `planShards(1_000_000)` runs, Then it returns 9 shards with sizes 2..10 in
    order, hands `[111112, 111111 ×8]` summing to 1,000,000, and seeds 1000002..1000010.
  - Given the real tool, When `npm run playtest:million -- --hands 900` runs, Then:
    - it exits 0;
    - stdout has the 9 lines `Shard <i> of 9: npm run playtest -- --hands 100 --seed <1000000+size> --size
      <size>` for sizes 2..10;
    - the combined section reads `Shards passed: 9 of 9`, `Hands played: 900`, `Invariant violations: 0`,
      `Violations by invariant: chips 0, legal-action 0, bet-cap 0, pot-eligibility 0, cards 0` and
      `Result: PASS`.
  - Given no options, When `npm run playtest:million` runs on the reference machine, Then it prints
    `Hands played: 1000000`, `Invariant violations: 0` and `Result: PASS`, and exits 0 (about 7 s locally).
- Verification: acceptance `tests/playtest/million.acceptance.test.ts::an on-demand run spreads cash hands over table sizes 2 to 10 and reports zero violations` and command `npm run playtest:million`

### SPEC-02: The dispatch workflow runs the sharded million-hand run in one bounded job
- Verifies: AC#2
- Behaviour: Given `.github/workflows/million.yml`, When it is read as text, Then:
  - its triggers are exactly `on:\n  workflow_dispatch:\n`, with no `schedule:`, `push:` or `pull_request:`;
  - `permissions` is `contents: read`;
  - it has exactly one job, with `runs-on: ubuntu-24.04` and `timeout-minutes: 30`. That is at most 360, the
    GitHub 6-hour job limit, so every shard (a process inside the job) finishes within it or the job fails;
  - its only `run:` step is `run: npm run playtest:million`;
  - it has no `continue-on-error`, `|| true` or `if:`, so the tool's exit 1 fails the workflow;
  - it uses the same pinned checkout and setup-node SHAs as `ci.yml`;
  - `package.json` script `playtest:million` is
    `node --import ./tools/playtest/resolve-ts.js tools/playtest/million.ts`.

  The live dispatch is proven post-merge in a tracker task (D-4).
- Verification: acceptance `tests/ci/million-workflow.acceptance.test.ts::the million-hand workflow runs on manual dispatch as one bounded job that fails on a non-zero exit`

### SPEC-03: Any shard violation fails the run and prints the replay code and action history
- Verifies: AC#2
- Behaviour: Given `millionMain(['--hands','18'], io, runner, 3)`, where `runner` builds each shard's report
  in-process with `main(shardArgs(shard), io, seams)`:
  - shard 1 (size 2) uses an `onAction` seam that returns `[{invariant:'chips', message:'forced'}]` on every
    action;
  - all other shards use no seams;

  When it runs, Then:
  - it returns 1;
  - the output has the line `Shard 1 of 9: npm run playtest -- --hands 2 --seed 1000002 --size 2` and then
    that shard's report verbatim, including:
    - a line starting `Replay: npm run playtest -- --replay-code `;
    - the line `Hand 1: replay code <code>, button seat 1`;
    - a `Preflop: …` action-history line, with whatever text `formatHand` prints for that hand;
  - the output ends with `Shards passed: 8 of 9`, `Hands played: 18`, `Invariant violations: 2`,
    `Violations by invariant: chips 2, legal-action 0, bet-cap 0, pot-eligibility 0, cards 0` and
    `Result: FAIL`.

  The test asserts the Replay and `Hand 1:` lines and the presence of a `Preflop:` line. It does not assert
  the exact Preflop text.
- Verification: acceptance `tests/playtest/million.acceptance.test.ts::a shard violation fails the run and prints that shard's replay code and action history`

### SPEC-04: A crashed, killed or mismatched shard fails the run
- Verifies: AC#2
- Behaviour: Given a shard that did not finish cleanly, When the run combines results, Then it fails:
  - Given a runner whose shard 4 resolves `{code: null, stdout: '', stderr: 'boom'}`, When `millionMain` runs
    `--hands 9`, Then it returns 1, the output has `Shard 4 failed: stopped before finishing`,
    `Shard 4 stderr:`, `boom`, `Shards passed: 8 of 9`, `Hands played: 8` and `Result: FAIL`.
  - A rejected runner promise behaves the same way, with stderr equal to `String(reason)`.
  - Exit code 3 → `Shard <i> failed: exit code 3`.
  - Exit 0 with a report whose Options line has ` --game sng`, or whose `Hands played` differs from the plan,
    or exit 0 with `Invariant violations: 1` → `Shard <i> failed: report does not match the shard plan`.
- Verification: unit `tests/playtest/shards.test.ts::a failed or mismatched shard fails the run`

### SPEC-05: Re-running a shard with the same seed and options is byte-identical
- Verifies: AC#3
- Behaviour: Given the same shard seed and options, When re-run, Then output is byte-identical:
  - Given the shard `npm run playtest -- --hands 2000 --seed 1000009 --size 9`, When it runs twice, Then the
    two stdouts are byte-identical and both exit 0.
  - Given `npm run playtest:million -- --hands 900`, When it runs twice, Then the two stdouts are
    byte-identical. The block after `Shard 8 of 9: npm run playtest -- --hands 100 --seed 1000009 --size 9`
    and before `Shard 9 of 9:` equals the stdout of running that command directly.
- Verification: acceptance `tests/playtest/million.acceptance.test.ts::re-running a shard with the same seed and options gives byte-identical output`

### SPEC-06: 100,000 6-max hands finish within 60 minutes
- Verifies: AC#4, DoD#1
- Behaviour: Given the reference machine, When the 100,000-hand 6-max playtest runs, Then it finishes within 60 minutes:
  - Given the repo, When `npm run playtest -- --hands 100000 --size 6` is spawned, Then it exits 0 within
    3,600,000 ms of wall time, and stdout has `Hands played: 100000` and `Invariant violations: 0`.
    - The child timeout is 3,600,000 ms; the vitest test timeout is 3,660,000 ms.
    - Measured at spec time: 4.75 s on an Apple M4 Pro with Node 22.18.0.
  - The builder re-measures with `time npm run playtest -- --hands 100000 --size 6`. The timing (machine, Node
    version, real seconds) goes in the task's implementation notes and the README Speed targets section
    (DoD#1).
- Verification: acceptance `tests/playtest/throughput.acceptance.test.ts::100,000 6-max hands finish within 60 minutes with zero violations`

### SPEC-07: Combined counts are summed per invariant and every shard uses the default checker
- Verifies: AC#5
- Behaviour: Given shards with violations, When combined, Then counts are summed per invariant and only default-checker shards are accepted:
  - Given shard results with `Violations by invariant: chips 3, legal-action 0, bet-cap 0, pot-eligibility 0,
    cards 0` and `chips 0, legal-action 0, bet-cap 2, pot-eligibility 0, cards 0, x-test 1`, and seven clean
    shards, When combined, Then `violationCounts` is `{chips: 3, 'legal-action': 0, 'bet-cap': 2,
    'pot-eligibility': 0, cards: 0, 'x-test': 1}` in that key order. The report line is
    `Violations by invariant: chips 3, legal-action 0, bet-cap 2, pot-eligibility 0, cards 0, x-test 1`. The
    clean shards' reports come from `main` with no seams; the violating ones come from `main` with seams.
  - Every shard's child argv is exactly
    `['--import', './tools/playtest/resolve-ts.js', 'tools/playtest/main.ts', '--hands', H, '--seed', S,
    '--size', N]`. That is the `npm run playtest` entry, which passes no seams, so the default `checkStep` is
    used.
  - The real tool's shard sections equal direct `npm run playtest` runs (SPEC-05).
  - A report whose Options line carries any other option is rejected (SPEC-04).
- Verification: acceptance `tests/playtest/million.acceptance.test.ts::combined violation counts are summed per invariant across shards that each use the default checker`

### SPEC-08: Plan, argument and concurrency edges
- Verifies: AC#1, AC#5
- Behaviour: Given edge inputs to the plan, arguments and runner, When called, Then they behave as follows:
  - `planShards(10)` gives hands `[2,1,1,1,1,1,1,1,1]`. `planShards(8)`, `planShards(9.5)` and
    `planShards(1_000_000_001)` throw the RangeError from §5.
  - `parseMillionArgs`:
    - `[]` → hands 1,000,000;
    - `['--hands','9']` → 9;
    - `['--hands','8']`, `['--hands','1e6']` and `['--hands','-5']` → the `--hands must be…` error;
    - `['--seed','1']` → `Error: unknown option.`;
    - `['--hands']` → `Error: --hands needs a value.`;
    - `--hands` twice → `Error: --hands given more than once.`;
    - `['--help','--hands','9']` → `Error: --help cannot be combined with other options.`
  - `millionMain(['--help'])` writes `MILLION_USAGE` to out and returns 0. A usage error writes to err and
    returns 2 without calling the runner.
  - `runShards` with concurrency 2:
    - never has more than 2 runner calls pending;
    - starts shards in index order;
    - returns results in index order when the runner settles them in reverse order;
    - concurrency 0 throws.
  - `shardNodeArgs` returns the exact argv in SPEC-07.
- Verification: unit `tests/playtest/shards.test.ts::plan, arguments and concurrency`

### SPEC-09: Checks, coverage, headless boundary and the 10,000-hand playtest stay green
- Verifies: DoD#2, DoD#3, DoD#5, DoD#6, DoD#7, DoD#11
- Behaviour: Given the change:
  - When lint, typecheck and tests run, Then each exits 0, and coverage holds (`src/playtest/**` ≥ 90% lines,
    overall ≥ 70%).
  - `src/playtest/shards.ts` imports nothing from `src/ui`, React or browser APIs (headless-boundary lint).
  - `npm run playtest -- --hands 10000 --seed 42` exits 0 with `Invariant violations: 0`, and its output is
    unchanged from the TASK-1.16 baseline (no engine change).
  - CI on `doit/TASK-1.17` is green.
- Verification: command `npm run lint && npm run typecheck && npm test && npm run playtest -- --hands 10000 --seed 42`

### SPEC-10: Story documentation and N/A DoD items
- Verifies: DoD#4, DoD#8, DoD#9, DoD#10, DoD#12, DoD#13
- Behaviour: Given the task is done, Then:
  - the README documents `npm run playtest:million`, the dispatch-only workflow
    (`gh workflow run million.yml --ref main`), the shard plan and seeds (A-1, A-2), the exit codes, and the
    100,000-hand timing;
  - a Backlog doc for TASK-1.17 records the design (D-1..D-5, A-1..A-9), the full local 1,000,000-hand
    combined report, the timing, the Actions-minutes estimate (§9) and the post-merge tracker for the live
    dispatch.
  - N/A items, recorded in the doc:
    - DoD#4: no golden-spot suite yet.
    - DoD#8: no screen.
    - DoD#9: headless tooling, no network requests from the app.
    - DoD#10: no strategy content.
    - DoD#13: no screen and no service worker.
- Verification: manual `backlog doc list --plain` shows the TASK-1.17 doc, and the README diff has the new
  sections

## 7. Edge cases
- Total not divisible by 9: SPEC-01 and SPEC-08 (leftover to the smallest sizes).
- Fewer than 9 hands, a non-integer, or over the maximum: SPEC-08.
- A shard crashes, is killed (timeout/OOM: code null), fails to spawn, or exits with an unexpected code:
  SPEC-04.
- A shard report that doesn't match its plan, e.g. a non-default option or a wrong hand count: SPEC-04,
  SPEC-07.
- Several shards violate, or there are custom invariant ids: SPEC-07.
- Shards finish out of order, or concurrency is above or below the shard count: SPEC-08.
- Job hang: `timeout-minutes: 30` fails the job (SPEC-02).
- Interruption of the local run (Ctrl-C): children share the terminal's process group and get the signal too.
  No persistence, so nothing to clean up. N/A beyond that.
- Permissions: workflow `contents: read` only (SPEC-02).

## 8. Security considerations
- Trust boundary: `playtest:million` argv. Only `--hands` with strict digits and bounds, and `--help`. Bad
  values are never echoed.
- Child processes run `process.execPath` with a fixed argv array (no shell, no string interpolation). Shard
  values are integers from `planShards`.
- Workflow: `workflow_dispatch` with no inputs, so no injection surface. `permissions: contents: read`. No
  secrets. Actions are pinned to full SHAs, the same as `ci.yml`.
- No new dependency or network request. Randomness stays seeded from replay codes (REQ-028.1). Fixed shard
  seeds are intended (determinism, REQ-062.4).

## 9. Non-functional
- Throughput (AC#4): 100,000 6-max hands ≤ 60 min on the reference machine. Measured 4.75 s.
- Full local run: ~7 s wall on 14 cores (measured with the planned shards). ~50 s CPU in total.
- Actions minutes (estimate):
  - A GitHub-hosted private-repo `ubuntu-24.04` runner has 2 vCPU. Expect ~1–2 min for the shards plus
    ~20–30 s setup, so ~2–3 billed minutes per dispatch.
  - Dispatch-only means 0 minutes/month unless triggered. A few dispatches a month is < 15 min, under 1% of
    the 2,000 free minutes, at $0.
  - For comparison: nightly would be ~60–90 min/month, and a 9-job matrix ~10–20 min per run.
  - `ci.yml` is unchanged. The AC#4 test adds ~10–15 s of test time per push (A-9).
- Determinism (REQ-062.4): SPEC-05.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest:million`
- New tests (path → SPEC ids):
  - `tests/playtest/million.acceptance.test.ts` → SPEC-01, SPEC-03, SPEC-05, SPEC-07 (spawned tests use
    `sandboxEnv()`, `REPO_ROOT` and a 120 s timeout)
  - `tests/ci/million-workflow.acceptance.test.ts` → SPEC-02
  - `tests/playtest/throughput.acceptance.test.ts` → SPEC-06
  - `tests/playtest/shards.test.ts` → SPEC-04, SPEC-08
- End-to-end scenario for the Judge:
  1. Run `npm run playtest:million` and check `Shard 1 of 9 … --size 2` through `Shard 9 of 9 … --size 10`,
     `Hands played: 1000000`, `Invariant violations: 0`, `Result: PASS` and exit 0.
  2. Copy one shard header command (e.g. `npm run playtest -- --hands 111111 --seed 1000006 --size 6`), run it
     twice, and diff the outputs: they are identical, and identical to that shard's section.
  3. Run `time npm run playtest -- --hands 100000 --size 6` and check it takes well under 60 min.
  4. Run `npm run playtest:million -- --hands 8` and check the exit code is 2 with the usage text.

## 11. Open questions
- None.

## 12. Clarifications log
See `doit/TASK-1.17/qa.md`.
