# TLH Trainer

Texas Limit Hold 'Em Trainer: a strict TypeScript + Vite + React app.

## Setup

Requires Node.js 22.18.0 (pinned in `.nvmrc`; `nvm use` picks it up). Any 22.12+ works.

```sh
npm ci
npx playwright install chromium webkit
```

## Where to keep the repo

The repo must not live in an iCloud-synced folder. With iCloud "Desktop & Documents" sync on,
`~/Desktop` and `~/Documents` are synced, and iCloud drops conflict copies such as `foo 2.ts` or
`src 2` into the working tree. They break typecheck and tests and can end up in commits.

Move the clone to a folder that isn't synced, for example `~/Code`:

```sh
mkdir -p ~/Code
mv ~/Documents/claudeworkspaces/limitholdem ~/Code/limitholdem
```

Then delete any conflict copies listed by `npm run lint` (it fails and names each one). `.gitignore`
also keeps them out of `git add`.

Alternatively, turn off "Desktop & Documents Folders" in System Settings → Apple Account → iCloud →
iCloud Drive.

## Commands

Every check runs with one command and exits non-zero on failure.

| Command                    | What it does                                                                                    |
| -------------------------- | ----------------------------------------------------------------------------------------------- |
| `npm run dev`              | Start the Vite dev server                                                                       |
| `npm run build`            | Build the static app into `dist/`                                                               |
| `npm run preview`          | Serve the built `dist/` locally                                                                 |
| `npm test`                 | Run unit and property tests (Vitest) with coverage thresholds                                   |
| `npm run e2e`              | Build, serve and smoke-test the app in Chromium and WebKit, with an axe scan                    |
| `npm run lint`             | File-sync conflict copy check, ESLint (including the headless-boundary rule) and Prettier check |
| `npm run typecheck`        | TypeScript strict type check                                                                    |
| `npm run format`           | Format all files with Prettier                                                                  |
| `npm run playtest:million` | Play 1,000,000 cash hands over table sizes 2 to 10 in parallel shards and check every invariant |

## Continuous integration

`.github/workflows/ci.yml` runs on every push and every pull request, on Ubuntu with the Node
version from `.nvmrc`, as parallel jobs. Each job has a 30-minute limit (as do the jobs in
`visual.yml` and `million.yml`):

| Job (check name)                                  | What it runs                                                                                                                                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `E2E (Chromium and WebKit)`                       | `npm ci`, the Playwright browser and system dependency installs, then `npm run e2e` in Chromium and WebKit with axe                                                                                                                                         |
| `Lint, typecheck, build and playtest`             | `npm ci`, the two audits (shipped dependencies: no high or critical advisory, `npm audit --omit=dev --audit-level=high`; all dependencies: no high or critical advisory, `npm audit --audit-level=high`), lint, typecheck, build and a 10,000-hand playtest |
| `Unit tests with coverage`                        | `npm run test:unit`, with the coverage thresholds                                                                                                                                                                                                           |
| `Sweep tests (shard 1 of 2)` and `(shard 2 of 2)` | `npm run test:sweeps -- --shard=<n>/2`, without coverage; one shard failing does not cancel the other                                                                                                                                                       |
| `Detect tooling changes`                          | `tools/ci/tooling-changed.js`, which decides whether the tooling tests run                                                                                                                                                                                  |
| `Tooling tests`                                   | `npm run test:tooling`, only when `Detect tooling changes` says so; otherwise it shows as skipped                                                                                                                                                           |

The Vitest suite is split into three groups, each with its own command:

- `npm run test:unit`: every test file that is not in the other two groups. This is the only group
  that measures coverage, and it enforces the thresholds in `vite.config.ts` (70% of lines overall,
  90% in the headless folders) on it alone.
- `npm run test:sweeps`: the `*.acceptance.test.*`, `*.perf.test.*` and `*.property.test.*` files
  outside the tooling folders (the slow bot, engine and playtest sweeps), without coverage.
- `npm run test:tooling`: everything under `tests/ci/`, `tests/git/` and `tests/toolchain/` (the
  tests that spawn CI scripts, git helpers, lint and toolchain processes), without coverage.

