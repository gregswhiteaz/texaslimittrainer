# TASK-1.1: Bootstrap the strict TypeScript project with one-command checks

Status: verified (Judge round 1 PASS); task status and final Done transition are left to finalization · Completed: 2026-11-17 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-0 · Requirements: REQ-057.1, REQ-059.1–.4, REQ-063.1–.4 · Branch: doit/TASK-1.1 (base commit bf27335)

## What was asked
As the project owner, I want a strict TypeScript toolchain where every check runs with one command. Then every later
story can be built and verified the same way, locally and in CI. This is the first story of the project. Language,
toolchain and test harness come first.

Acceptance criteria, in plain language:
1. On a clean checkout after `npm ci`, `npm test` runs the Vitest unit tests and the fast-check property tests and exits 0.
2. `npm run lint` (ESLint plus Prettier) and `npm run typecheck` (`tsc` with `strict: true`) report zero errors.
3. A type error fails `typecheck`. An ESLint or Prettier violation fails `lint`.
4. A module under engine/bots/advice/stats that imports React, a DOM API or IndexedDB fails `lint`, and the error names the forbidden import.
5. Line coverage below 90% in the headless folders, or below 70% overall, fails `npm test`, and the output names the missed threshold.
6. `npm run build` writes the deployable static app to `dist/`.
7. `npm run e2e` smoke-tests the built app in Chromium and WebKit.
8. The smoke test runs an axe scan and passes only when there are zero serious or critical violations. An injected critical violation (an image without alt text) makes `npm run e2e` exit non-zero.

Spec: `doit/TASK-1.1/spec.md` (25 SPEC items, approved 2026-11-17).

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | TypeScript is pinned to `6.0.3`, not npm `latest` (`7.0.2`) | yes | `typescript-eslint@8.73.0` supports only `typescript >=4.8.4 <6.1.0`, so TS 7 would break linting | Use TS 7 without typescript-eslint (loses TS-aware lint), or TS 5.9.3 |
| A-2 | Every dependency version is pinned exactly (`--save-exact`), and `package-lock.json` is committed | yes | Reproducible `npm ci` locally and in CI | Use caret ranges |
| A-3 | `npm run lint` = `eslint . --max-warnings 0 && prettier --check .`. `eslint-config-prettier` turns off ESLint style rules that conflict with Prettier | yes | Prettier's recommended setup. One command runs both tools, and a violation in either exits non-zero | Use `eslint-plugin-prettier` (slower, and Prettier discourages it) |
| A-4 | typescript-eslint uses the non-type-checked `strict` + `stylistic` presets | yes | Lint stays fast, and the boundary property test can lint virtual files. `tsc` strict already covers type safety | Use `strictTypeChecked` (needs projectService, is slower, and breaks virtual-file linting) |
| A-5 | "Browser-only API" means every `globals.browser` name that is not in `globals.node` or `globals.builtin`, plus `localStorage`, `sessionStorage` and `navigator` (1,146 names, computed) | yes | A complete, mechanical definition. Node-safe APIs (`console`, `setTimeout`, `URL`, `crypto`, `structuredClone`, `performance`) stay usable in the engine | Use a hand-written short list (would miss APIs) |
| A-6 | `npm test` always collects coverage (`vitest run --coverage`) | yes | DoD#4 makes the thresholds a standing check, so one command covers both | Add a separate `test:coverage` script |
| A-7 | Placeholder start page shows `<h1>TLH Trainer</h1>` and `<p>Texas Limit Hold 'Em Trainer</p>` on a charcoal theme (`#1e1f22` background, `#f2f2f2` text) | yes | Temporary until the Splash/Home stories. Uses only the product name | Show a blank page |
| A-8 | Unit and property tests live in `tests/**` and as colocated `src/**/*.test.{ts,tsx}` files. Playwright specs live in `e2e/**/*.spec.ts` | yes | Vitest and Playwright do not pick up each other's files | Use a single `tests/` tree |
| A-9 | Prettier uses `singleQuote: true` and `printWidth: 100`, with other options at their defaults | yes | A common TS/React convention | Use Prettier defaults |
| A-10 | `engines.node` = `>=22.12.0` | yes | Vite 8 requires `^20.19.0 \|\| >=22.12.0`. Local Node is 22.18.0 | Use an `.nvmrc` file instead |
| A-11 | `tools/` (the future playtest CLI) is **not** inside the headless boundary | yes | REQ-059.2 names only engine, bots, advice and statistics. The CLI runs in Node | Add `tools/playtest` to `HEADLESS_DIRS` |
| A-12 | (orchestrator, during build) The "fixed" half of SPEC-07 uses `export const x = 1;` instead of the spec's `export const x: number = 1;` | yes | The spec's sample breaks `@typescript-eslint/no-inferrable-types` from the required `stylistic` preset. The test still proves that an ESLint violation fails and fixed code passes | Correct the sample in the spec. The test already matches the corrected form |

