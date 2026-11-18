# TLH Trainer

Texas Limit Hold 'Em Trainer: a strict TypeScript + Vite + React app.

## Setup

Requires Node.js 22.12 or newer.

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

## Conventions

- Unit and property tests live in `tests/**` or next to the code as `src/**/*.test.{ts,tsx}`.
  Playwright specs live in `e2e/**/*.spec.ts`.
- `src/engine`, `src/bots`, `src/advice` and `src/stats` are headless: lint rejects React, DOM,
  IndexedDB and `src/ui` imports there (see `tools/lint/headless-boundary.js`).
- Coverage: at least 90% of lines in the headless folders and 70% overall.
- Accessibility: e2e specs call `expectNoSeriousAxeViolations(page)` from `e2e/support/axe.ts`.