Locally, `npm test` still runs the whole suite with coverage and the thresholds.

The tooling tests run only when a push or pull request changes a tooling file: anything under
`tools/`, `.github/`, `tests/ci/`, `tests/git/`, `tests/toolchain/`, `tests/support/` or
`e2e/cards.visual.spec.ts-snapshots/`; `package.json`, `package-lock.json`, `tsconfig.json`,
`eslint.config.js`, `vite.config.ts`, `playwright.config.ts`, `.prettierrc.json`, `.prettierignore`,
`.nvmrc`, `README.md`, `index.html` or `src/engine/bot-random.ts`; or any `*.perf.test.*` file. A push is compared
with the previous push (a new branch with where it left the default branch), and a pull request
with its base. When the detector cannot tell what changed (an unknown event, a missing or unknown
commit, a git error), it runs the tooling tests and prints a warning naming the reason; it never
skips them on doubt. Every day at 06:00 UTC a scheduled run on the default branch runs only
`Detect tooling changes` and `Tooling tests`, so tooling tests skipped on earlier pushes still run
daily.

Any failing check fails the run. The two Playwright install steps run through `tools/ci/retry.js`,
which gives each attempt a 4-minute limit and retries up to 3 attempts in all; if every attempt
fails, the run fails with an error naming the install step. A timed-out attempt's processes are
killed (with `sudo -n kill` for root ones such as apt) before the next attempt starts; if they cannot
be stopped, the run fails at once with an error naming the step. Each attempt first waits up to 150 s,
through `tools/ci/apt-lock.js`, for another apt process to release its lock, and fails with an
error naming the lock if it is never released. If an earlier attempt was killed mid-install and left
dpkg interrupted, the next attempt runs `sudo -n dpkg --configure -a` first (a failure there is a
warning, and the install still runs). The downloaded `.deb` packages are kept in an Actions cache
(keyed on the Playwright version and the month), so a warm-cache install downloads little or
nothing; a cold cache downloads them all as before. After a fresh `apt-get update`,
`tools/ci/apt-archives.js` restores a cached `.deb` only if its sha256 matches the signed apt index
(others are dropped and downloaded again). The cache is rebuilt with only the packages installed at
that exact version and saved straight after the install, before e2e runs. Before any install, CI appends
`tools/ci/apt-network.conf` to `/etc/apt/apt.conf` so apt gives up on a stalled mirror connection
after 15 s and retries it up to 3 times. When e2e fails, the Playwright report
is attached to the run as the `playwright-report` artifact (kept 7 days).

Local equivalent:

```sh
npm audit --omit=dev --audit-level=high && npm audit --audit-level=high && npm run lint && npm run typecheck && npm run build && npm test && npm run e2e
```

### Million-hand playtest

`npm run playtest:million` plays 1,000,000 cash hands with the production engine and bots and
checks every invariant after every action. It splits them into 9 shards, one per table size 2 to
10, each with a fixed seed of 1000000 + table size (1000002 to 1000010). Size 2 gets 111,112 hands
and sizes 3 to 10 get 111,111 each; with `--hands <9-1000000000>`, the hands left over after an
even split go one each to the smallest sizes first. Each shard is a separate
`npm run playtest -- --hands <H> --seed <S> --size <N>` process with the default checker, and the
shards run in parallel, one per CPU core. When they have all finished, the tool prints each shard's
command and its report exactly as written (so any shard can be re-run on its own and gives
byte-identical output), then a combined report: shards passed, hands played, invariant violations
and violations by invariant, summed over the shards, and `Result: PASS` or `Result: FAIL`. A
shard with a violation prints its replay code and the hand's action history in its report. Exit
codes: 0 every shard passed, 1 any violation or a shard that crashed, was killed or printed an
unexpected report, 2 usage error. The full run takes about 8 s on the reference machine.

`.github/workflows/million.yml` runs it in one job (30-minute limit) on manual dispatch only; it
has no schedule. Start it with `gh workflow run million.yml --ref main` (GitHub only dispatches
workflows whose file is on the default branch). A violation or failed shard fails the run.