## Clarifications and decisions
Questions (from `qa.md`):
- **Q-1 (D-2) Supporting third-party dependencies.** Approve @vitejs/plugin-react, @vitest/coverage-v8, @eslint/js,
  typescript-eslint, eslint-plugin-react-hooks, eslint-config-prettier, globals, @types/react, @types/react-dom and
  @types/node (exact pins)? **Answer: Approve.**
- **Q-2 (D-3) npm audit advisory GHSA-fc5q-39xc-vjpf** (picomatch ReDoS, reached through dev tooling). **Answer: Force-fix
  (downgrade Vitest)**, using npm `overrides` if needed, and report back if there was no clean fix. Q-3 supersedes this answer.
- **Q-3 Audit rule after the force-fix proved impossible.** No patched picomatch exists (the advisory covers `<=4.0.7`,
  which is the latest version). Vite itself depends on picomatch. `npm audit fix --force` (Vitest 3.1.4) produced 18
  advisories, 3 of them critical. **Answer: Shipped deps clean + no critical anywhere.** Keep Vitest 5.1.0. Enforce
  `npm audit --omit=dev --audit-level=high` = 0 and `npm audit --audit-level=critical` = 0. The dev-only high
  picomatch advisory is tolerated until a fix is published.

Decisions (spec section 4):
- **D-1** Stack: strict TypeScript, Vite, React, Vitest, fast-check, Playwright (Chromium + WebKit), @axe-core/playwright, ESLint + Prettier, npm. Approved in the requirements.
- **D-2** The supporting dev dependencies listed in Q-1. The user approved them.
- **D-3** The picomatch advisory is tolerated for dev/build-time packages only, with audit gates SPEC-24 and SPEC-25 (Q-3). Only our own glob patterns reach picomatch, and nothing from it ships in `dist/`.
- **D-4** The headless boundary is enforced with ESLint core rules (`no-restricted-imports`, `no-restricted-globals`, `no-restricted-properties`, `no-restricted-syntax`) scoped to `src/{engine,bots,advice,stats}/**`. They are generated in `tools/lint/headless-boundary.js`, so no extra plugin is needed.
- **D-5** Toolchain failure cases are tested by running the **real npm scripts** in a temp sandbox (copied config, symlinked `node_modules`, probe files). The working tree is never touched.
- **D-6** `npm run e2e` serves the **built** app (`vite preview` on port 4173, `--strictPort`) through the Playwright `webServer`, with `reuseExistingServer: false`.

## What was built
All 26 files are new (greenfield), 4,260 lines in total. Most of the lines are `package-lock.json`.

How it works:
- **Scripts** (`package.json`, `"type": "module"`, `engines.node >=22.12.0`): `dev`, `build`, `preview`, `test`
  (`vitest run --coverage`), `e2e` (Playwright, which builds and then serves via preview), `lint`
  (`eslint . --max-warnings 0 && prettier --check .`), `typecheck` (`tsc -p tsconfig.json`), `format`.
- **TypeScript** (`tsconfig.json`): one strict config (`strict`, `noUncheckedIndexedAccess`, `checkJs`) covering
  `src`, `tests`, `e2e`, `tools` and the config files.
- **Lint** (`eslint.config.js`): @eslint/js recommended, typescript-eslint strict + stylistic, react-hooks for `src/ui`,
  the headless boundary, and eslint-config-prettier last.
