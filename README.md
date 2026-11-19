# TLH Trainer

Texas Limit Hold 'Em Trainer: a strict TypeScript + Vite + React app.

## Setup

Requires Node.js 22.18.0 (pinned in `.nvmrc`; `nvm use` picks it up). Any 22.12+ works.

```sh
npm ci
npx playwright install chromium webkit
```

## Commands

Every check runs with one command and exits non-zero on failure.

| Command             | What it does                                                                 |
| ------------------- | ---------------------------------------------------------------------------- |
| `npm run dev`       | Start the Vite dev server                                                    |
| `npm run build`     | Build the static app into `dist/`                                            |
| `npm run preview`   | Serve the built `dist/` locally                                              |
| `npm test`          | Run unit and property tests (Vitest) with coverage thresholds                |
| `npm run e2e`       | Build, serve and smoke-test the app in Chromium and WebKit, with an axe scan |
| `npm run lint`      | ESLint (including the headless-boundary rule) and Prettier check             |
| `npm run typecheck` | TypeScript strict type check                                                 |
| `npm run format`    | Format all files with Prettier                                               |

## Continuous integration

`.github/workflows/ci.yml` runs on every push and every pull request, on Ubuntu with the Node
version from `.nvmrc`:

1. `npm ci`
2. Audit shipped dependencies: no high or critical advisory (`npm audit --omit=dev --audit-level=high`)
3. Audit all dependencies: no critical advisory (`npm audit --audit-level=critical`)
4. Lint, typecheck, build, test, then e2e in Chromium and WebKit with axe

Any failing check fails the run. The two Playwright install steps run through `tools/ci/retry.js`,
which gives each attempt a 4-minute limit and retries up to 3 attempts in all; if every attempt
fails, the run fails with an error naming the install step. A timed-out attempt's processes are
killed (with `sudo -n kill` for root ones such as apt) before the next attempt starts; if they cannot
be stopped, the run fails at once with an error naming the step. Each attempt first waits up to 150 s,
through `tools/ci/apt-lock.js`, for another apt process to release its lock, and fails with an
error naming the lock if it is never released. When e2e fails, the Playwright report
is attached to the run as the `playwright-report` artifact (kept 7 days).

Local equivalent:

```sh
npm audit --omit=dev --audit-level=high && npm audit --audit-level=critical && npm run lint && npm run typecheck && npm run build && npm test && npm run e2e
```

### Dependency updates

`.github/dependabot.yml` makes Dependabot open update pull requests every Monday: one grouped pull
request for the SHA-pinned GitHub Actions, one grouped pull request for npm minor and patch
updates, and one pull request per npm major update. CI runs on each of them. Merge them on GitHub,
then run `git pull` before the next local merge.

### Branch protection

This rule makes GitHub block merging a pull request into `main` until the
`Lint, typecheck, build, test and e2e` check has passed, while the admin can still push to `main`
directly:

```sh
gh api -X PUT repos/{owner}/{repo}/branches/main/protection --input - <<'JSON'
{
  "required_status_checks": { "strict": false, "contexts": ["Lint, typecheck, build, test and e2e"] },
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

Expected output: `["Lint, typecheck, build, test and e2e"]`.

While the repository is private on the free plan, both commands fail with HTTP 403 "Upgrade to
GitHub Pro or make this repository public to enable this feature.", so the rule is not applied
yet: run the first command once the repository is public or on GitHub Pro. If the CI job's `name:`
in `.github/workflows/ci.yml` changes, change the `contexts` entry with it.

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

  ```sh
  EQUITY_PERF_SCALE=1 npx vitest run tests/advice/equity.perf.test.ts
  ```

A local `npm test` keeps only slack checks (at least 1,000,000 evals/s, build at most 500 ms,
equity targets times 20, 2 s per call for the bounded-work equity test). CI (`CI=true`) prints
the measurements but enforces no speed limit; the bounded-work equity test uses a 10 s ceiling
there.

## Conventions

- Unit and property tests live in `tests/**` or next to the code as `src/**/*.test.{ts,tsx}`.
  Playwright specs live in `e2e/**/*.spec.ts`.
- `src/engine`, `src/bots`, `src/advice` and `src/stats` are headless: lint rejects React, DOM,
  IndexedDB and `src/ui` imports there (see `tools/lint/headless-boundary.js`). Lint applies the
  same import and global rules to `src/playtest` and `src/table`.
- Coverage: at least 90% of lines in the headless folders and 70% overall.
- Accessibility: e2e specs call `expectNoSeriousAxeViolations(page)` from `e2e/support/axe.ts`.
