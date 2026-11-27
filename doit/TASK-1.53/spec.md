# Spec: TASK-1.53 — Cut CI wall time to about 3.5 minutes: shard E2E and rebalance the sweep shards

Status: READY (approved 2026-11-27)
Task: TASK-1.53 · Parent/epic: TASK-1 · Requirements: n/a (CI infrastructure) · Dream: limit-holdem-trainer

## 1. Summary
On main run 46046670509 the `CI` workflow took 439 s of wall time, and the one E2E job was the whole critical
path: 439 s, of which `npm run e2e` was 378 s for 216 tests × 2 browsers. This task turns the E2E job into a
4-job matrix (Chromium and WebKit, 2 Playwright shards each). It also replaces Vitest's file-count sweep
sharding with a duration-weighted split over 3 shards, so the sweep jobs stay well under the E2E jobs. Every
test still runs, exactly once per browser or shard. The target is a workflow wall time of about 3.5 min
(210 s) on main.

## 2. Scope
- In scope:
  - `.github/workflows/ci.yml`:
    - The `e2e` job becomes a `strategy.matrix` over `project: [chromium, webkit]` × `shard: [1, 2]`.
    - The `sweeps` matrix becomes `shard: [1, 2, 3]`.
    - The job names, the e2e run command, the sweeps run command and the report artifact name change to
      match. Every other step stays the same, with the same pins.
  - A weighted Vitest sequencer, `tools/ci/sweep-shards.ts`, plus a committed weights file,
    `tools/ci/sweep-weights.json`. They are wired into `vite.config.ts` through `test.sequence.sequencer`. The
    sequencer changes only how `--shard` splits files.
  - New tests: `tests/ci/ci-shards.acceptance.test.ts` and `tests/ci/sweep-shards.test.ts`.
  - Cross-story edits to the locked tests that pin the old shape (D-5): `tests/ci/ci-jobs.acceptance.test.ts`,
    `tests/ci/workflow.test.ts` and `tests/ci/branch-protection.acceptance.test.ts`.
  - The README CI section: the jobs table, the artifact sentence, the branch-protection `contexts` and the
    "six"/count wording, plus a short note on how to refresh the weights.
  - Measuring the wall time on push runs of `doit/TASK-1.53`, and the post-merge main measurement (Q-1).
- Not doing:
  - Changing `playwright.config.ts`, including the worker count, `fullyParallel`, retries and `webServer`. Each
    E2E job keeps building and previewing on its own (D-3).
  - Installing only the matrix browser. Every E2E job still runs
    `npx playwright install[-deps] chromium webkit`, because the browser cache key is shared across jobs (D-4).
  - Changing the apt or Playwright cache steps, `tools/ci/*.js`, `visual.yml` or `million.yml`.
  - Changing the `test:unit`, `test:sweeps` or `test:tooling` scripts, or any test file other than the three
    locked CI tests named above. No test or assertion in `e2e/` or the sweep files is removed.
  - Paid or larger runners. New npm dependencies. New third-party actions.
  - Turning on branch protection. `gh api …/branches/main/protection` returns 404 "Branch not protected", so no
    required check can break when a job is renamed.
  - Refreshing the weights automatically from CI logs (see Scope concerns).
- Scope budget: files=10, lines=650   (ci.yml ~±30, vite.config.ts +3, sweep-shards.ts ~80, sweep-weights.json ~230, sweep-shards.test.ts ~90, ci-shards.acceptance.test.ts ~130, ci-jobs.acceptance.test.ts ~±30, workflow.test.ts ±3, branch-protection.acceptance.test.ts ~±15, README ~±25)

### Scope concerns (not solved by this task)
- **Weight drift.** A new sweep file has no weight, so it is counted as the 1 s default (A-3). If several heavy
  sweep files are added, the shards drift apart again. Today the weights are refreshed by hand (README note). A
  follow-up could add a `tools/ci` script that rebuilds `sweep-weights.json` from a CI run log.