### Card visual baselines

`.github/workflows/visual.yml` (the `Visual` check) runs on every push and pull request. It runs
the card pixel snapshots (`e2e/cards.visual.spec.ts`) in Chromium and WebKit inside the official
`mcr.microsoft.com/playwright:v<version>-noble` Docker image, where `<version>` is the
`@playwright/test` version in `package-lock.json`. It compares them with the committed
`e2e/cards.visual.spec.ts-snapshots/*-linux.png` baselines. Locally, the visual spec runs only on
macOS (against the `*-darwin.png` baselines); the main CI e2e step skips it. `Visual` is not a
required check for merging.

When a baseline is missing, the run writes it and fails. When the run fails, the Linux baselines
are attached as the `card-visual-baselines` artifact and the Playwright report as
`card-visual-report` (both kept 7 days). To add or refresh the baselines:

1. Once `visual.yml` is on `main`, regenerate them with
   `gh workflow run visual.yml --ref <branch> -f update=true`. Before that, use the failed run.
2. Download them: `gh run download <run-id> -n card-visual-baselines -D <dir>`.
3. Copy the `*-linux.png` files into `e2e/cards.visual.spec.ts-snapshots/` unchanged, then commit
   and push. The next `Visual` run must pass.

When a Dependabot pull request bumps `@playwright/test`, the `Visual` job uses the matching new
Docker image. If the new browsers render the cards differently, `Visual` goes red on that pull
request. Regenerate the baselines on the Dependabot branch with
`gh workflow run visual.yml --ref <branch> -f update=true`, then follow steps 2 and 3 and push the
new `*-linux.png` files to that branch before merging.

### Dependency updates

`.github/dependabot.yml` makes Dependabot open update pull requests every Monday: one grouped pull
request for the SHA-pinned GitHub Actions, one grouped pull request for npm minor and patch
updates, and one pull request per npm major update. CI runs on each of them. Merge them on GitHub,
then run `git pull` before the next local merge.
TypeScript and typescript-eslint are updated together in their own grouped pull request, and major
updates of `@types/node` and `typescript` are ignored, so the types stay on Node 22 and TypeScript
stays within the range typescript-eslint supports.

### Branch protection

This rule makes GitHub block merging a pull request into `main` until all six CI checks have
passed (`Detect tooling changes` is not required: if it fails, `Tooling tests` is skipped and the
run still fails), while the admin can still push to `main` directly. A skipped `Tooling tests`
check counts as passed:

```sh
gh api -X PUT repos/{owner}/{repo}/branches/main/protection --input - <<'JSON'
{
  "required_status_checks": { "strict": false, "contexts": ["E2E (Chromium and WebKit)", "Lint, typecheck, build and playtest", "Unit tests with coverage", "Sweep tests (shard 1 of 2)", "Sweep tests (shard 2 of 2)", "Tooling tests"] },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null
}
JSON
```

Verify it:

```sh
gh api repos/{owner}/{repo}/branches/main/protection --jq '.required_status_checks.contexts'
```

Expected output: the six names above.

While the repository is private on the free plan, both commands fail with HTTP 403 "Upgrade to
GitHub Pro or make this repository public to enable this feature.", so the rule is not applied
yet: run the first command once the repository is public or on GitHub Pro. If a job's `name:` in
`.github/workflows/ci.yml` changes, change its `contexts` entry with it.

### Branch cleanup

After pushing `main`, review the `doit/*` branches already merged into `main`, locally and on
`origin` (a dry run that deletes nothing):

```sh
node tools/git/prune-merged-branches.js
```

Then delete the listed branches locally and on `origin`:

```sh
node tools/git/prune-merged-branches.js --apply
```

The checked-out branch is never deleted, and a branch on `origin` is kept until `origin/main`
contains it.

## Speed targets

The real speed targets are enforced only by these full-speed commands, run on the reference
machine (Apple-silicon Mac, Node 22.18.0) with `CI` unset:

