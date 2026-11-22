# Spec: TASK-1.50 — Cut CI wall time with parallel jobs, single coverage run and change-gated tooling tests

Status: READY (approved 2026-11-22)
Task: TASK-1.50 · Parent/epic: TASK-1 · Requirements: n/a (CI infrastructure) · Dream: limit-holdem-trainer

## 1. Summary
Today's `CI` workflow is one serial job. On main run #164 (run 44977960174) the job took 19 min 26 s, and the
`npm test` step took 869 s of that. This task splits CI into parallel jobs: lint/typecheck/build/playtest, unit
tests with coverage, two no-coverage "sweep" shards, change-gated tooling tests and e2e. Coverage instrumentation
runs once, on the fast unit group. Process-spawning tooling tests run only when tooling files change, or on the
scheduled run. Every job gets a 30-minute limit. Every check that runs today still runs in some job. The target
is a workflow wall time of 5–6 min, with a hard limit of 9 min (half of #164).

## 2. Scope
- In scope:
  - `.github/workflows/ci.yml` is split into the six jobs in §5. The steps and pins are the same as today, and
    a `schedule:` trigger is added.
  - Three new npm scripts (`test:unit`, `test:sweeps`, `test:tooling`) partition the vitest suite. `npm test`
    is unchanged and still runs everything with coverage locally.
  - `tools/ci/tooling-changed.js`: a no-dependency change detector that uses `git diff`.
  - Every job in `ci.yml`, `visual.yml` and `million.yml` gets `timeout-minutes: 30`.
  - The CI section of the README is updated.
  - The locked tests that pin the old one-job layout get cross-story edits (D-6). Edits only strengthen them,
    except the job-timeout value 20 → 30, which AC#5 requires.
  - The live drill on `doit/TASK-1.50` (AC#6) and the wall-time measurement (AC#2).
- Not doing:
  - Paid or larger runners. New third-party actions, including `dorny/paths-filter`. New npm dependencies.
  - Sharding the Playwright e2e suite, or changing `playwright.config.ts` or its worker count.
  - Changing vitest `maxWorkers`, `testTimeout`, the coverage thresholds or `vite.config.ts`.
  - Making any test faster, or moving or renaming test files.
  - Changing `visual.yml` beyond its two `timeout-minutes` values. Changing `million.yml`, which is already 30.
  - Turning on branch protection. The API returns 403 on this private Free-plan repo.
  - Measuring the post-merge wall time on main inside this task (A-2).
- Scope budget: files=13, lines=1000   (ci.yml ~+150/−70, visual.yml ±2, package.json +3, tooling-changed.js ~150, tooling-changed.test.ts ~170, ci-jobs.acceptance.test.ts ~200, test-groups.acceptance.test.ts ~110, workflow.test.ts ~±70, apt-archives-cache.test.ts ±1, branch-protection.acceptance.test.ts ~±12, million-workflow.acceptance.test.ts ±4, tests/support/sandbox.ts ±2, README ~±50)

### Scope concerns (not solved by this task)
- **Actions budget:** `ci.yml` used about 2,680 wall-minutes over 164 runs since 2026-11-18. At this rate that is far above the 2,000 min/month Free-plan allowance. Billing could not be read, because the token lacks the `user` scope (`gh auth refresh -s user`, then `gh api /users/<login>/settings/billing/usage`). This task cuts the billed minutes per run (≈ 20 → ≈ 15–17) but not the number of runs. The AC#2/AC#6 live runs add about 4–5 runs. The user was told when Q-4 was answered.
- The schedule path can't run before merge. Its first nightly run on main is noted in the story doc (A-2).

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The 30-minute job limit applies to every job in every workflow: the six `ci.yml` jobs, both `visual.yml` jobs (now 5 and 15) and `million.yml` (already 30). The 13-minute step limits on the apt/Playwright steps stay | yes | AC#5 says "the CI workflows … a job". A limit only matters when a job hangs | Change only `ci.yml` |
| A-2 | AC#2's wall time is proven on the final green push run of `doit/TASK-1.50`. It is the same workflow and event as main. Because the branch touches `.github/`, the tooling job runs too, which is the worst case. After merge, the orchestrator records the first main run's wall time in the story doc. If that run exceeds 9 min, the orchestrator opens a follow-up task | yes | Main can't be measured before the merge, and the branch run is an upper bound | Hold the task open until after merge |
| A-3 | The tooling trigger list (§5 Rules) goes beyond "tools/, configuration files, .github/". It adds the tooling test folders, `tests/support/**`, `README.md`, the Linux card baselines, `*.perf.test.*` files and `src/engine/bot-random.ts`, because tooling tests read or run each of these (e.g. `tests/ci/branch-protection.acceptance.test.ts:7` reads README, `tests/ci/speed-limits.acceptance.test.ts:5` runs the perf files, `tests/toolchain/bot-determinism.test.ts:100` lints `bot-random.ts`). SPEC-09 guards this list | yes | The extra entries only make the tests run more often. Editing a tooling test must make it run, or the AC#6 drill would be silently skipped | Use the AC's three items only |
| A-4 | `tests/support/**` tests, e.g. `sandbox-timeout.acceptance.test.ts` (16 s), are not gated. They fall into the unit or sweeps group by name | yes | AC#4 names CI scripts, git helpers and lint/toolchain config only | Gate them too |
| A-5 | When the change base can't be determined (unknown event, missing or invalid SHA, a force-push whose old head was not fetched, a git error), the detector decides `tooling=true` and prints a `::warning::` that names the reason | yes | Tooling tests are never skipped on uncertainty (AC#6) | Fail the `changes` job |
| A-6 | For a branch's first push (`before` = 40 zeros), the base is `git merge-base origin/<default branch> <head>` | yes | Every new `doit/*` branch would otherwise always run tooling | Always run on new branches |
| A-7 | `e2e` is the first job in `ci.yml`. The locked `tests/ci/apt-network.test.ts:20-31` checks the first `Bound apt network timeouts` step against the first `Install dependencies` by text position. With `e2e` first, that file needs no edit | yes | Job order in the file has no runtime effect | Edit a sixth locked file |
| A-8 | The sweep shards use `strategy.fail-fast: false` | yes | A failure in one shard shouldn't cancel the other, so each job's own result is visible (AC#6) | Use the default `fail-fast: true` |
| A-9 | AC#1's "story doc" record is §3.1 of this spec, committed in the spec commit before any CI change, then copied verbatim into `doit/TASK-1.50/story-doc.md` | yes | The spec commit comes before the build commits | A separate `docs/` file |
| A-10 | The vitest worker count stays at the default. On the 2-vCPU private-repo runner the 805 s summed per-file time vs 869 s wall suggests one worker | yes | Out of scope, and it changes test timing | Add `--maxWorkers=2` in CI |

## 3. Current system

### 3.1 CI profile before any change (AC#1)
Sources:
- `gh run view 44977960174 --log`: main CI #164, 2026-11-22, the per-test durations of the `npm test` step summed per file.
- Local runs on a 14-core Mac: `npx vitest run --reporter=verbose` with `--coverage`, then with `--coverage.enabled=false`.

**Step times for #164.**
- Job: 19 min 26 s (run created → updated: 1,172 s).
- Test step: 869 s (vitest reports 868.6 s; 161 files passed, 1 skipped).
- E2E: 210 s.
- Setup (checkout, setup-node, `npm ci`): 13 s.
- Lint: 20 s. Typecheck: 9 s. Build: 1 s. Playtest: 3 s.
- Playwright and apt steps: ~39 s.

**Summed per-file test time on CI #164: 805 s.**

| Group | Files | CI s (with coverage) | Share |
|---|---|---|---|
| Bot/engine/playtest sweeps (`tests/{bots,engine,playtest}`) | — | 550 | 68% |
| Process-spawning tooling tests (`tests/{ci,git,toolchain}`) | 30 | 97 | 12% |
| Everything else (advice, ui, table, support, src) | — | 158 | 20% |

**Top files on CI #164 (s, with coverage).**

| File | s |
|---|---|
| `bots/tag-mixing.acceptance` | 131.2 |
| `bots/calling-station.acceptance` | 56.8 |
| `bots/tag.acceptance` | 37.8 |
| `engine/bet-cap.acceptance` | 36.1 |
| `advice/equity.perf` | 36.1 |
| `bots/calling-station` | 34.2 |
| `bots/maniac.acceptance` | 29.9 |
| `engine/side-pots.property` | 29.6 |
| `advice/postflop.perf` | 27.2 |
| `ci/speed-limits.acceptance` | 18.3 |
| `playtest/million.acceptance` | 18.3 |
| `advice/postflop.acceptance` | 17.0 |
| `support/sandbox-timeout.acceptance` | 16.1 |
| `engine/hand-evaluator.perf` | 15.1 |
| `playtest/games.acceptance` | 14.9 |
| `toolchain/boundary` | 14.7 |

**Coverage instrumentation share (local, summed per-file).**
- 353 s with coverage vs 187 s without, so about **47%** of test time is coverage.
- Process CPU: 354 s user vs 182 s.
- Sweeps: 221 → 94 s, a 2.4× slowdown from coverage (`tag-mixing` 4.3×).
- Tooling: 60 → 59 s. Coverage doesn't touch these, because they spawn child processes.

**Projected CI cost after the split (no coverage on sweeps).**
- Sweeps: ≈ 258 s.
- 2 vitest shards: 138 s and 120 s. With 3 shards: 103, 97 and 58 s.
- Unit group with coverage: ≈ 75 s.
- Tooling: ≈ 97 s.
- The critical path becomes e2e at ≈ 4.5 min.

**Coverage on the unit group alone (46 files, measured).**
- Lines: 92.02% global and 97.84% for the headless glob.
- Thresholds: 70% global and 90% headless. Both pass with margin.
- The full suite measures 97.35%.

**Actions usage.**
- `ci.yml`: 164 runs since 2026-11-18, ≈ 2,680 wall-minutes.
- `visual.yml`: 84 runs, ≈ 114 min.
- Billing could not be read: the token lacks the `user` scope.
- See "Scope concerns" in §2.

### 3.2 Relevant code
- `.github/workflows/ci.yml:1-110`: one job, `checks`, named "Lint, typecheck, build, test and e2e".
  - `timeout-minutes: 20` (`:18`).
  - Triggers are `push` and `pull_request` (`:3-5`).
  - Concurrency is `ci-${{ github.event_name }}-${{ github.ref }}`, cancel-in-progress (`:10-12`).
- `package.json:11`: `"test": "vitest run --coverage"`. `vite.config.ts:6-21`: the include globs and the coverage
  thresholds (70% global; 90% for `src/{engine,bots,advice,stats,playtest,table}/**`). Coverage is off unless
  `--coverage` is passed.
- `vitest` 5.1.0 supports `--shard <i>/<n>`, repeatable `--exclude <glob>`, positional path filters and
  `vitest list --filesOnly` (`npx vitest --help`). `vitest list` ignores `--shard`, as measured.
- Measured partition (`vitest list --filesOnly`): 162 files = 46 unit + 86 sweeps + 30 tooling, with no overlap
  and none missing. `--shard=1/2` and `2/2` of the sweeps group run 43 files each (one skipped file in shard 1),
  and both exit 0.
- `tests/support/sandbox.ts:7`: `SandboxScript = 'lint' | 'typecheck' | 'test'`. `runInSandbox` copies
  `CONFIG_FILES` (`:18-27`, including `package.json` and `vite.config.ts`) and runs `npm run <script>`.
  `sandboxEnv()` (`:46`) scrubs `VITEST*`, `NODE_V8_COVERAGE`, `TEST*`.
- `tests/support/process-group.ts`: `runProcessGroup(cmd, args, {cwd, env, timeoutMs})`. Used by
  `tests/ci/speed-limits.acceptance.test.ts:25` to run a nested vitest.
- `tools/ci/apt-archives.js:1-50`: the convention for CI helpers.
  - Header comment with usage, ESM.
  - `node:util` `parseArgs`, a `UsageError` class (exit 2), exported pure functions.
  - `safe()` strips control characters from printed names.
  - A main guarded by `pathToFileURL`.
  - JSDoc types are checked by `tsc` (`tsconfig.json:23` includes `tools`).
- The tooling tests that need the GitHub runner: `tests/ci/apt-network.test.ts:66-81` reads the runner's apt
  config, so the tooling job must run `Bound apt network timeouts` first. `retry.sudo`, `retry.reap` and
  `apt-lock` use `sudo -n` on GitHub Linux.
- Branch protection: `gh api …/branches/main/protection` returns 403 ("Upgrade to GitHub Pro or make this
  repository public"). The README documents it as a manual step (`README.md`, "Branch protection").
- Locked tests that pin the old layout (owner from `doit/*/state.json`):
  - `tests/ci/workflow.test.ts` (TASK-1.7, 1.8, 1.19, 1.29):
    - `:27-33` triggers.
    - `:35-47` the global npm command order.
    - `:49-61` Playtest between `npm test` and e2e.
    - `:63-77` the exact `if:` list.
    - `:89-90`, `:121` and `:177`: `timeout-minutes` 20.
  - `tests/ci/apt-archives-cache.test.ts` (TASK-1.39, 1.47): `:90`, job timeout `'20'`.
  - `tests/ci/branch-protection.acceptance.test.ts` (TASK-1.24): `:11-14`, the only job is `checks`, with
    the old name. README contexts.
  - `tests/ci/million-workflow.acceptance.test.ts` (TASK-1.17): `:34-37`, `ci.yml` has exactly one
    `actions/checkout` pin.
  - These locked tests need no edit if A-7 holds: `tests/ci/apt-network.test.ts` (TASK-1.30),
    `tests/ci/dependabot.acceptance.test.ts`, `tests/ci/speed-limits.acceptance.test.ts`, and
    `tests/toolchain/coverage.test.ts` and `test-command.test.ts` (TASK-1.1). The last two keep `npm test`
    = full suite with thresholds.
- Existing code to reuse:
  - `tools/ci/apt-archives.js` → structure, `UsageError`, `safe()`, main guard (copy the pattern, not the code).
  - `tests/support/process-group.ts` `runProcessGroup` and `tests/support/sandbox.ts` `sandboxEnv`, `runInSandbox`,
    `REPO_ROOT`, `TOOLCHAIN_TIMEOUT_MS` → nested vitest/npm runs in the new tests.
  - `tests/git/prune-merged-branches.acceptance.test.ts` → the temp git repo setup pattern for the detector's tests.
  - Today's e2e step bodies in `ci.yml:43-110` → moved verbatim into the `e2e` job.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Partition the suite into three groups through npm scripts: **unit** (everything not in the other two; coverage on), **sweeps** (`*.acceptance.test.*`, `*.perf.test.*`, `*.property.test.*` outside the tooling folders; no coverage; `--shard i/2` across 2 matrix jobs) and **tooling** (`tests/ci/`, `tests/git/`, `tests/toolchain/`; no coverage). Approved by Q-2 (recommended option). | Split by directory (bots \| engine+playtest \| rest); 3 sweep shards (est. 103/97/58 s, +3 billed min/run); plain `--shard` over the whole suite (coverage can't be run once) | The groups are disjoint and complete by construction, and new files fall into a group automatically. 2 shards keep each at ≈ 2.5 min, under the e2e critical path | yes | user (Q-2, 2026-11-22) |
| D-2 | Coverage is measured once, in the `coverage` job, over the **unit group only**, with the existing `vite.config.ts` thresholds. It measures 92.0% global / 97.8% headless lines, against 97.4% for the full suite. Approved by Q-1 (recommended option). | (b) One job runs all non-tooling tests with coverage: ≈ 12 min, misses the 9-min limit. (c) Each shard writes blob coverage and a merge job enforces it: instruments every shard, against AC#3 | Only (a) meets AC#2 and AC#3 together. The thresholds are unchanged, and a smaller measured set makes them stricter in effect | yes | user (Q-1, 2026-11-22) |
| D-3 | Tooling gating: a `changes` job runs `tools/ci/tooling-changed.js`, which uses `git diff --name-only --no-renames`, with checkout `fetch-depth: 0` and no new action. The `tooling` job has `needs: changes` and `if: needs.changes.outputs.tooling == 'true'`, so it shows as "skipped" when gated off. Approved by Q-3 (recommended option). | `dorny/paths-filter` (a new third-party action); a separate `tooling.yml` with `on.push.paths` (no check appears when skipped; GitHub doesn't run the workflow if a matching file is beyond the first 300 changed files; duplicates the job) | No new dependency. A skipped job is visible in the run. The detector fails safe (A-5) and is unit-tested | yes | user (Q-3, 2026-11-22) |
| D-4 | The schedule is `cron: '0 6 * * *'` (daily, 06:00 UTC, default branch only). On `schedule`, only `changes` and `tooling` run. The other four jobs carry `if: github.event_name != 'schedule'`. ≈ 3 billed min/night ≈ 90 min/month. Approved by Q-4 (recommended option). | Nightly full; weekly full; weekly tooling-only (≈ 13 min/month) | Every push to main already runs everything else. The schedule exists to catch drift in tooling tests that were skipped | yes | user (Q-4, 2026-11-22) |
| D-5 | Job names (check contexts). The README "Branch protection" section lists all six contexts as the required set: `E2E (Chromium and WebKit)`, `Lint, typecheck, build and playtest`, `Unit tests with coverage`, `Sweep tests (shard 1 of 2)`, `Sweep tests (shard 2 of 2)`, `Tooling tests`. There is no aggregate job. `Detect tooling changes` isn't required: when it fails, `Tooling tests` is skipped, and the run still fails. Approved by Q-5 (recommended option). | Aggregate `checks` job with `needs:` everything, `if: always()` and a result check | Protection is not available on this plan (403), so the cheaper option is enough. A gated-off (skipped) job counts as passing for required checks | yes | user (Q-5, 2026-11-22) |
| D-6 | Cross-story edits to 4 locked tests (§5 "Locked-test edits"). Each assertion keeps or tightens its intent. The only value that loosens is the job timeout 20 → 30, which AC#5 requires. `doit.py unlock` is recorded for: TASK-1.7 `tests/ci/workflow.test.ts`; TASK-1.39 `tests/ci/apt-archives-cache.test.ts`; TASK-1.24 `tests/ci/branch-protection.acceptance.test.ts`; TASK-1.17 `tests/ci/million-workflow.acceptance.test.ts`. Approved by Q-6 (recommended option). | Keep one job (fails AC#2); YAML anchors to keep one textual `checkout` (games the text checks) | AC#2 requires several jobs, and those files pin one job. Precedent: TASK-1.47 D-2/D-3 | yes | user (Q-6, 2026-11-22) |
| D-7 | `npm test` stays `vitest run --coverage` (full suite, thresholds). CI no longer calls it, and the three group scripts replace it there | Make `npm test` call the groups | The locked TASK-1.1 `coverage.test.ts` and `test-command.test.ts` pin `npm test`. Locally one command still runs everything | no | n/a |

## 5. Design

### Files to create / modify
- `.github/workflows/ci.yml` — six jobs, schedule trigger, 30-min limits (rewrite)
- `.github/workflows/visual.yml` — `timeout-minutes: 30` on both jobs (A-1)
- `package.json` — scripts `test:unit`, `test:sweeps`, `test:tooling`
- `tools/ci/tooling-changed.js` — change detector (new)
- `tests/ci/tooling-changed.test.ts` — detector tests (new, unit)
- `tests/ci/ci-jobs.acceptance.test.ts` — workflow structure, gating, schedule, timeouts (new, acceptance)
- `tests/toolchain/test-groups.acceptance.test.ts` — partition and coverage-once (new, acceptance)
- `tests/support/sandbox.ts` — widen `SandboxScript` with `'test:unit'`
- `tests/ci/workflow.test.ts` — locked, cross-story edit (D-6)
- `tests/ci/apt-archives-cache.test.ts` — locked, cross-story edit (D-6)
- `tests/ci/branch-protection.acceptance.test.ts` — locked, cross-story edit (D-6)
- `tests/ci/million-workflow.acceptance.test.ts` — locked, cross-story edit (D-6)
- `README.md` — "Continuous integration" section

### Components, interfaces and data

**npm scripts (`package.json`)**, exact text:
```
"test:unit": "vitest run --coverage --exclude 'tests/ci/**' --exclude 'tests/git/**' --exclude 'tests/toolchain/**' --exclude '**/*.acceptance.test.*' --exclude '**/*.perf.test.*' --exclude '**/*.property.test.*'",
"test:sweeps": "vitest run --exclude 'tests/ci/**' --exclude 'tests/git/**' --exclude 'tests/toolchain/**' .acceptance.test. .perf.test. .property.test.",
"test:tooling": "vitest run tests/ci/ tests/git/ tests/toolchain/",
```
Extra arguments pass through after `--`, e.g. `npm run test:sweeps -- --shard=1/2`.

**`ci.yml` layout.** Jobs appear in this order. Every job has `runs-on: ubuntu-24.04` and `timeout-minutes: 30`.
Every `uses:` is pinned to the same SHA as today.

| id | name | needs / if | steps (name → run) |
|---|---|---|---|
| `e2e` | `E2E (Chromium and WebKit)` | `if: github.event_name != 'schedule'` | Today's steps in today's order and bodies, minus the lint/test steps: Check out, Set up Node from .nvmrc, Bound apt network timeouts, Install dependencies (`npm ci`), Read Playwright version, Read month stamp, Cache Playwright browsers, Restore apt archive cache, Update apt index, Restore apt archives, Install Playwright browsers, Install Playwright system dependencies, Collect apt archives, Save apt archive cache, E2E (`npm run e2e`), Upload Playwright report |
| `checks` | `Lint, typecheck, build and playtest` | `if: github.event_name != 'schedule'` | Check out, Set up Node, Install dependencies, Audit shipped dependencies, Audit all dependencies, Lint, Typecheck, Build, Playtest (`npm run playtest -- --hands 10000 --seed 42`) |
| `coverage` | `Unit tests with coverage` | `if: github.event_name != 'schedule'` | Check out, Set up Node, Install dependencies, Test (`npm run test:unit`) |
| `sweeps` | `Sweep tests (shard ${{ matrix.shard }} of 2)` | `if: github.event_name != 'schedule'`; `strategy: {fail-fast: false, matrix: {shard: [1, 2]}}` | Check out, Set up Node, Install dependencies, Sweep tests (`npm run test:sweeps -- --shard=${{ matrix.shard }}/2`) |
| `changes` | `Detect tooling changes` | — ; `outputs: tooling: ${{ steps.detect.outputs.tooling }}` | Check out (`with: fetch-depth: 0`), Set up Node, Detect tooling changes (`id: detect`, see below) |
| `tooling` | `Tooling tests` | `needs: changes`; `if: needs.changes.outputs.tooling == 'true'` | Check out, Set up Node, Bound apt network timeouts, Install dependencies, Tooling tests (`npm run test:tooling`) |

- Triggers: `on:\n  push:\n  pull_request:\n  schedule:\n    - cron: '0 6 * * *'\n`. No path or branch filters.
- `permissions: contents: read` and the concurrency block are unchanged.
- Set up Node is always `node-version-file: .nvmrc`, `cache: npm`.
- Detect step, exactly:
  ```
  env:
    EVENT_NAME: ${{ github.event_name }}
    BASE_SHA: ${{ github.event.pull_request.base.sha || github.event.before }}
    HEAD_SHA: ${{ github.event.pull_request.head.sha || github.sha }}
    DEFAULT_BRANCH: ${{ github.event.repository.default_branch }}
  run: node tools/ci/tooling-changed.js --event "$EVENT_NAME" --base "$BASE_SHA" --head "$HEAD_SHA" --default-branch "$DEFAULT_BRANCH"
  ```
  There is no `${{ }}` inside `run:`, so nothing can be injected through the expression values.
- `if:` lines in file order (the complete list):
  1. `github.event_name != 'schedule'` (e2e)
  2. `steps.playwright-cache.outputs.cache-hit != 'true'`
  3. `steps.playwright-cache.outputs.cache-hit == 'true'`
  4. `failure() && steps.e2e.outcome == 'failure'`
  5. `github.event_name != 'schedule'` ×3 (checks, coverage, sweeps)
  6. `needs.changes.outputs.tooling == 'true'`
- `continue-on-error`, `|| true` and `set +e` stay forbidden.

**`tools/ci/tooling-changed.js`** (ESM, JSDoc-typed, same shape as `apt-archives.js`):
- `export const TOOLING_DIRS`: `['tools/', '.github/', 'tests/ci/', 'tests/git/', 'tests/toolchain/', 'tests/support/', 'e2e/cards.visual.spec.ts-snapshots/']`
- `export const TOOLING_FILES`: `['package.json', 'package-lock.json', 'tsconfig.json', 'eslint.config.js', 'vite.config.ts', 'playwright.config.ts', '.prettierrc.json', '.prettierignore', '.nvmrc', 'README.md', 'src/engine/bot-random.ts']`
- `export function isToolingPath(path: string): boolean` is true when any of these holds:
  - the path starts with a `TOOLING_DIRS` entry;
  - it equals a `TOOLING_FILES` entry;
  - it matches `/\.perf\.test\.[cm]?[jt]sx?$/`.
- `export function decide({ event, base, head, defaultBranch }, git)` returns
  `{ tooling: boolean, reason: string, matched: string[] }`.
  - `git(args: string[]) → { status: number, stdout: string }`. It is injectable for tests, and defaults to `spawnSync('git', args)`.
- CLI flags: `--event <name>` (required), `--base <sha|''>`, `--head <sha>`, `--default-branch <name>`.
- CLI output on stdout:
  - The reason line.
  - Up to 20 matched paths (passed through `safe()`).
  - The final line, `tooling=true` or `tooling=false`.
  - If `GITHUB_OUTPUT` is set, it also appends `tooling=<v>\n` to that file.
- Exit codes:
  - 0: a decision was made, including a fail-safe true.
  - 2: usage error (missing `--event`, unknown flag). Prints `tooling-changed: <message>` on stderr.

### Rules and algorithms
Detector `decide`, in order:
1. `event` ∈ {`schedule`, `workflow_dispatch`} → `tooling=true`, reason `always run on <event>`.
2. `event` ∉ {`push`, `pull_request`} → `true`, `::warning::` reason `unknown event <event>`.
3. `head` must match `/^[0-9a-f]{40}$/`, otherwise → `true` (warning `invalid head`).
4. Pick the base:
   - `push` with `base` = 40 zeros or empty → base = `git merge-base origin/<defaultBranch> <head>`.
     `defaultBranch` must match `/^[\w.\/-]+$/`. If either check fails → `true` (warning).
   - Otherwise `base` must match the SHA regex, and `git cat-file -e <base>^{commit}` must succeed;
     otherwise → `true` (warning `base <sha> not available`).
5. Diff:
   - `push`: `git diff --name-only --no-renames -z <base> <head>`.
   - `pull_request`: `git diff --name-only --no-renames -z <base>...<head>`.
   - Non-zero status → `true` (warning).
6. `matched` = the changed paths with `isToolingPath`. `tooling = matched.length > 0`. The reason is either
   `N tooling file(s) changed` or `no tooling files among M changed file(s)`.

Worked examples:
- A push changing `src/bots/rock.ts` and `tests/bots/rock.test.ts` → false.
- `tools/ci/retry.js` → true. `tests/ci/workflow.test.ts` → true.
- A rename `tools/x.js → src/x.js` → true: `--no-renames` lists the old path.
- `schedule` → true.
- `README.md` only → true.
- `docs/advice/x.md` only → false.

### Error handling and configuration
- The detector never decides `false` on uncertainty (A-5).
- A usage error fails the `changes` job (exit 2). The `tooling` job is then skipped, but the run is red, so the
  failure isn't silent.
- No new environment variables or config files.

### Locked-test edits (D-6; nothing else in these files changes)
- `tests/ci/workflow.test.ts`:
  - `:35-47` becomes per-job exact command lists (the npm `run:` lines in each job, in order):
    - `checks`: `['npm ci', 'npm audit --omit=dev --audit-level=high', 'npm audit --audit-level=critical', 'npm run lint', 'npm run typecheck', 'npm run build', 'npm run playtest -- --hands 10000 --seed 42']`
    - `coverage`: `['npm ci', 'npm run test:unit']`
    - `sweeps`: `['npm ci', 'npm run test:sweeps -- --shard=${{ matrix.shard }}/2']`
    - `tooling`: `['npm ci', 'npm run test:tooling']`
    - `e2e`: `['npm ci', 'npm run e2e']`
  - `:49-61`: the Playtest step body is unchanged, it is the last step of `checks`, and it has no `if:`,
    `continue-on-error` or `|| true`.
  - `:63-77`: the exact `if:` list from §5.
  - `:89-90`, `:121`, `:177`: every `^ {4}timeout-minutes:` is `30`. The step timeout 13 is still below the
    job timeout.
- `tests/ci/apt-archives-cache.test.ts:90`: the job timeout is `'30'`. The step-index checks hold within the
  `e2e` job (the step names are unique in the file).
- `tests/ci/branch-protection.acceptance.test.ts:11-14`:
  - The job ids are exactly `['  e2e:', '  checks:', '  coverage:', '  sweeps:', '  changes:', '  tooling:']`.
  - The README section contains `"contexts": [...]` with the six D-5 names (shards expanded), and the other
    existing README strings.
- `tests/ci/million-workflow.acceptance.test.ts:34-37`: `pinned(ci, action)` has length ≥ 1 and all
  entries are equal, and `pinned(workflow, action)` equals `[fromCi[0]]`.

## 6. Behaviour specification

### SPEC-01: The pre-change CI profile is recorded
- Verifies: AC#1
- Behaviour: Given CI #164 (run 44977960174) and local runs with and without coverage, When the story doc is written, Then it contains §3.1 verbatim: step times, the summed per-file time by group (sweeps 550 s / 68%, tooling 97 s / 12%, other 158 s / 20%), the top 16 files, the coverage share (≈ 47%; sweeps 2.4×), and the projected split. The commit `doit(TASK-1.50): spec` that adds it comes before the first commit that touches `.github/`.
- Verification: manual — `git log --format=%s --reverse <base>..doit/TASK-1.50 -- doit/TASK-1.50/spec.md .github/` lists the spec commit first; `doit/TASK-1.50/story-doc.md` has a "CI profile (before)" section matching §3.1.

### SPEC-02: CI runs as parallel jobs with every existing check kept
- Verifies: AC#2
- Behaviour: Given `ci.yml`, When it is parsed, Then:
  - It has exactly the job ids `e2e, checks, coverage, sweeps, changes, tooling`, in that order.
  - Each job has the name and steps from the §5 table.
  - No job other than `tooling` has `needs:`, so the other jobs start in parallel. `tooling` waits only on `changes`.
  - `sweeps` is a matrix over `shard: [1, 2]` with `fail-fast: false`.
  - Every check from today's job appears in some job: both audits, lint, typecheck, build, playtest, unit/sweeps/tooling tests, e2e, Bound apt network timeouts, the apt cache and Playwright install steps and the report upload.
  - Every `uses:` is pinned to a 40-hex SHA identical to today's pins.
- Verification: acceptance `tests/ci/ci-jobs.acceptance.test.ts::ci.yml runs lint, coverage, two sweep shards, tooling and e2e as parallel jobs that keep every check`

### SPEC-03: The test groups cover every test file exactly once
- Verifies: AC#2, AC#6
- Behaviour: Given the repository's test files, When `vitest list --filesOnly` is run with the arguments of `test:unit`, `test:sweeps` and `test:tooling` (from `package.json`, `vitest run` → `vitest list --filesOnly`, `--coverage` dropped), Then:
  - The three file lists are pairwise disjoint.
  - Their union equals `vitest list --filesOnly` with no arguments.
  - Each list is non-empty.
  - Every file under `tests/ci/`, `tests/git/` and `tests/toolchain/` is in the tooling list.
  - No `*.acceptance.test.*`, `*.perf.test.*` or `*.property.test.*` file is in the unit list.
- Verification: acceptance `tests/toolchain/test-groups.acceptance.test.ts::unit, sweeps and tooling partition every test file exactly once`

### SPEC-04: The live CI run is parallel and within the wall-time limit
- Verifies: AC#2
- Behaviour: Given the final green push run of `ci.yml` on `doit/TASK-1.50`, When its jobs are listed, Then:
  - All seven job runs (the matrix gives 2) conclude `success`.
  - The `Sweep tests (shard 1 of 2)` and `(shard 2 of 2)` logs report `Test Files` counts that sum to the sweeps total.
  - The jobs' start times overlap: every job except `tooling` starts within 2 min of the run's creation.
  - Wall time = max(job `completedAt`) − run `createdAt` ≤ 540 s (hard limit, half of #164). The value is reported against the 5–6 min target.
  - After merge, the first main run's wall time is recorded in the story doc (A-2).
- Verification: manual — `gh run view <run-id> --json createdAt,jobs --jq '{created: .createdAt, jobs: [.jobs[] | {name, conclusion, startedAt, completedAt}]}'` plus `gh run view <run-id> --log | grep "Test Files"`; the run ID is recorded in `doit/TASK-1.50/build-log.md`

### SPEC-05: Coverage is measured once and thresholds stay enforced
- Verifies: AC#3
- Behaviour: Given `package.json` and `ci.yml`, When parsed, Then:
  - `--coverage` appears in `test:unit` only, not in `test:sweeps` or `test:tooling`.
  - The only CI step that runs `test:unit` is `coverage` → `Test`.
  - No CI `run:` line contains `--coverage`, `npm test` or `vitest run --coverage`, other than through `test:unit`.
- Given a sandbox with the project config, an under-covered `src/engine/probe.ts`, and its test `tests/probe.test.ts`, When `npm run test:unit` runs, Then:
  - It exits non-zero.
  - Its output contains `does not meet "src/{engine,bots,advice,stats,playtest,table}/**" threshold (90%)`.
- With a fully covered probe it exits 0.
- Verification: acceptance `tests/toolchain/test-groups.acceptance.test.ts::coverage runs only in test:unit, which enforces the existing thresholds`

### SPEC-06: The sweep shards run without coverage instrumentation on CI
- Verifies: AC#3
- Behaviour: Given the live branch run in SPEC-04, When the `coverage` job log and the two shard logs are read, Then:
  - `coverage` prints `Coverage enabled with v8` and the `Coverage summary`/threshold table.
  - Neither shard log, nor the `tooling` log, contains `Coverage enabled`.
- Verification: manual — `gh run view <run-id> --log | grep -c "Coverage enabled"` per job (expect 1 for `Unit tests with coverage`, 0 elsewhere)

### SPEC-07: Tooling tests run only when tooling changes or on the schedule (wiring)
- Verifies: AC#4
- Behaviour: Given `ci.yml`, When parsed, Then:
  - `on:` contains `push`, `pull_request` and `schedule` with exactly one cron `'0 6 * * *'`, and no path or branch filters.
  - `changes` checks out with `fetch-depth: 0` and runs the exact detect step in §5, with `id: detect`.
  - It exposes `outputs.tooling` from `steps.detect.outputs.tooling`.
  - `tooling` has `needs: changes` and `if: needs.changes.outputs.tooling == 'true'`, and runs `npm run test:tooling` after `Bound apt network timeouts` and `npm ci`.
  - Every other test-running job has `if: github.event_name != 'schedule'` and no other job-level `if:`.
- Verification: acceptance `tests/ci/ci-jobs.acceptance.test.ts::tooling tests are gated on the changes job and always run on the schedule`

### SPEC-08: Detector decisions
- Verifies: AC#4
- Behaviour: Given temporary git repos with an `origin/main`, When `node tools/ci/tooling-changed.js` runs, Then the last stdout line and the `GITHUB_OUTPUT` file are as follows:
  - A push whose `before..head` changes only `src/bots/x.ts` and `tests/bots/x.test.ts` → `tooling=false`.
  - Changes in `tools/ci/x.js` / `.github/workflows/ci.yml` / `package-lock.json` / `tests/ci/x.test.ts` / `README.md` / `tests/engine/x.perf.test.ts` → `tooling=true`, with the path listed.
  - A rename `tools/a.js → src/a.js` → `true`.
  - `--event schedule` with an empty base → `true`, reason `always run on schedule`, and no git call.
  - A push with `before` of 40 zeros diffs against `merge-base origin/main head`: `false` when the branch only touched `src/`.
  - A `pull_request` diffs `base...head`, so main's later tooling commits don't count.
  - An unknown base SHA, a malformed SHA, an unknown event, or a git failure → `true` with a `::warning::` line.
  - A missing `--event` → exit 2 and a `tooling-changed:` message on stderr.
  - A path containing a control character prints with `?`.
  - Exit code 0 in all non-usage cases.
- Verification: unit `tests/ci/tooling-changed.test.ts::decides tooling=true only for tooling changes and fails safe`

### SPEC-09: The trigger list covers every repo file the tooling tests read
- Verifies: AC#4
- Behaviour: Given every `join(REPO_ROOT, '<literal>')` and `readFileSync(... '<literal>')` repo-relative path literal in `tests/ci/**`, `tests/git/**` and `tests/toolchain/**`, plus the `PERF_FILES` in `tests/ci/speed-limits.acceptance.test.ts`, plus `tests/support/sandbox.ts` `CONFIG_FILES`, When each is checked, Then `isToolingPath(path)` is true for every one.
- Verification: unit `tests/ci/tooling-changed.test.ts::every repo file a tooling test reads is a tooling path`

### SPEC-10: Gating on the live runner
- Verifies: AC#4
- Behaviour: Given pushes to `doit/TASK-1.50`, When CI runs, Then:
  - (a) A push whose diff from the previous push touches only `src/` or `tests/` non-tooling files shows `Tooling tests` with conclusion `skipped` and `Detect tooling changes` printing `tooling=false`.
  - (b) A push touching `tools/` or `.github/` shows `Tooling tests` concluding `success`, with its log listing `tests/ci/` files.
  - (c) The schedule path is covered by SPEC-07/08. Its first live run on main after merge is noted in the story doc (A-2).
- Verification: manual — `gh run view <id> --json jobs --jq '.jobs[] | {name, conclusion}'` for both run IDs recorded in `doit/TASK-1.50/build-log.md`

### SPEC-11: Every job's time limit is 30 minutes
- Verifies: AC#5
- Behaviour: Given `.github/workflows/ci.yml`, `visual.yml` and `million.yml`, When parsed, Then:
  - Every job has exactly one job-level `timeout-minutes: 30`: 6 + 2 + 1 = 9 job-level lines at 4-space indent, and every job id has one.
  - The step-level `timeout-minutes: 13` lines are unchanged and below 30.
- Verification: acceptance `tests/ci/ci-jobs.acceptance.test.ts::every job in every workflow has a 30-minute limit`

### SPEC-12: Deliberate failures fail the right job
- Verifies: AC#6
- Behaviour: Given a single drill commit on `doit/TASK-1.50` that breaks exactly one assertion in each of:
  - `tests/table/pace.test.ts` (unit group);
  - a sweeps file that the CI log shows in shard 1 (e.g. `tests/engine/bet-cap.acceptance.test.ts`);
  - a sweeps file in shard 2 (e.g. `tests/playtest/heads-up.acceptance.test.ts`);
  - `tests/ci/retry.test.ts` (tooling);
  When CI finishes, Then:
  - Exactly `Unit tests with coverage`, `Sweep tests (shard 1 of 2)`, `Sweep tests (shard 2 of 2)` and `Tooling tests` conclude `failure`.
  - Each log names only its own broken test (`1 failed`).
  - `Lint, typecheck, build and playtest`, `E2E (Chromium and WebKit)` and `Detect tooling changes` conclude `success`.
  - No job is `skipped` or `cancelled`.
  - A revert commit, pushed only after that run has finished (concurrency cancels in-progress runs), yields an all-green run.
- Verification: manual — the builder runs the drill and records both run IDs in `doit/TASK-1.50/build-log.md`; the judge checks `gh run view <drill-id> --json jobs --jq '.jobs[] | {name, conclusion}'` and `gh run view <drill-id> --log-failed | grep -E "FAIL|failed"`, then the revert run's conclusions

### SPEC-13: Locked CI tests keep their intent after the cross-story edits
- Verifies: AC#2, AC#5
- Behaviour: Given the edits in §5 "Locked-test edits", When the full suite runs, Then:
  - `tests/ci/workflow.test.ts`, `apt-archives-cache.test.ts`, `branch-protection.acceptance.test.ts`, `million-workflow.acceptance.test.ts`, `apt-network.test.ts` and `dependabot.acceptance.test.ts` pass.
  - The diff of each edited file touches only the assertions listed in §5.
- Verification: command `npx vitest run tests/ci/workflow.test.ts tests/ci/apt-archives-cache.test.ts tests/ci/branch-protection.acceptance.test.ts tests/ci/million-workflow.acceptance.test.ts tests/ci/apt-network.test.ts tests/ci/dependabot.acceptance.test.ts`

### SPEC-14: README describes the new CI
- Verifies: AC#2, AC#4
- Behaviour: Given README "Continuous integration", When read, Then it states:
  - The six jobs and what each runs.
  - The three test groups and their local commands (`npm run test:unit|test:sweeps|test:tooling`), and that `npm test` still runs everything with coverage.
  - That coverage is measured only on the unit group.
  - The tooling trigger list and the fail-safe rule.
  - The daily 06:00 UTC schedule and what it runs.
  - The 30-minute job limit.
  - The required contexts (D-5).
- Verification: acceptance `tests/ci/branch-protection.acceptance.test.ts::README documents branch protection requiring the CI job` (edited per D-6) plus manual README review by the judge

## 7. Edge cases
- New branch push (zero `before`): SPEC-08 (merge-base). Force-push with an unreachable `before`: SPEC-08 (fail-safe true).
- Pull request from Dependabot touching `package-lock.json`: tooling runs (SPEC-08).
- Scheduled run: only `changes` + `tooling` run (SPEC-07). The schedule fires on the default branch only.
- A shard getting zero files: impossible with 86 files. vitest would exit 1 ("No test files found"), which isn't silent.
- A new test file anywhere: it falls into the unit or sweeps group by construction (SPEC-03).
- `changes` job failure: the run is red, and `tooling` is skipped visibly (§5 Error handling).
- Concurrency cancel: the drill's revert is pushed after the drill run finishes (SPEC-12).
- More than 300 changed files: not an issue, since the detector diffs locally with no file limit.
- A cache miss for Playwright in `e2e`: unchanged existing behaviour (cold path, ~+30 s).

## 8. Security considerations
- Untrusted input: `github.event.*` values reach the detector only through `env:` and quoted shell variables,
  never `${{ }}` inside `run:`.
- The detector validates SHAs (`/^[0-9a-f]{40}$/`) and the branch name (`/^[\w.\/-]+$/`) before passing
  them to `git` as separate argv entries (no shell).
- Changed file names are printed through `safe()`, so a crafted file name can't inject a workflow command.
  Only `tooling=<bool>` is written to `GITHUB_OUTPUT`.
- `permissions: contents: read` is unchanged. There are no secrets and no new dependencies or actions. All
  pins stay as they are.
- `fetch-depth: 0` only reads history.

## 9. Non-functional

**Wall time.** Hard limit ≤ 540 s on the branch run. The target is 300–360 s.

| Job | Estimate |
|---|---|
| e2e | ≈ 13 s setup + 40 s Playwright/apt + 210 s tests + queue ≈ 4.5–5 min |
| Shards | ≈ 2.5 min |
| Coverage | ≈ 1.5 min |
| Checks | ≈ 1 min |
| Tooling | ≈ 1 min after `changes` (0.5 min) + 2 min |

**Billed minutes.** Each job is rounded up to the whole minute.

| | Billed min per run |
|---|---|
| Today | ≈ 20 |
| After, tooling gated off | ≈ 15: changes 1 + checks 1 + coverage 2 + shards 3+3 + e2e 5 |
| After, tooling on | ≈ 17 |
| Schedule (D-4 recommended) | ≈ 3 per night, ≈ 90 per month |

So billed minutes per run go down. `visual.yml` is unchanged at ≈ 1–2 min per run.

**Local runtime.** `npm test` is unchanged (≈ 47 s on the reference Mac). The new acceptance tests add ≈ 10 s:
three `vitest list` calls and two sandbox runs of `test:unit`.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `node tools/ci/tooling-changed.js --event push --base "$(git rev-parse HEAD~1)" --head "$(git rev-parse HEAD)" --default-branch main` (local); end to end, push `doit/TASK-1.50` and watch `gh run watch`
- New tests:
  - `tests/ci/ci-jobs.acceptance.test.ts` → SPEC-02, SPEC-07, SPEC-11
  - `tests/toolchain/test-groups.acceptance.test.ts` → SPEC-03, SPEC-05
  - `tests/ci/tooling-changed.test.ts` → SPEC-08, SPEC-09
  - Edited locked tests → SPEC-13, SPEC-14
- End-to-end for the Judge:
  1. Confirm SPEC-01 (commit order, story-doc section).
  2. On the final green branch run, check SPEC-04, SPEC-06 and SPEC-10(b): job list, conclusions, overlap, wall time ≤ 540 s, coverage only in one job.
  3. Check the SPEC-10(a) gated-off run and the SPEC-12 drill/revert run IDs from `build-log.md` with `gh run view`. The judge may repeat any drill on the branch (push allowed for `doit/*`), waiting for each run to finish before the next push.
  4. Run `npm test`, `npm run lint` and `npm run typecheck` locally.

## 11. Open questions
- None. Q-1 to Q-6 are answered in `doit/TASK-1.50/qa.md` (all the recommended option, 2026-11-22). Unlocks are recorded under TASK-1.7, TASK-1.39, TASK-1.24 and TASK-1.17.

## 12. Clarifications log
See `doit/TASK-1.50/qa.md`.