- **E2E headroom.** The forecast is about 150–190 s per E2E job: about 60 s of setup and about 95–120 s of tests
  for 108 tests on 2 workers, with WebKit the slower browser. That is close to 210 s. If the branch runs miss
  210 s, the next levers are 3 shards per browser or `--workers` in CI. Both are out of scope here (they change
  the AC's "4 jobs" or `playwright.config.ts`), so they would go to the user as a follow-up.
- **Concurrent cache saves.** All 4 E2E jobs reach `Save apt archive cache` with the same key. Only one can
  create it. On the others, `actions/cache/save` logs a warning ("another job may be creating this cache" or
  "already exists") and the step still succeeds, as it already does today on every warm-month run.

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The sweeps use 3 shards. The AC allows "e.g. 3 shards or duration-based file assignment", and this task uses both | yes | On the measured weights, a duration-balanced 2-way split is ~424 s summed per shard, about 154 s of step time at the observed ~2.75× parallelism. A 3-way split is ~283 s, about 103 s of step time. 3 shards leave headroom under the ~210 s E2E jobs as sweep files grow. Extra jobs are free on this public repo | 2 shards, weighted |
| A-2 | The E2E matrix uses `fail-fast: false`, like the sweeps | yes | One shard failing must not cancel the others. Every test must still run once per browser, and each job's report must be visible | Default `fail-fast: true` |
| A-3 | A sweep file missing from `sweep-weights.json` weighs 1.0 s. A weights entry for a file that no longer exists is ignored | yes | New files must never be dropped or fail the run. 1 s is about the median measured sweep file | Fail when a weight is missing (would break CI on every new sweep file) |
| A-4 | The weights are each file's summed per-test durations, in seconds rounded to 0.1, from the verbose logs of main run 46046670509 (jobs 140667544142 and 140667543813). A file with no printed durations, or one that is wholly skipped, weighs 0. Top entries: `tests/bots/maniac.acceptance.test.ts` 102.5, `tests/advice/determinism.acceptance.test.ts` 50.6, `tests/playtest/check-styles.acceptance.test.ts` 49.6, `tests/playtest/bot-results.acceptance.test.ts` 48.7, `tests/playtest/million-lineups.acceptance.test.ts` 45.7. The total is ~848 s | yes | This is the most recent real CI timing of every sweep file | Local timings (different hardware) |
| A-5 | The report artifact for each E2E job is named `playwright-report-${{ matrix.project }}-${{ matrix.shard }}`. It has the same path (`playwright-report/`), the same `if: failure() && steps.e2e.outcome == 'failure'` and the same 7-day retention | yes | `actions/upload-artifact` v4+ rejects duplicate names within a run. The name tells you which browser and shard failed, and the HTML report inside names the failing test | One merged report (needs a merge job and a blob reporter) |
| A-6 | The wall time of a run is `updatedAt − startedAt` from `gh run view <id> --json startedAt,updatedAt`. A sweep shard's duration is its job's `completedAt − startedAt` | yes | This matches the job timings quoted in the task. The definition is stated so the measurements can be repeated | `createdAt` (includes queueing) |

## 3. Current system
- `.github/workflows/ci.yml:17-82`: a single `e2e` job (`name: E2E (Chromium and WebKit)`). Its steps:
  - Check out, setup-node, the apt timeouts and `npm ci`.
  - The Playwright version and month stamps.
  - The browser cache, keyed only on the OS and the Playwright version (`:45`).
  - The apt archive restore, update, collect and save steps.
  - `npm run e2e` (`id: e2e`, `:73-75`).
  - `Upload Playwright report`, named `playwright-report`, only on failure (`:76-82`).
- `.github/workflows/ci.yml:130-151`: `sweeps` with `fail-fast: false`, `matrix.shard: [1, 2]` and
  `npm run test:sweeps -- --shard=${{ matrix.shard }}/2`.
- `playwright.config.ts:9,16-19`:
  - `fullyParallel: true`, so `--shard` splits by test rather than by file.
  - The `chromium` and `webkit` projects.
  - `webServer` runs `npm run build && npm run preview -- --port 4173 --strictPort` (`:20-25`).
  - Measured locally: `npx playwright test --list --project=chromium` gives 216 tests. `--shard=1/2` gives
    108 and `--shard=2/2` gives 108. So `--list` honours `--shard` and `--project` together.
- `package.json:15`: `test:sweeps` is `vitest run --exclude 'tests/ci/**' --exclude 'tests/git/**'
  --exclude 'tests/toolchain/**' .acceptance.test. .perf.test. .property.test.`. That is 222 files (111 per
  shard on CI).
- `node_modules/vitest/dist/chunks/index.Di8au7q4.js:7791-7802`: Vitest's `BaseSequencer.shard` sorts files by
  the sha1 of their root-relative path and slices them into equal counts. Simulated on the measured weights, the
  default 3-way split gives 237/206/405 s, a 2× imbalance. So `--shard=N/3` alone does not meet AC#1, and the
  split has to be weighted.
- `:6087-6090`: `--shard` calls `config.sequence.sequencer#shard(specs)` once per run, after filtering. It
  throws if `count > specs.length`. `vitest list` does not apply `--shard`: `vitest list --filesOnly
  --shard=1/2 <sweep filters>` printed all 222 files. So the partition test has to call the assignment function
  directly (SPEC-02).
- `vite.config.ts:1-28`: has no `sequence` key, and already imports JSON with `with { type: 'json' }` (`:3`).
- `tsconfig.json:23` includes `tools` and `*.config.ts`, so the new TS file is typechecked and linted.
- `tools/ci/tooling-changed.js:30` already lists `vite.config.ts`, and `tools/` is a trigger. The branch's
  changes therefore run the tooling job, which is where the new `tests/ci` tests live.
- The locked tests that pin the workflow shape (owners from `doit/*/state.json` `locked_tests`):
  - `tests/ci/ci-jobs.acceptance.test.ts` (TASK-1.50, TASK-1.25):
    - `EXPECTED.e2e.name` and `EXPECTED.sweeps.name` (`:58,95`).
    - The sweeps matrix literal (`:139-141`).
    - The sweeps run (`:157-160`), plus `e2e.at(-2)` and `'npm run e2e'` (`:168`).
    - It must change.
  - `tests/ci/workflow.test.ts` (TASK-1.7, 1.8, 1.19, 1.29): `jobCommands.e2e` equals
    `['npm ci', 'npm run e2e']`, and `sweeps` equals `…/2` (`:60,71`). It must change. Its `if:` list (`:97-106`)
    and the 6 job timeouts (`:129,216`) stay valid with a matrix.
  - `tests/ci/branch-protection.acceptance.test.ts` (TASK-1.50, TASK-1.24): the contexts list and the
    `matrix.shard` → `[1, 2]` expansion (`:20-33`), checked against README. It must change.
  - `tests/ci/apt-archives-cache.test.ts` (TASK-1.39, 1.47) and `tests/ci/apt-network.test.ts` (TASK-1.30) look
    steps up by name, first match. They stay valid because the matrix keeps one copy of each step. No edit.
  - `tests/toolchain/test-groups.acceptance.test.ts` (TASK-1.50) checks the `test:*` scripts and `npm run
    test:unit` placement. The scripts are unchanged, so no edit.
- Baseline timings (main run 46046670509):
  - Lint/typecheck/build/playtest: 62 s. Unit + coverage: 75 s. Tooling (when it runs): ~52–66 s after the
    ~16 s `changes` job.
  - Sweep shard 1: 147 s. Sweep shard 2: 212 s, of which the step is 194 s for 534 s of summed test time (about
    2.75× parallel) and setup is ~15 s.
  - E2E: 439 s, of which the step is 378 s and setup ~60 s (`Install Playwright system dependencies` alone is
    ~23 s).
- Existing code to reuse:
  - `tests/ci/ci-jobs.acceptance.test.ts:24-49`: `jobsOf` / `headerValue` / `runOf` YAML-text helpers. Copy the
    pattern into the new acceptance test. Do not import from a locked test.
  - `tests/toolchain/test-groups.acceptance.test.ts:28-52`: the `listFiles` pattern (`runProcessGroup` +
    `sandboxEnv()`, `NO_COLOR`, strip `FORCE_COLOR`) for `vitest list --filesOnly` with the `test:sweeps`
    filter args. Use the same pattern for `npx playwright test --list`.
  - `tests/support/sandbox.ts`: `REPO_ROOT`, `sandboxEnv`, `TOOLCHAIN_TIMEOUT_MS`.
  - `tests/support/process-group.ts`: `runProcessGroup`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | E2E shards with one matrix job, `e2e`: `project: [chromium, webkit]` × `shard: [1, 2]`. It runs `npm run e2e -- --project=${{ matrix.project }} --shard=${{ matrix.shard }}/2` | 4 hand-written jobs; one job per browser with `--workers` | A matrix keeps one copy of every step. The locked step-by-name tests and `apt-network.test.ts`'s text-position check stay valid, and there is no duplicated YAML. Playwright shards after the project filter (verified locally: 108 + 108 = 216) | yes | user (Q-2) |
| D-2 | The sweep shards are assigned by a weighted, longest-processing-time-first greedy (§5 Rules). It runs in a custom Vitest sequencer and uses the committed per-file weights. The CLI stays `--shard=N/3` | An explicit file list per shard in `package.json`; a wrapper script that lists files and passes them as filters; Vitest's cache durations (empty on a fresh runner) | Every file is assigned exactly once by construction, and new files are picked up automatically. The `test:sweeps` script and its locked partition test don't change. Path filters could also substring-match other files | yes | user (Q-2) |
| D-3 | Each E2E job builds and previews the app itself, through `webServer` | Build once in a job and pass `dist/` as an artifact | The build is ~1 s (the `checks` job's Build step). An artifact hand-off would add a job dependency, upload/download steps and a config change | no | n/a |
| D-4 | Each E2E job installs and caches both browsers, unchanged | Install only `matrix.project` | The cache key (`ci.yml:45`) has no browser in it. A WebKit-only save would make a later Chromium job's cache hit miss Chromium. The install commands are pinned by the locked `workflow.test.ts:109-118` | no | n/a |
| D-5 | The three locked CI tests are edited only to pin the new shape: names, matrices, commands and contexts. Every other assertion stays | Leave them and add new tests only (they would fail) | They pin the exact old job shape, so a change in shape has to change them | yes | user (Q-2) |
| D-6 | The new check names are `E2E (${{ matrix.project }}, shard ${{ matrix.shard }} of 2)` (e.g. `E2E (chromium, shard 1 of 2)`) and `Sweep tests (shard ${{ matrix.shard }} of 3)` | `E2E (Chromium 1/2)` via `matrix.include` labels | They mirror the existing sweep-name style. The matrix values are used as is, with no `include` block | yes | user (Q-3) |

## 5. Design

### Files to create / modify
- `.github/workflows/ci.yml` — the e2e matrix, name, run command and artifact name, and the sweeps 3-shard
  matrix, name and command.
- `vite.config.ts` — `test.sequence.sequencer: WeightedSequencer`.
- `tools/ci/sweep-shards.ts` — new: `assignShards`, `DEFAULT_WEIGHT_SECONDS` and the `WeightedSequencer` class.
- `tools/ci/sweep-weights.json` — new: the per-file weights (A-4).
- `tests/ci/sweep-shards.test.ts` — new unit tests (SPEC-04, SPEC-05).
- `tests/ci/ci-shards.acceptance.test.ts` — new acceptance tests (SPEC-01, 02, 03, 06, 07, 08).
- `tests/ci/ci-jobs.acceptance.test.ts` — locked cross-story edit (D-5).
- `tests/ci/workflow.test.ts` — locked cross-story edit (D-5).
- `tests/ci/branch-protection.acceptance.test.ts` — locked cross-story edit (D-5, SPEC-09).
- `README.md` — the CI section (SPEC-09).

### Components, interfaces and data
- `tools/ci/sweep-weights.json`: a flat JSON object. Each key is a repo-relative POSIX path, and each value is a
  number of seconds (≥ 0). Keys are sorted, and the file is Prettier-formatted.
- `tools/ci/sweep-shards.ts`:
  - `export const DEFAULT_WEIGHT_SECONDS = 1;`
  - `export function assignShards(files: readonly string[], weights: Readonly<Record<string, number>>, count: number): string[][]`:
    - Returns `count` arrays. Each array is sorted by path, and together they hold every input path exactly
      once.
    - Throws a `RangeError` if `count` is not an integer ≥ 1.
    - Duplicate input paths are collapsed first.
    - It is pure and deterministic, and doesn't depend on input order.
  - `export class WeightedSequencer` implements Vitest's `TestSequencer`:
    - It takes `constructor(ctx: Vitest)`.
    - `shard(specs)`:
      - Maps each spec to `relative(ctx.config.root, spec.moduleId)` with `/` separators.
      - Calls `assignShards(paths, weights, ctx.config.shard.count)`.
      - Returns the specs whose path is in group `ctx.config.shard.index − 1`, in input order.
    - `sort(specs)` delegates to Vitest's `BaseSequencer#sort`, so the default order (cache-based, failed
      first) is kept for every run. Import it with `await import('vitest/node')` inside `sort`, so that `vite
      build`/`vite dev` loading the config does not pull in `vitest/node`. Use type-only imports for `Vitest`,
      `TestSpecification` and `TestSequencer`.
    - The weights are read with a JSON import (`with { type: 'json' }`).
- `vite.config.ts`: `test: { …, sequence: { sequencer: WeightedSequencer } }`. Nothing else changes.
- `ci.yml` e2e job header:
  ```yaml
    e2e:
      name: E2E (${{ matrix.project }}, shard ${{ matrix.shard }} of 2)
      if: github.event_name != 'schedule'
      runs-on: ubuntu-24.04
      timeout-minutes: 30
      strategy:
        fail-fast: false
        matrix:
          project: [chromium, webkit]
          shard: [1, 2]
  ```
  - The E2E step becomes `run: npm run e2e -- --project=${{ matrix.project }} --shard=${{ matrix.shard }}/2`.
  - The upload step's `name:` becomes `playwright-report-${{ matrix.project }}-${{ matrix.shard }}`.
  - All other e2e steps are byte-identical.
- `ci.yml` sweeps job:
  - `name: Sweep tests (shard ${{ matrix.shard }} of 3)`
  - `shard: [1, 2, 3]`
  - `run: npm run test:sweeps -- --shard=${{ matrix.shard }}/3`
- The job order stays `e2e, checks, coverage, sweeps, changes, tooling`.

### Rules and algorithms
- Weighted LPT greedy in `assignShards`:
  1. `w(f)` is `weights[f]` if it is a finite number ≥ 0. Otherwise it is `DEFAULT_WEIGHT_SECONDS`.
  2. Sort the unique files by `w` descending, then by path ascending (code-unit order).
  3. Keep `count` loads, all 0. Put each file in the group with the smallest load, choosing the lowest index on
     a tie, and add `w(f)` to that load.
  4. Sort each group by path.
- Worked example: the weights are `{a:5, b:4, c:3, d:3}`, `e` is unknown (so 1), and `count = 2`. The order is
  a5, b4, c3, d3, e1.
  - a → group 0 (5).
  - b → group 1 (4).
  - c → group 1 (7).
  - d → group 0 (8).
  - e → group 1 (8).
  - Result: `[["a","d"],["b","c","e"]]`, with loads 8 and 8.
- On the measured weights (222 files), LPT gives ~282.6 s per shard for 3 shards (max/min ≈ 1.00) and 424.0 s for
  2. The biggest single file is 102.5 s, under a third of the total.

### Error handling and configuration
- `RangeError('shard count must be a positive integer')` from `assignShards` for a bad `count`. Vitest itself
  validates `--shard` first and throws when `count > files`, so this is a safety net.
- Missing weights never fail (A-3).
- There are no new environment variables.

## 6. Behaviour specification

### SPEC-01: The sweeps run as 3 shards with the new command and name
- Verifies: AC#1
- Behaviour: Given `ci.yml`, When it is parsed as text, Then:
  - The `sweeps` job header has `strategy:\n      fail-fast: false\n      matrix:\n        shard: [1, 2, 3]\n`.
  - Its name is `Sweep tests (shard ${{ matrix.shard }} of 3)`.
  - Its last step runs exactly `npm run test:sweeps -- --shard=${{ matrix.shard }}/3`.
- Verification: acceptance `tests/ci/ci-shards.acceptance.test.ts::the sweeps run as three weighted shards`

### SPEC-02: The sweep shards run every sweep file exactly once
- Verifies: AC#1
- Behaviour: Given the files that `vitest list --filesOnly <test:sweeps filter args>` prints (today 222), When
  `assignShards(files, weights, 3)` runs, Then:
  - The 3 groups are disjoint.
  - Their union, sorted, equals the listed files.
  - Each group is non-empty.
- Verification: acceptance `tests/ci/ci-shards.acceptance.test.ts::the sweep shards cover every sweep file exactly once`

### SPEC-03: The sweep shards are balanced by duration
- Verifies: AC#1
- Behaviour: Given those files and `tools/ci/sweep-weights.json`, When they are split into 3, Then the largest
  weighted load is ≤ 1.5 × the smallest (expected ≈ 1.0).
- Verification: acceptance `tests/ci/ci-shards.acceptance.test.ts::no sweep shard weighs more than 1.5 times another`

### SPEC-04: Vitest's --shard uses the weighted sequencer
- Verifies: AC#1
- Behaviour: Given the config and the sequencer, Then:
  - Given the default export of `vite.config.ts`, Then `test.sequence.sequencer` is `WeightedSequencer`.
  - Given a `WeightedSequencer` with a fake `ctx` (`config.root='/r'`, `config.shard={index:2,count:2}`) and
    specs with `moduleId` `/r/a`…`/r/e`, When `shard()` is called with the worked-example weights, Then it
    returns exactly the specs for `b`, `c`, `e`.
  - With index 1, it returns `a`, `d`.
- Verification: unit `tests/ci/sweep-shards.test.ts::the sequencer shards specs by weighted assignment`

### SPEC-05: The assignment is deterministic, total and robust
- Verifies: AC#1
- Behaviour: Given `assignShards`, Then:
  - Given the worked example, Then the result is `[["a","d"],["b","c","e"]]`.
  - Given the same files in reversed order, or with a duplicate, Then the result is identical.
  - Given a weight of `-1`, `NaN` or a string, Then it is treated as 1.
  - Given `count` 0, 1.5 or −1, Then it throws a `RangeError`.
  - Given `count` 1, Then it returns all files in a single group.
- Verification: unit `tests/ci/sweep-shards.test.ts::assignShards is a deterministic weighted partition`

### SPEC-06: E2E runs as 4 parallel jobs, 2 shards per browser
- Verifies: AC#2
- Behaviour: Given `ci.yml`, Then:
  - The `e2e` job header contains `strategy:\n      fail-fast: false\n      matrix:\n        project: [chromium, webkit]\n        shard: [1, 2]\n`.
  - Its name is `E2E (${{ matrix.project }}, shard ${{ matrix.shard }} of 2)`.
  - It has no `needs:`.
  - Its `E2E` step (`id: e2e`) runs exactly `npm run e2e -- --project=${{ matrix.project }} --shard=${{ matrix.shard }}/2`.
  - Both install steps still name `chromium webkit`.
  - The project values equal the `name`s of the projects in `playwright.config.ts`.
- Verification: acceptance `tests/ci/ci-shards.acceptance.test.ts::e2e runs as four jobs, two shards per browser`

### SPEC-07: Each browser runs every e2e test exactly once
- Verifies: AC#2
- Behaviour: Given `npx playwright test --list` (each test is listed as `[project] › file:line:col › title`),
  When it runs with `--project=P --shard=1/2` and with `--shard=2/2` for P in {chromium, webkit}, Then:
  - The two shard lists are disjoint.
  - Their union equals the `--project=P` list with no shard (today 216 tests each).
  - Each shard list is non-empty.
- Verification: acceptance `tests/ci/ci-shards.acceptance.test.ts::the e2e shards cover every test once per browser`

### SPEC-08: A failing shard uploads a report that identifies it
- Verifies: AC#2
- Behaviour: Given the `e2e` job's last step, Then it:
  - is `Upload Playwright report` with `if: failure() && steps.e2e.outcome == 'failure'`;
  - uses the pinned `actions/upload-artifact`;
  - has `name: playwright-report-${{ matrix.project }}-${{ matrix.shard }}`, `path: playwright-report/` and
    `retention-days: 7`.

  The `html` reporter stays in `playwright.config.ts`.
- Verification: acceptance `tests/ci/ci-shards.acceptance.test.ts::each e2e shard uploads its own report on failure`

### SPEC-09: The locked shape tests and the README match the new jobs
- Verifies: AC#1, AC#2
- Behaviour: Given the edited tests and README, Then:
  - Given the edited locked tests, When `npm run test:tooling` runs, Then all pass.
  - `branch-protection.acceptance.test.ts` expands the matrix names to exactly these contexts, in this order:
    `E2E (chromium, shard 1 of 2)`, `E2E (chromium, shard 2 of 2)`, `E2E (webkit, shard 1 of 2)`,
    `E2E (webkit, shard 2 of 2)`, `Lint, typecheck, build and playtest`, `Unit tests with coverage`,
    `Sweep tests (shard 1 of 3)`, `Sweep tests (shard 2 of 3)`, `Sweep tests (shard 3 of 3)`, `Tooling tests`.
  - README's branch-protection JSON `contexts` lists exactly those, and its text says "all ten CI checks".
  - README's jobs table describes the e2e matrix and the 3 weighted sweep shards.
  - The artifact sentence names `playwright-report-<project>-<shard>`.
  - A note says how to refresh `tools/ci/sweep-weights.json`.
- Verification: acceptance `tests/ci/branch-protection.acceptance.test.ts::README documents branch protection requiring the CI job`

### SPEC-10: No test or assertion is removed
- Verifies: AC#2
- Behaviour: Given the branch diff against `base_commit` (`fb8706e`), Then:
  - No file under `e2e/` changes.
  - No sweep test file changes.
  - `npx playwright test --list` reports the same total (432 tests in 2 projects today) before and after.
- Verification: command `git diff --stat fb8706e -- e2e/ && git diff --name-only fb8706e -- 'tests/**/*.acceptance.test.*' 'tests/**/*.perf.test.*' 'tests/**/*.property.test.*' 'src/**/*.acceptance.test.*' && npx playwright test --list | tail -1`. The expected output is empty except the ci-shards acceptance file, and `Total: 432 tests in 78 files`.

### SPEC-11: The wall time and shard balance hold on real CI runs
- Verifies: AC#1, AC#3
- Behaviour: Given the final green push run of `doit/TASK-1.53` and a second push run of the same commit, When
  each run's jobs are read (A-6), Then for each run:
  - The wall time is ≤ 210 s (about 3.5 min), and so also under 6 min.
  - The longest sweep shard is ≤ 1.5 × the shortest.
  - There are 4 E2E jobs and 3 sweep jobs, all successful.
  - The 3 sweep logs' `Test Files … (N)` totals sum to the count from SPEC-02.

  After merge, the orchestrator records the same checks for 2 main push runs in TASK-1.53's notes and ticks AC#3 (Q-1). AC#3 stays unticked at Done.
- Verification: manual `gh run view <id> --json startedAt,updatedAt,jobs --jq '{wall: ((.updatedAt|fromdate)-(.startedAt|fromdate)), jobs: [.jobs[]|{name, conclusion, s: ((.completedAt|fromdate)-(.startedAt|fromdate))}]}'` for each run id

## 7. Edge cases
- **A new sweep file with no weight:** it gets the default of 1 s and is still assigned exactly once (SPEC-05,
  SPEC-02).
- **A deleted file still in the weights:** it is ignored, because assignment iterates over the listed files
  only (SPEC-02).
- **Fewer sweep files than shards:** Vitest throws before `shard()` is called. N/A in practice (222 files ≫ 3).
- **An e2e test added to only one project:** SPEC-07 compares per project, so it still runs once in that
  project.
- **One shard failing:** `fail-fast: false` on both matrices lets the others finish (A-2). Only the failing job
  uploads a report, under a unique name (SPEC-08).
- **Concurrent cache saves:** see Scope concerns. Warning only, no failure.
- **The scheduled run:** the `if: github.event_name != 'schedule'` header is kept on both matrix jobs
  (`ci-jobs.acceptance.test.ts` keeps checking it).
- **Port clash:** each matrix job runs on its own runner, so the four `--strictPort 4173` servers never clash.

## 8. Security considerations
- The new `${{ matrix.* }}` expressions in `run:` and `name:` hold only static literals from the workflow
  file, never event data, so there is no injection path.
- `permissions: contents: read` is unchanged.
- There are no new actions (same pins), no new dependencies and no secrets.
- The artifact holds the same Playwright HTML report as today.
- Randomness: N/A.

## 9. Non-functional
- CI wall time: ≤ 210 s per run on push (AC#3), and under 6 min (AC#1). Measured per A-6 on 2 runs.
- Sweep balance: the longest sweep job is ≤ 1.5 × the shortest on CI (AC#1). The weighted loads are ≤ 1.5× in
  SPEC-03.
- Actions minutes: about +3 E2E jobs × ~60 s of setup and +1 sweep job × ~15 s per run. This is free on the
  public repo.
- `vite build` time is unaffected, because `vitest/node` is imported lazily.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run test:tooling && npm run test:sweeps -- --shard=1/3 && npm run e2e -- --project=chromium --shard=1/2`
- New tests:
  - `tests/ci/ci-shards.acceptance.test.ts` → SPEC-01, 02, 03, 06, 07, 08.
  - `tests/ci/sweep-shards.test.ts` → SPEC-04, 05.
  - Edited locked tests: `tests/ci/ci-jobs.acceptance.test.ts`, `tests/ci/workflow.test.ts` and
    `tests/ci/branch-protection.acceptance.test.ts` → SPEC-09.
- End-to-end scenario for the Judge:
  1. Run `npm run test:sweeps -- --shard=N/3` for N = 1, 2, 3 locally. Confirm the `Test Files` totals sum to
     the SPEC-02 count.
  2. Run `npx playwright test --list --project=webkit --shard=2/2`. Confirm 108 tests.
  3. Push the branch. Read 2 green push runs with the SPEC-11 command, and confirm wall ≤ 210 s and the sweep
     ratio ≤ 1.5.

## 11. Open questions
- None. All resolved:
  - Q-1: branch runs now, main runs later. The Judge checks SPEC-11 on 2 pushed `doit/TASK-1.53` runs. AC#3 stays unticked at Done. After merge, the orchestrator records 2 main runs (ids, wall time, sweep ratio) in TASK-1.53's notes and ticks AC#3. There is no separate tracker task. If main is over ~3.5 min, the orchestrator opens a fix story.
  - Q-2: approved as designed (D-1, D-2, D-5, A-1). The three locked tests are unlocked under their owners for the re-pin edits.
  - Q-3: approved. The names are `E2E (chromium, shard 1 of 2)` … `E2E (webkit, shard 2 of 2)` and `Sweep tests (shard 1 of 3)` … `(shard 3 of 3)` (D-6).

## 12. Clarifications log
See `doit/TASK-1.53/qa.md`.