- Hand evaluator: at least 10,000,000 seven-card evals/s and table build at most 50 ms.

  ```sh
  EVALUATOR_MIN_EVALS_PER_SEC=10000000 EVALUATOR_MAX_BUILD_MS=50 npx vitest run tests/engine/hand-evaluator.perf.test.ts
  ```

- Equity: every scenario's p95 within its target at scale 1 (targets listed in the test file).
  Opt-in: plain `npm test` skips it. It runs with `EQUITY_PERF_SCALE` set or under
  `npm run test:slow` (`TLH_SLOW_TESTS=1`, at 20x slack).

  ```sh
  EQUITY_PERF_SCALE=1 npx vitest run tests/advice/equity.perf.test.ts
  ```

  Headroom check: every scenario's p95 within 75% of its target.

  ```sh
  EQUITY_PERF_SCALE=0.75 npx vitest run tests/advice/equity.perf.test.ts
  ```

- Postflop advice: every scenario's p95 within its target at scale 1 (targets listed in the test
  file). Opt-in: plain `npm test` skips it. It runs with `ADVICE_PERF_SCALE` set or under
  `npm run test:slow` (`TLH_SLOW_TESTS=1`, at 20x slack). Headroom check: the 10-seat flop vs 9
  opponents p95 within 75 ms.

  ```sh
  ADVICE_PERF_SCALE=1 npx vitest run tests/advice/postflop.perf.test.ts
  ```

  Headroom check: HU flop facing a bet and the 9-seat flop vs 8 opponents (calling-range spot,
  200 ms target) each within 75% of target.

  ```sh
  ADVICE_PERF_SCALE=1 npx vitest run tests/advice/postflop.perf.test.ts -t headroom
  ```

- Playtest: 100,000 6-max hands in at most 60 minutes. Measured 4.8 s (real) on an Apple M4 Pro
  with Node 22.18.0. The 60-minute check is opt-in: run `npm run test:slow` (it sets
  `TLH_SLOW_TESTS=1`). It is a speed guard, not a real play scenario, so it is kept out of
  `npm test` and every push.

  ```sh
  time npm run playtest -- --hands 100000 --size 6
  ```

- Responsive table: while bots decide in the advice worker, no main-thread task over 100 ms,
  p95 frame time at most 100 ms over 200 samples, and a repaint within 100 ms of a hover or
  resize. These Playwright timing checks are opt-in: run `npm run e2e:slow` (it sets
  `TLH_SLOW_TESTS=1`). Plain `npm run e2e` skips them but still checks that every bot decision
  is served by the worker and matches the headless playtest.

  ```sh
  npm run e2e:slow
  ```

- Rapid pace: at Rapid each bot action shows at most 300 ms after the previous action, at 6
  players and at 10, and 200 hands with a folding user finish in under 60 minutes, counting
  the 1.5 s between hands. These real-time Playwright checks (Chromium only) are opt-in too:
  run `npm run e2e:slow`. Every push still runs two deterministic guards: on a paused clock
  each bot action must appear within 100 ms of fake time (a 400 ms wait is caught), and a
  200-hand model counts the scheduled waits and charges the full 300 ms per bot action.

A local `npm test` keeps only slack checks (at least 1,000,000 evals/s, build at most 500 ms,
equity targets times 20, 2 s per call for the bounded-work equity test). CI (`CI=true`) prints
the measurements but enforces no speed limit; the bounded-work equity test uses a 10 s ceiling
there.

Local limits, including the full-speed commands, are measured in process CPU time, so a busy
machine does not fail them but slower code still does.

## Conventions

- Unit and property tests live in `tests/**` or next to the code as `src/**/*.test.{ts,tsx}`.
  Playwright specs live in `e2e/**/*.spec.ts`.
- `src/engine`, `src/bots`, `src/advice`, `src/stats`, `src/playtest` and `src/table` are
  headless: lint rejects React, DOM, IndexedDB and `src/ui` imports there (see
  `tools/lint/headless-boundary.js`).
- Coverage: at least 90% of lines in the headless folders and 70% overall.
- Accessibility: e2e specs call `expectNoSeriousAxeViolations(page)` from `e2e/support/axe.ts`.