- **Headless boundary** (`tools/lint/headless-boundary.js`): exports `HEADLESS_DIRS`, `HEADLESS_FILES`,
  `BROWSER_ONLY_GLOBALS` (1,146 computed names), `FORBIDDEN_IMPORT_PATTERNS` and `headlessBoundaryConfig`. It flags
  React, react-dom, IndexedDB libraries and `src/ui` imports, browser-only globals, `globalThis.<browser API>`, and
  dynamic `import()` in `src/engine`, `src/bots`, `src/advice` and `src/stats`. Messages name the forbidden item and REQ-059.2.
- **Coverage** (`vite.config.ts`): v8 line thresholds of 70% global and 90% for `src/{engine,bots,advice,stats}/**`.
  Tests are discovered in `tests/**` and colocated `src/**`.
- **App shell**: `index.html` (no inline script or style), `src/main.tsx` (mounts `<App />` in StrictMode and throws
  `Missing #root element` if `#root` is absent), `src/ui/App.tsx` (placeholder page), `src/ui/styles.css` (charcoal theme).
- **E2E** (`playwright.config.ts`): Chromium + WebKit at 1280×720, the built app on port 4173, list and HTML reporters
  (the HTML report never auto-opens).
- **Shared axe helper** `e2e/support/axe.ts`, for use in every screen story:
  ```ts
  import { expectNoSeriousAxeViolations } from './support/axe';
  await expectNoSeriousAxeViolations(page); // throws "axe: N serious/critical violation(s)\n- <rule> (<impact>): <help> — <target>"
  ```
- **Sandbox test helper** `tests/support/sandbox.ts`: `runInSandbox(files, script, args?)`, `REPO_ROOT`,
  `TOOLCHAIN_TIMEOUT_MS`. It copies the config into a temp directory, symlinks `node_modules`, writes the probe
  files, runs the npm script with a scrubbed environment, and removes the directory in `finally`.
- **Tests**: `tests/unit/app.test.tsx`; `tests/toolchain/{test-command,typecheck,lint,boundary,boundary.property,coverage,build}.test.ts`;
  `e2e/smoke.spec.ts` (load, axe scan with `E2E_INJECT_A11Y_VIOLATION=1` injection, same-origin requests); `e2e/axe-helper.spec.ts`.
- **Other**: `.prettierrc.json`, `.prettierignore` (skips build output, the lockfile, and the Backlog/doit folders), `README.md`.

