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
fails, the run fails with an error naming the install step. When e2e fails, the Playwright report
is attached to the run as the `playwright-report` artifact (kept 7 days).

Local equivalent:

```sh
npm audit --omit=dev --audit-level=high && npm audit --audit-level=critical && npm run lint && npm run typecheck && npm run build && npm test && npm run e2e
```

## Conventions

- Unit and property tests live in `tests/**` or next to the code as `src/**/*.test.{ts,tsx}`.
  Playwright specs live in `e2e/**/*.spec.ts`.
- `src/engine`, `src/bots`, `src/advice` and `src/stats` are headless: lint rejects React, DOM,
  IndexedDB and `src/ui` imports there (see `tools/lint/headless-boundary.js`).
- Coverage: at least 90% of lines in the headless folders and 70% overall.
- Accessibility: e2e specs call `expectNoSeriousAxeViolations(page)` from `e2e/support/axe.ts`.