Dependencies (exact pins): react / react-dom 19.3.1; typescript 6.0.3, vite 8.3.8, @vitejs/plugin-react 6.3.0,
@types/react / @types/react-dom 19.3.0, @types/node 22.20.5, vitest / @vitest/coverage-v8 5.1.0, fast-check 4.10.2,
@playwright/test 1.65.1, @axe-core/playwright 4.14.0, eslint 10.15.0, @eslint/js 10.0.1, typescript-eslint 8.73.0,
eslint-plugin-react-hooks 7.1.1, eslint-config-prettier 10.1.8, prettier 3.10.1, globals 17.14.0.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1, DoD#1-2 | `npm test` | PASS | 8 files / 15 tests passed, no `ERROR: Coverage`. Reproduced in a clean clone |
| SPEC-02 | AC#1 | `tests/unit/app.test.tsx` | PASS | Exact markup match. Judge page probe in Chromium and WebKit |
| SPEC-03 | AC#1, DoD#3 | `test-command.test.ts` | PASS | Mutation M5 (drop `src/**` discovery) makes it fail |
| SPEC-04 | AC#2 | `npm run lint && npm run typecheck` | PASS | Both exit 0 (1.5 s). Prettier ignores Backlog/doit files |
| SPEC-05 | AC#2-3 | `typecheck.test.ts` (strict) | PASS | Mutation M1 (`strict:false`) makes it fail |
| SPEC-06 | AC#3 | `typecheck.test.ts` (type error) | PASS | TS2322, non-zero exit. Also checked in `e2e/` and `tools/` |
| SPEC-07 | AC#3 | `lint.test.ts` (ESLint) | PASS | Uses the A-12 fixed probe. A warning-only file also fails lint |
| SPEC-08 | AC#3 | `lint.test.ts` (Prettier) | PASS | Mutation M4 (drop prettier from lint) makes it fail |
| SPEC-09 | AC#4, DoD#5 | `boundary.test.ts` | PASS | All 4 folders, 5 messages. Mutation M2 fails all 3 boundary tests |
| SPEC-10 | AC#4 | `boundary.property.test.ts` (fast-check, 200 runs) | PASS | Judge exhaustive probe: 4,584 combinations, 0 misses. Mutation M6 makes it fail |
| SPEC-11 | AC#4 | `boundary.test.ts` (allowed code) | PASS | `src/ui`, `tools/` and look-alike `src/engines/` are not flagged |
| SPEC-12 | AC#4 | `boundary.test.ts` (bypasses) | PASS | `globalThis.*`, `import('react')` and type-only React imports are flagged |
| SPEC-13 | AC#5, DoD#4 | `coverage.test.ts` (90%) | PASS | 88.88% in `src/bots` fails and names the 90% glob. Mutation M3 makes it fail |
| SPEC-14 | AC#5 | `coverage.test.ts` (70%) | PASS | `does not meet global threshold (70%)` |
| SPEC-15 | AC#5 | `coverage.test.ts` (met) | PASS | Exit 0, no coverage error |
| SPEC-16 | AC#6 | `build.test.ts` | PASS | `dist/index.html` plus `/assets/*.js` and `.css` (JS about 220 kB) |
| SPEC-17 | AC#7, DoD#7 | `e2e/smoke.spec.ts` | PASS | 10 passed (Chromium + WebKit), about 4 s |
| SPEC-18 | AC#8 | smoke axe scan | PASS | 0 serious/critical. Judge probe confirms severity filtering |
| SPEC-19 | AC#8 | `e2e/axe-helper.spec.ts` | PASS | Rejects `image-alt (critical)`, resolves for `alt=""` |
| SPEC-20 | AC#8 | `E2E_INJECT_A11Y_VIOLATION=1 npm run e2e` | PASS | Exit 1, `2 failed`, `8 passed`, `image-alt (critical)` |
| SPEC-21 | DoD#8 | smoke same-origin test | PASS | 3 requests, all `http://localhost:4173` |
| SPEC-22 | AC#1,2,6,7, DoD#10 | Clean `git clone` + full chain | PASS | All steps exit 0 in 12.4 s (`spec22-clean-clone.log`) |
| SPEC-23 | DoD#6,9,11,12 | Manual scope review | PASS | No headless code, strategy content or service worker. This document fulfils the Backlog doc part |
| SPEC-24 | DoD#8 | `npm audit --omit=dev --audit-level=high` | PASS | `found 0 vulnerabilities` |
| SPEC-25 | DoD#8 | `npm audit --audit-level=critical` | PASS | Exit 0. 13 high, all in the tolerated picomatch chain |

- Test suite: `npm test`, 8 files and 15 tests passed. Coverage is 100% of lines (only `src/ui/App.tsx` counts today), in 5.3 s (budget 60 s).
- E2E: `npm run e2e`, 10 passed (5 tests × Chromium and WebKit).
- Locked acceptance tests: 9 files hash-locked (`state.json` `locked_tests`). 11 test files were snapshotted with 0 skips.
- Gate run 1 (`gates/build-1.json`): PASS. Test, lint and typecheck passed. The spec was unchanged. Scope came in at
  4,260 lines against a budget of 4,300 and 26 files against 26. There were no files outside the spec, and the tests were locked.
- Judge round 1: **PASS, 25/25 SPEC items** with no blocking findings. Besides the tests, the Judge ran its own probes:
  mutation probes M1-M6 (each guarded config change makes its test fail), the exhaustive boundary check, the dev and
  preview page probes in both browsers, and a busy-port check (`npm run e2e` fails fast when port 4173 is in use).
  The end-to-end scenario steps from spec section 10 (clean clone, lint error for a react import in `src/engine`, type
  error in `src/ui`, injected a11y violation, dev page) are recorded in the round-1 evidence. Note: the
  `end_to_end` field in `judge/verdict-1.json` reads `MISSING`, but `judge/round-1.json` and
  `judge/verification/e2e-scenario.log` contain the scenario runs. This mismatch is in the artifacts, not in the product.
- No judge round failed, so nothing was sent back.

## Review
Round 1, with code and security reviewers: **0 blocking findings.** The security review had no findings. It confirmed
that no shell is used in child processes, that sandbox directories are cleaned up, that all 225 lockfile entries come
from registry.npmjs.org with sha512 integrity, and that the audit gates are met.

### Non-blocking review notes (deliberately not fixed)
- **CR-1-01 (MINOR)** `tests/support/sandbox.ts:72`: if a child process cannot start or hits the 120 s timeout,
  `result.error` is dropped, the exit code becomes -1, and the output can read `nullnull`. Suggested fix:
  `(result.stdout ?? '') + (result.stderr ?? '') + (result.error ? '\n' + String(result.error) : '')`.
- **CR-1-02 (MINOR)** `tests/toolchain/build.test.ts:15`: `npm run build` runs with the Vitest worker's environment
  (`NODE_ENV=test`, `VITEST*`, `NODE_V8_COVERAGE`) and not the scrubbed sandbox environment. Suggested fix: export a
  `cleanEnv()` from the sandbox helper and pass it in.
- **CR-1-03 (NIT)** `tests/support/sandbox.ts:58`: the config-copy loop repeats the "create parent directory, then write"
  logic, and the `node:fs` imports are not sorted.

## How to try it
```sh
npm ci
npx playwright install chromium webkit        # once per machine
npm run lint && npm run typecheck
npm test
npm run build
npm run e2e
E2E_INJECT_A11Y_VIOLATION=1 npm run e2e      # expected to fail with image-alt (critical)
npm run dev                                   # open the URL: "TLH Trainer" on a charcoal page
```
To see the headless boundary at work, create `src/engine/x.ts` containing
`import { useState } from 'react'; export const s = useState;`. Then `npm run lint` fails and names `'react'`.
Delete the file afterwards.

## Run metrics
Questions asked: 3 (Q-1..Q-3) · assumptions logged: 11 in spec (A-1..A-11) + 1 during build (A-12) · review rounds: 1
· judge rounds: 1 (PASS) · gate runs: 1 · send-backs: 0 · escalations: 0 · changed lines: 4,260 in 26 files.

## Known limitations and follow-ups
These are suggestions only. No tasks were created.
- **Vite `base` path for GitHub Pages**: not set here. It belongs to TASK-1.18 (Pages deploy).
- **CI (TASK-1.7)**: the workflow must run `npx playwright install --with-deps chromium webkit` and use Node `>=22.12`
  (Vite 8 and `engines.node`). It only needs to call the existing npm scripts.
- **`tsx`** is not installed. It belongs to TASK-1.6 (playtest CLI).
- **picomatch advisory GHSA-fc5q-39xc-vjpf** (high, dev/build-time only) is tolerated per Q-3. Revisit it when a
  patched picomatch ships, then tighten the all-deps audit to `--audit-level=high`.
- Review notes CR-1-01, CR-1-02 and CR-1-03 (above) are open as cleanup candidates.
- Port 4173 is required for `npm run e2e`. With `--strictPort`, a busy port fails fast and is not handled any other way.
- Out of scope by design: engine/bots/advice/stats code, PWA/service worker (E13), CSP (REQ-058.3), Splash/Home screens. The start page is a placeholder.

## Lessons for the factory (proposals — not applied)
- Spec authors should lint every code sample in the spec against the mandated lint presets before approval. SPEC-07's
  "fixed" sample broke `no-inferrable-types`, which led to assumption A-12.
- Before asking a "force-fix" question about a security advisory, the Spec stage should check whether a patched
  version exists and what `npm audit fix --force` produces. Q-2 had to be superseded by Q-3 once the force-fix proved impossible.
- The Judge's `verdict-*.json` `end_to_end` field should be derived from the round's recorded scenario evidence, so the two artifacts agree.
