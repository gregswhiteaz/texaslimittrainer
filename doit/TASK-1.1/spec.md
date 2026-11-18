# Spec: TASK-1.1 — Bootstrap the strict TypeScript project with one-command checks

Status: READY (approved 2026-11-17)
Task: TASK-1.1 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: REQ-057.1, REQ-059.1–.4, REQ-063.1–.4 · Dream: limit-holdem-trainer

## 1. Summary
Set up the greenfield repository as a strict TypeScript + Vite + React project. Each check (`npm test`,
`npm run lint`, `npm run typecheck`, `npm run build`, `npm run e2e`) runs with one command and exits non-zero
on failure. A lint rule stops the headless modules (`src/engine`, `src/bots`, `src/advice`, `src/stats`) from
using React, DOM or IndexedDB code. Vitest enforces coverage thresholds, and Playwright smoke-tests the built
start page in Chromium and WebKit with an axe scan. Every later story builds and verifies the same way, and the
CI story (TASK-1.7) only has to call these scripts.

## 2. Scope
- In scope:
  - `package.json` with scripts `dev`, `build`, `preview`, `test`, `e2e`, `lint`, `typecheck`, `format`; exact-pinned
    dependencies; `package-lock.json`.
  - TypeScript strict config; ESLint flat config with typescript-eslint, react-hooks, eslint-config-prettier, and the
    headless-boundary rule; Prettier config and ignore list.
  - Vite + React app shell: `index.html`, `src/main.tsx`, a placeholder start page `src/ui/App.tsx` and its CSS.
  - Vitest config, with v8 line-coverage thresholds of 90% for the headless folders and 70% overall.
  - Playwright config (Chromium + WebKit, 1280×720, built app served by `vite preview`), a smoke test, the shared
    `expectNoSeriousAxeViolations(page)` helper, and the helper's own tests.
  - Toolchain tests proving each check fails when it should. They run the real npm scripts in a throw-away sandbox
    copy of the config.
  - Short `README.md` listing setup and the commands.
- Not doing:
  - GitHub Actions workflow (TASK-1.7), GitHub Pages deploy and the Vite `base` path (TASK-1.18).
  - Any engine, bot, advice or statistics code. The headless folders are not created. No placeholder `index.ts` files.
  - Playtest CLI or `tsx` dependency (TASK-1.6). PWA plugin, manifest or service worker (E13). CSP (REQ-058.3).
  - Splash/Home screens (REQ-001/REQ-002). The start page is a placeholder.
  - Golden-spot suite (E07), only the test discovery it relies on.
  - Committing Playwright browser binaries. Browsers are installed with `npx playwright install chromium webkit`.
- Scope budget: files=26, lines=4300   (about 3,400 of the lines are the generated `package-lock.json`; prototype measured 3,360)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | TypeScript is pinned to `6.0.3`, not the npm `latest` `7.0.2` | yes | `typescript-eslint@8.73.0` peer range is `typescript >=4.8.4 <6.1.0`. TS 7 would break linting | TS 7 without typescript-eslint (loses TS-aware lint); TS 5.9.3 |
| A-2 | All dependency versions are pinned exactly (`--save-exact`), and `package-lock.json` is committed | yes | Reproducible `npm ci` locally and in CI (REQ-062.4 spirit) | caret ranges |
| A-3 | `npm run lint` = `eslint . --max-warnings 0 && prettier --check .` (ESLint plus the Prettier CLI). `eslint-config-prettier` turns off conflicting ESLint style rules | yes | Prettier's recommended setup. Both tools run with one command, and a violation of either exits non-zero | `eslint-plugin-prettier` (runs Prettier inside ESLint; slower, discouraged by Prettier) |
| A-4 | Non-type-checked typescript-eslint presets `strict` + `stylistic` | yes | Fast lint. Lets the boundary property test lint virtual files through the ESLint API. `tsc` strict already covers type safety | `strictTypeChecked` (needs projectService; slower; virtual-file linting breaks) |
| A-5 | "Browser-only API" = every global in `globals.browser` that is not in `globals.node` or `globals.builtin`, plus `localStorage`, `sessionStorage`, `navigator` (computed list: 1,146 names) | yes | Mechanical, complete definition that keeps Node-safe APIs (`console`, `setTimeout`, `URL`, `crypto`, `structuredClone`, `performance`) usable in the engine | hand-written short list (misses APIs) |
| A-6 | `npm test` always collects coverage (`vitest run --coverage`) | yes | DoD#4 makes the thresholds a standing check, and one command covers both | separate `test:coverage` script |
| A-7 | Placeholder start page text: `<h1>TLH Trainer</h1>` and `<p>Texas Limit Hold 'Em Trainer</p>` on the charcoal theme (`#1e1f22` background, `#f2f2f2` text) | yes | Temporary until the Splash/Home stories. Uses only the product name from the glossary | blank page (axe would flag a missing heading/landmark only as moderate) |
| A-8 | Unit/property tests live in `tests/**` and colocated `src/**/*.test.{ts,tsx}`. Playwright specs live in `e2e/**/*.spec.ts` | yes | Keeps Vitest and Playwright from picking up each other's files | single `tests/` tree |
| A-9 | Prettier style: `singleQuote: true`, `printWidth: 100`, other options default | yes | Common TS/React convention | Prettier defaults |
| A-10 | `engines.node` = `>=22.12.0` | yes | Vite 8 requires `^20.19.0 \|\| >=22.12.0`. Local Node is 22.18.0 | `.nvmrc` file |
| A-11 | `tools/` (future playtest CLI) is **not** in the headless boundary | yes | REQ-059.2 names only engine, bots, advice, statistics. The CLI runs in Node and has no reason to import React | include `tools/playtest` |

## 3. Current system
- Greenfield. The repo has one commit (`bf27335`) containing only `backlog/`, `dreams/`, `reports/`,
  `research_notes/`, `.claude/settings.json`, `CLAUDE.md` and `.gitignore`. There is no source code, `package.json` or prior spec.
- `.gitignore` already ignores `node_modules/`, `dist/`, `coverage/`, `playwright-report/`, `test-results/`,
  `.DS_Store`, `*.log`, `.env*` (`.gitignore:1-9`). No change needed.
- Local toolchain: Node `v22.18.0`, npm `10.9.3`. Playwright browser cache has only `chromium-1228`. Playwright 1.65.1
  needs `chromium-1255` and `webkit-2388`, so the builder must run `npx playwright install chromium webkit`.
- Existing code to reuse: none.
- Prototype (scratchpad, not committed) checked every config below against the pinned versions: lint, typecheck
  and build exit 0. Boundary errors read as shown in §5. Vitest threshold messages are
  `ERROR: Coverage for lines (20%) does not meet "src/{engine,bots,advice,stats}/**" threshold (90%)` and
  `ERROR: Coverage for lines (33.33%) does not meet global threshold (70%)`. The global threshold covers all files,
  including the headless ones. A glob with no matching files passes. Sandbox runs of the npm scripts work through a
  symlinked `node_modules`, including Vitest nested inside Vitest.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Stack: TypeScript strict, Vite, React, Vitest, fast-check, Playwright (Chromium + WebKit), @axe-core/playwright, ESLint + Prettier, npm | — | Approved in requirements | yes | user (requirements Q-1, Q-3, Q-4; REQ-059, REQ-063) |
| D-2 | Supporting third-party dev dependencies not named in the stack: `@vitejs/plugin-react`, `@vitest/coverage-v8`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-config-prettier`, `globals`, `@types/react`, `@types/react-dom`, `@types/node` | hand-rolled equivalents; `@vitest/coverage-istanbul` | Standard companions each named tool needs (JSX transform, coverage provider, TS parser/rules, Prettier conflict-off, global lists, types) | yes (new third-party deps) | user (Q-1) |
| D-3 | GHSA-fc5q-39xc-vjpf (picomatch ReDoS, high). The user chose to force-fix (Q-2), but a scratch prototype showed no clean fix exists: (1) every published picomatch (`<=4.0.7`, which is `latest`) is vulnerable and there is no patched version, so npm `overrides` has no target; (2) `vite@8.3.8` itself depends on picomatch (directly and via tinyglobby/fdir), so dropping Vitest or typescript-eslint would not clear it either; (3) `npm audit fix --force` (vitest/coverage-v8 `3.1.4`) makes things worse: 18 advisories (3 critical incl. vitest GHSA-5xrq-8626-4rwp and tinypool, 11 high, 4 moderate) versus 1 high-rooted chain on 5.1.0. `npm audit --omit=dev` reports 0 on the 5.1.0 tree. Resolution (Q-3, option b): keep Vitest `5.1.0`; tolerate the dev/build-time high picomatch advisory; enforce `npm audit --omit=dev --audit-level=high` = 0 (SPEC-24) and all-deps `npm audit --audit-level=critical` = 0 (SPEC-25). | force-fix to Vitest 3.x (rejected: adds criticals); picomatch override (none patched); drop typescript-eslint/Vitest (doesn't help, Vite carries it) | Not exploitable here: only our own glob patterns reach picomatch, at dev/build time; nothing from it ships in `dist/` | yes (security) | user (Q-3) |
| D-4 | Headless boundary enforced by ESLint core rules (`no-restricted-imports`, `no-restricted-globals`, `no-restricted-properties`, `no-restricted-syntax`), scoped to `src/{engine,bots,advice,stats}/**` and generated in `tools/lint/headless-boundary.js` | `eslint-plugin-boundaries`/`import` plugin; separate no-DOM `tsconfig` | No extra dependency. Error messages name the forbidden import or global. The definition is one importable module that the tests share | no | n/a |
| D-5 | Toolchain failure cases are tested by running the **real npm scripts** in a temp sandbox (copied config files + symlinked `node_modules` + probe files) | mutate the working tree; ESLint/tsc APIs only | Proves the exact command and exit code the AC names, without touching the repo or racing other tests | no | n/a |
| D-6 | `npm run e2e` serves the **built** app (`npm run build && npm run preview -- --port 4173 --strictPort`) via Playwright `webServer`, `reuseExistingServer: false` | dev server | AC#7 says "opens the built app" | no | n/a |

## 5. Design

### Files to create / modify
- `package.json` — metadata, `"type": "module"`, `engines`, scripts, exact-pinned deps
- `package-lock.json` — generated by npm (lockfile v3)
- `tsconfig.json` — single strict TS config for app, tests, e2e, tools and config files
- `eslint.config.js` — ESLint flat config
- `tools/lint/headless-boundary.js` — headless folder list, browser-only globals, forbidden import patterns, boundary config block
- `.prettierrc.json` — Prettier options
- `.prettierignore` — paths Prettier must skip
- `vite.config.ts` — Vite (React plugin) + Vitest (`test`) config, including coverage thresholds
- `playwright.config.ts` — Playwright projects, viewport, web server
- `index.html` — Vite entry HTML
- `src/main.tsx` — React root mount
- `src/ui/App.tsx` — placeholder start page component
- `src/ui/styles.css` — charcoal theme base styles
- `e2e/support/axe.ts` — exported `expectNoSeriousAxeViolations(page)` helper
- `e2e/smoke.spec.ts` — start-page smoke, axe and same-origin tests
- `e2e/axe-helper.spec.ts` — helper fails on a missing-alt image and passes on a decorative image
- `tests/support/sandbox.ts` — `runInSandbox(files, script, args?)` helper
- `tests/unit/app.test.tsx` — App server-render unit test
- `tests/toolchain/test-command.test.ts` — `npm test` discovery and failure exit code
- `tests/toolchain/typecheck.test.ts` — strict mode and type-error exit codes
- `tests/toolchain/lint.test.ts` — ESLint and Prettier violation exit codes
- `tests/toolchain/boundary.test.ts` — headless-boundary integration via `npm run lint`
- `tests/toolchain/boundary.property.test.ts` — fast-check property over browser-only globals and folders
- `tests/toolchain/coverage.test.ts` — coverage threshold exit codes and messages
- `tests/toolchain/build.test.ts` — `npm run build` output
- `README.md` — setup and command list

(26 paths. Nothing else should change.)

### Components, interfaces and data

**package.json**
```json
{
  "name": "tlh-trainer", "private": true, "version": "0.0.0", "type": "module",
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run --coverage",
    "e2e": "playwright test",
    "lint": "eslint . --max-warnings 0 && prettier --check .",
    "typecheck": "tsc -p tsconfig.json",
    "format": "prettier --write ."
  }
}
```
- dependencies (exact): `react@19.3.1`, `react-dom@19.3.1`.
- devDependencies (exact): `typescript@6.0.3`, `vite@8.3.8`, `@vitejs/plugin-react@6.3.0`, `@types/react@19.3.0`,
  `@types/react-dom@19.3.0`, `@types/node@22.20.5`, `vitest@5.1.0`, `@vitest/coverage-v8@5.1.0`, `fast-check@4.10.2`,
  `@playwright/test@1.65.1`, `@axe-core/playwright@4.14.0`, `eslint@10.15.0`, `@eslint/js@10.0.1`,
  `typescript-eslint@8.73.0`, `eslint-plugin-react-hooks@7.1.1`, `eslint-config-prettier@10.1.8`, `prettier@3.10.1`,
  `globals@17.14.0`.
  If a pinned version no longer resolves, use the newest patch of the same minor and record it in `changes.md`.

**tsconfig.json**: `compilerOptions`: `target: "ES2022"`, `lib: ["ES2023","DOM","DOM.Iterable"]`,
`module: "ESNext"`, `moduleResolution: "bundler"`, `jsx: "react-jsx"`, `types: ["node","vite/client"]` (TS 6
defaults `types` to `[]`), `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`,
`noFallthroughCasesInSwitch: true`, `noUnusedLocals: true`, `noUnusedParameters: true`, `verbatimModuleSyntax: true`,
`isolatedModules: true`, `allowJs: true`, `checkJs: true`, `noEmit: true`, `skipLibCheck: true`.
`include: ["src","tests","e2e","tools","*.config.ts","*.config.js"]`.

**tools/lint/headless-boundary.js** (ESM JS, type-checked via `checkJs`; JSDoc types where inference fails)
```js
export const HEADLESS_DIRS = ['engine', 'bots', 'advice', 'stats'];          // folders under src/
export const HEADLESS_FILES = HEADLESS_DIRS.map((d) => `src/${d}/**`);
export const BROWSER_ONLY_GLOBALS;   // sorted, de-duplicated string[] — see Rules
export const FORBIDDEN_IMPORT_PATTERNS; // no-restricted-imports `patterns` entries — see Rules
/** @type {import('eslint').Linter.Config} */
export const headlessBoundaryConfig = { name: 'headless-boundary', files: HEADLESS_FILES, rules: { … } };
```

**eslint.config.js**
```js
export default defineConfig(            // from 'eslint/config'
  { ignores: ['dist','coverage','playwright-report','test-results','backlog','dreams','doit','reports','research_notes','.claude'] },
  js.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  { files: ['src/ui/**/*.{ts,tsx}'], extends: [reactHooks.configs.flat.recommended] },
  headlessBoundaryConfig,
  prettier,                              // eslint-config-prettier, last
);
```

**.prettierrc.json**: `{ "singleQuote": true, "printWidth": 100 }`.
**.prettierignore**: `dist`, `coverage`, `playwright-report`, `test-results`, `package-lock.json`, `backlog`, `dreams`,
`doit`, `reports`, `research_notes`, `.claude`, `CLAUDE.md`. (Prettier 3 also honours `.gitignore`.) These are
Backlog- or workflow-managed files that the project must not reformat.

**vite.config.ts** (`defineConfig` from `vitest/config`)
```ts
plugins: [react()],
test: {
  include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
  environment: 'node',
  reporters: ['verbose'],
  coverage: {
    provider: 'v8',
    include: ['src/**/*.{ts,tsx}'],
    exclude: ['src/**/*.test.{ts,tsx}', 'src/main.tsx'],
    reporter: ['text'],
    thresholds: { lines: 70, 'src/{engine,bots,advice,stats}/**': { lines: 90 } },
  },
},
```
`src/main.tsx` is excluded because it only mounts React into the DOM. The e2e smoke test exercises it.

**playwright.config.ts**
- `testDir: './e2e'`, `testMatch: '**/*.spec.ts'`, `fullyParallel: true`, `forbidOnly: !!process.env.CI`, `retries: 0`.
- `reporter: [['list'], ['html', { open: 'never' }]]`. `open: 'never'` stops a failing run from blocking on a report server.
- `use: { baseURL: 'http://localhost:4173', viewport: { width: 1280, height: 720 } }`.
- `projects`: `{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport } }`,
  `{ name: 'webkit', use: { ...devices['Desktop Safari'], viewport } }`.
- `webServer: { command: 'npm run build && npm run preview -- --port 4173 --strictPort', url: 'http://localhost:4173', reuseExistingServer: false, timeout: 120_000 }`.

**index.html**: `<!doctype html>`, `<html lang="en">`, `<meta charset="UTF-8">`, viewport meta,
`<title>TLH Trainer</title>`, `<div id="root"></div>`, `<script type="module" src="/src/main.tsx">`. No inline
scripts or styles (keeps the future CSP, REQ-058.3, simple).

**src/main.tsx**: imports `./ui/styles.css`. Gets `#root`, throws `Error('Missing #root element')` if absent, and calls
`createRoot(root).render(<StrictMode><App /></StrictMode>)`.

**src/ui/App.tsx**: `export default function App(): JSX.Element` (or the inferred return type) returning
`<main><h1>TLH Trainer</h1><p>Texas Limit Hold 'Em Trainer</p></main>`.
**src/ui/styles.css**: `:root { color-scheme: dark; background: #1e1f22; color: #f2f2f2; font-family: system-ui, sans-serif; }`.
The contrast ratio is above 15:1.

**e2e/support/axe.ts**
```ts
export async function expectNoSeriousAxeViolations(page: Page): Promise<void>
```
- Runs `new AxeBuilder({ page }).analyze()` with axe's default rule set (no tag filter). It keeps violations whose
  `impact` is `'serious'` or `'critical'`.
- If none remain, it resolves. Otherwise it throws (by plain `throw new Error` or a failing `expect`) with a message
  that starts `axe: <n> serious/critical violation(s)` and has one line per violation:
  `- <id> (<impact>): <help> — <first target selector>`.
  Example: `axe: 1 serious/critical violation(s)\n- image-alt (critical): Images must have alternative text — img`.
- This is the shared helper later screen stories import (DoD#7).

**e2e/smoke.spec.ts**: tests (names exact):
- `start page loads in the built app`: listens for requests, calls `page.goto('/')`, and expects the title `TLH Trainer`
  and a level-1 heading named `TLH Trainer` to be visible.
- `start page has no serious or critical axe violations`: goes to `/`. If `process.env.E2E_INJECT_A11Y_VIOLATION === '1'`,
  it appends to `<main>` an `<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">`
  with no `alt`. Then it calls `await expectNoSeriousAxeViolations(page)`.
- `start page makes only same-origin requests`: records every `page.on('request')` URL during `goto('/')` and
  `waitForLoadState('networkidle')`. It expects every `new URL(u).origin` to equal `http://localhost:4173`, and at
  least one request.

**e2e/axe-helper.spec.ts**: tests (names exact) use `page.setContent(...)` with a minimal valid document
(`<html lang="en"><head><title>Axe probe</title></head><body><main><h1>Probe</h1>…</main></body></html>`):
- `fails on an image without alt text`: body has the 1×1 GIF `<img>` with no `alt`.
  `await expect(expectNoSeriousAxeViolations(page)).rejects.toThrow(/image-alt \(critical\)/)`.
- `passes on a decorative image with empty alt`: same image with `alt=""`, and the helper resolves.

**tests/support/sandbox.ts**
```ts
export type SandboxScript = 'lint' | 'typecheck' | 'test';
export interface SandboxResult { exitCode: number; output: string } // output = stdout + stderr
export function runInSandbox(files: Record<string, string>, script: SandboxScript, args?: string[]): SandboxResult
```
1. `mkdtempSync(join(tmpdir(), 'tlh-sandbox-'))`.
2. Copy from the repo root `CONFIG_FILES = ['package.json','tsconfig.json','eslint.config.js','tools/lint/headless-boundary.js','.prettierrc.json','.prettierignore','vite.config.ts']`.
3. `symlinkSync(<root>/node_modules, <dir>/node_modules, 'dir')`.
4. Write each `files` entry (relative path → content), creating parent dirs.
5. `spawnSync('npm', ['run', script, ...(args ? ['--', ...args] : [])], { cwd: dir, encoding: 'utf8', timeout: 120_000, env })`.
   `env` is `process.env` without keys starting `VITEST`, `NODE_V8_COVERAGE` and `TEST`, so a nested Vitest does not
   think it is a worker.
6. Return `{ exitCode: status ?? -1, output: stdout + stderr }`.
7. Always `rmSync(dir, { recursive: true, force: true })` in `finally`.

Each toolchain test sets its own timeout of 120 000 ms.

### Rules and algorithms

**Browser-only globals** (A-5): `BROWSER_ONLY_GLOBALS = sort(unique([...keys(globals.browser).filter(k => !(k in globals.node) && !(k in globals.builtin)), 'localStorage', 'sessionStorage', 'navigator']))`.
Worked example (verified against `globals@17.14.0`, 1,146 names):
- Included: `window`, `document`, `self`, `location`, `alert`, `HTMLElement`, `indexedDB`, `IDBDatabase`, `localStorage`, `sessionStorage`, `navigator`.
- Not included: `console`, `setTimeout`, `queueMicrotask`, `URL`, `TextEncoder`, `crypto`, `fetch`, `structuredClone`, `Event`, `performance`, `Math`, `globalThis`.

**Boundary rules** (`headlessBoundaryConfig.rules`, all `'error'`, applied to `src/{engine,bots,advice,stats}/**`):
| Rule | Options | Example message |
|---|---|---|
| `no-restricted-imports` | `patterns`: (a) `['react','react/*','react-dom','react-dom/*']` msg `Headless modules must not import React (REQ-059.2).` (b) `['idb','idb/*','idb-keyval','dexie','fake-indexeddb','fake-indexeddb/*']` msg `Headless modules must not import IndexedDB libraries (REQ-059.2).` (c) `['**/ui','**/ui/**']` msg `Headless modules must not import UI code from src/ui (REQ-059.2).` | `'react' import is restricted from being used by a pattern. Headless modules must not import React (REQ-059.2)` |
| `no-restricted-globals` | one `{ name, message: 'Browser-only API in a headless module (REQ-059.2).' }` per `BROWSER_ONLY_GLOBALS` entry | `Unexpected use of 'document'. Browser-only API in a headless module (REQ-059.2)` |
| `no-restricted-properties` | one `{ object: 'globalThis', property, message }` per `BROWSER_ONLY_GLOBALS` entry | `'globalThis.document' is restricted from being used. Browser-only API in a headless module (REQ-059.2)` |
| `no-restricted-syntax` | `{ selector: 'ImportExpression', message: 'Dynamic import() is not allowed in headless modules (REQ-059.2).' }` | `Dynamic import() is not allowed in headless modules (REQ-059.2).` |

Type-only imports (`import type { ReactNode } from 'react'`) are also reported. The core rule does not exempt them.

**Coverage thresholds**: Vitest evaluates the `lines` metric. The global 70% is computed over every file in
`coverage.include` (headless files too). The glob threshold of 90% is computed over the files matching
`src/{engine,bots,advice,stats}/**` together. A glob that matches no files passes, which is the case today.
Missed threshold messages (printed by Vitest, exit code 1):
- `ERROR: Coverage for lines (<x>%) does not meet global threshold (70%)`
- `ERROR: Coverage for lines (<x>%) does not meet "src/{engine,bots,advice,stats}/**" threshold (90%)`

### Error handling and configuration
- Every script relies on its tool's non-zero exit on failure. The `lint` script uses `&&`, so ESLint errors stop it
  before Prettier runs, and either failing exits non-zero.
- `--max-warnings 0` makes ESLint warnings fail lint too (REQ-059.4 "zero errors"; also no silent drift).
- `vite preview --strictPort` fails fast if port 4173 is busy instead of silently moving to another port.
- Missing Playwright browsers: Playwright prints its own "Executable doesn't exist … run npx playwright install"
  error and exits non-zero. The README documents the install command.

## 6. Behaviour specification

### SPEC-01: `npm test` runs unit and property tests and passes
- Verifies: AC#1, DoD#1, DoD#2
- Behaviour: Given a checkout after `npm ci`, When `npm test` runs, Then Vitest (verbose reporter) lists passing tests from `tests/unit/app.test.tsx` and `tests/toolchain/boundary.property.test.ts`, reports 0 failed, prints the coverage summary with no `ERROR: Coverage` line, and exits 0
- Verification: command `npm test` → exit 0; output contains `app.test.tsx` and `boundary.property.test.ts`, and does not contain `failed` in the Test Files summary or `ERROR: Coverage`

### SPEC-02: Start page component renders its heading
- Verifies: AC#1, DoD#1
- Behaviour: Given `App`, When rendered with `react-dom/server` `renderToString(<App />)`, Then the HTML contains `<main>`, `<h1>TLH Trainer</h1>` and `Texas Limit Hold &#x27;Em Trainer` (React's escaped apostrophe; the test may decode the entities instead)
- Verification: unit `tests/unit/app.test.tsx::App renders the TLH Trainer heading inside main`

### SPEC-03: Test discovery covers tests/ and src/, and a failing test fails `npm test`
- Verifies: AC#1, DoD#3, DoD#1
- Behaviour: Given a sandbox with `tests/golden/deep/probe.test.ts` containing `it('golden probe passes', …)` that passes and `src/stats/probe.test.ts` containing `it('colocated probe fails', () => expect(1).toBe(2))`, When `npm test` runs, Then the output names both test titles and the exit code is non-zero. Given the same sandbox with the failing assertion fixed, Then exit 0. (The golden-spot suite will join `npm test` automatically when E07 adds it.)
- Verification: acceptance `tests/toolchain/test-command.test.ts::npm test runs test files anywhere under tests/ and src/ and fails when one fails`

### SPEC-04: Lint and typecheck are clean on the repository
- Verifies: AC#2, DoD#2, DoD#1
- Behaviour: Given the delivered repository, When `npm run lint` runs, Then ESLint reports 0 problems, Prettier prints `All matched files use Prettier code style!`, and it exits 0. When `npm run typecheck` runs, Then `tsc` prints no diagnostics and exits 0
- Verification: command `npm run lint && npm run typecheck` → exit 0

### SPEC-05: TypeScript strict mode is in force
- Verifies: AC#2, AC#3, DoD#1
- Behaviour: Given a sandbox containing `src/ui/probe.ts` = `export function id(x) {\n  return x;\n}\n`, When `npm run typecheck` runs, Then output contains `TS7006` (implicit any, reported only under `strict`/`noImplicitAny`) and the exit code is non-zero
- Verification: acceptance `tests/toolchain/typecheck.test.ts::typecheck rejects implicit any because strict mode is on`

### SPEC-06: A type error fails `npm run typecheck`
- Verifies: AC#3, DoD#1
- Behaviour: Given a sandbox containing `src/ui/probe.ts` = `export const n: number = 'x';\n`, When `npm run typecheck` runs, Then output contains `TS2322` and `src/ui/probe.ts` and the exit code is non-zero. Given `export const n: number = 1;\n` instead, Then exit 0
- Verification: acceptance `tests/toolchain/typecheck.test.ts::typecheck exits non-zero on a type error and zero when it is fixed`

### SPEC-07: An ESLint violation fails `npm run lint`
- Verifies: AC#3, DoD#1
- Behaviour: Given a sandbox containing the Prettier-clean file `src/ui/probe.ts` = `export const x: any = 1;\n`, When `npm run lint` runs, Then output contains `@typescript-eslint/no-explicit-any` and the exit code is non-zero. Given `export const x: number = 1;\n` instead, Then exit 0
- Verification: acceptance `tests/toolchain/lint.test.ts::lint exits non-zero on an ESLint rule violation and zero when it is fixed`

### SPEC-08: A Prettier violation fails `npm run lint`
- Verifies: AC#3, DoD#1
- Behaviour: Given a sandbox containing the ESLint-clean but unformatted file `src/ui/probe.ts` = `export const x = {a:1}\n`, When `npm run lint` runs, Then output contains `src/ui/probe.ts` and `Code style issues found` and the exit code is non-zero
- Verification: acceptance `tests/toolchain/lint.test.ts::lint exits non-zero on a Prettier formatting violation`

### SPEC-09: Forbidden imports and browser APIs in each headless folder fail `npm run lint`
- Verifies: AC#4, DoD#5, DoD#1
- Behaviour: For each folder F in `engine`, `bots`, `advice`, `stats` (one sandbox run per folder), Given a sandbox containing these Prettier-clean files:
  - `src/F/react.ts` importing `useState` from `'react'`
  - `src/F/reactdom.ts` importing `createRoot` from `'react-dom/client'`
  - `src/F/dom.ts` = `export const t = document.title;\n`
  - `src/F/idb.ts` = `export const db = indexedDB;\n`
  - `src/F/ui.ts` importing `App` from `'../ui/App'`, with `src/ui/App.ts` present

  When `npm run lint` runs, Then the exit code is non-zero and the output contains `'react' import is restricted`, `'react-dom/client' import is restricted`, `Unexpected use of 'document'`, `Unexpected use of 'indexedDB'` and `'../ui/App' import is restricted`, each on a line with `REQ-059.2`
- Verification: acceptance `tests/toolchain/boundary.test.ts::lint reports each forbidden React, DOM, IndexedDB and UI use in every headless folder`

### SPEC-10: Every browser-only global is flagged in every headless folder (property)
- Verifies: AC#4, AC#1, DoD#5, DoD#1
- Behaviour: For all pairs (F ∈ `HEADLESS_DIRS`, g ∈ `BROWSER_ONLY_GLOBALS`) drawn by fast-check (`numRuns: 200`), When the repo's ESLint config lints the text `export const probe = ${g};\n` as `src/${F}/probe.ts` (ESLint API `lintText` with `filePath`), Then there is a `no-restricted-globals` message containing `'${g}'`. And for all g in the fixed allowed list `['console','setTimeout','URL','crypto','structuredClone','performance','Math','TextEncoder','queueMicrotask']`, linting `export const probe = ${g};\n` there gives no `no-restricted-globals` message
- Verification: acceptance `tests/toolchain/boundary.property.test.ts::every browser-only global is reported in every headless folder and Node-safe globals are not`

### SPEC-11: Allowed code is not flagged by the boundary
- Verifies: AC#4, DoD#1
- Behaviour: Given a sandbox with `src/engine/ok.ts` = `export const ok = (n: number): number => Math.max(n, 0) + structuredClone([1]).length;\n` and `src/ui/ok.tsx` importing `useState` from `'react'` and exporting a component using it, When `npm run lint` runs, Then exit 0 (React is allowed outside the headless folders and Node/ES globals are allowed inside)
- Verification: acceptance `tests/toolchain/boundary.test.ts::lint allows React in src/ui and Node-safe code in headless folders`

### SPEC-12: Boundary bypasses are flagged
- Verifies: AC#4, DoD#5
- Behaviour: Given a sandbox with `src/engine/bypass.ts` containing `export const d = globalThis.document;`, `export const lazy = () => import('./other');` and `import type { ReactNode } from 'react';` used in an exported type, When `npm run lint` runs, Then the exit code is non-zero and the output contains `'globalThis.document' is restricted`, `Dynamic import() is not allowed in headless modules` and `'react' import is restricted`
- Verification: acceptance `tests/toolchain/boundary.test.ts::lint reports globalThis access, dynamic import and type-only React import in headless folders`

### SPEC-13: Headless folder coverage below 90% fails `npm test`, naming the threshold
- Verifies: AC#5, DoD#4, DoD#1
- Behaviour: For each folder F in `engine`, `bots`, `advice`, `stats`: Given a sandbox with `src/F/probe.ts` (two exported functions, one covered and one not, giving under 90% of lines) and `tests/probe.test.ts` calling only the covered one, plus `src/ui/filler.ts` (≥40 straight-line statements, fully covered by `tests/filler.test.ts`) so overall coverage is ≥70%, When `npm test` runs, Then the exit code is non-zero, the output contains `does not meet "src/{engine,bots,advice,stats}/**" threshold (90%)`, and it does not contain `global threshold`
- Verification: acceptance `tests/toolchain/coverage.test.ts::npm test fails and names the 90% headless threshold when a headless folder is under-covered`

### SPEC-14: Overall coverage below 70% fails `npm test`, naming the threshold
- Verifies: AC#5, DoD#4, DoD#1
- Behaviour: Given a sandbox with only `src/ui/probe.ts` (two functions, one uncovered, under 70% lines) and a test covering one function, When `npm test` runs, Then the exit code is non-zero, the output contains `does not meet global threshold (70%)`, and it does not contain `threshold (90%)`
- Verification: acceptance `tests/toolchain/coverage.test.ts::npm test fails and names the 70% global threshold when overall coverage is low`

### SPEC-15: Coverage meeting both thresholds passes
- Verifies: AC#5, DoD#4
- Behaviour: Given a sandbox with `src/engine/probe.ts` whose functions are all called by `tests/probe.test.ts`, When `npm test` runs, Then exit 0 and the output contains no `ERROR: Coverage` line
- Verification: acceptance `tests/toolchain/coverage.test.ts::npm test passes when both coverage thresholds are met`

### SPEC-16: `npm run build` writes the deployable static app
- Verifies: AC#6, DoD#1
- Behaviour: Given the repository, When `npm run build -- --outDir <tmp>/out --emptyOutDir` runs from the repo root (the real script, redirected so the test does not touch `dist/`), Then exit 0, and `<tmp>/out/index.html` exists, contains `<title>TLH Trainer</title>`, and references a `/assets/*.js` file that exists in `<tmp>/out/assets/`
- Verification: acceptance `tests/toolchain/build.test.ts::npm run build writes index.html and its script bundle`

### SPEC-17: Built app smoke test passes in Chromium and WebKit
- Verifies: AC#7, DoD#7, DoD#1
- Behaviour: Given Playwright browsers installed (`npx playwright install chromium webkit`), When `npm run e2e` runs, Then Playwright builds the app, serves `dist/` with `vite preview` on port 4173, and runs every spec in projects `chromium` and `webkit`. `start page loads in the built app` passes in both, the run reports `10 passed` (5 tests: 3 in `smoke.spec.ts` + 2 in `axe-helper.spec.ts`, × 2 projects), and the exit code is 0
- Verification: acceptance `e2e/smoke.spec.ts::start page loads in the built app`

### SPEC-18: Axe scan of the start page has zero serious or critical violations
- Verifies: AC#8, DoD#7, DoD#1
- Behaviour: Given the built start page at `/`, When `expectNoSeriousAxeViolations(page)` runs in Chromium and in WebKit, Then it resolves (0 violations with impact `serious` or `critical`)
- Verification: acceptance `e2e/smoke.spec.ts::start page has no serious or critical axe violations`

### SPEC-19: The axe helper fails on an image without alt text
- Verifies: AC#8, DoD#1
- Behaviour: Given a page whose content includes `<img>` with no `alt`, When `expectNoSeriousAxeViolations(page)` runs, Then it rejects with a message matching `/image-alt \(critical\)/`. Given the same image with `alt=""`, Then it resolves
- Verification: acceptance `e2e/axe-helper.spec.ts::fails on an image without alt text`

### SPEC-20: An injected critical violation makes `npm run e2e` exit non-zero
- Verifies: AC#8
- Behaviour: Given `E2E_INJECT_A11Y_VIOLATION=1`, When `npm run e2e` runs, Then `start page has no serious or critical axe violations` fails in both projects with output containing `image-alt (critical)`, and the command exits non-zero. Without the variable the same run exits 0 (SPEC-17)
- Verification: command `E2E_INJECT_A11Y_VIOLATION=1 npm run e2e` → exit code ≠ 0; output contains `image-alt (critical)` and `2 failed`

### SPEC-21: The start page makes no third-party requests
- Verifies: DoD#8
- Behaviour: Given the built app, When the start page loads to network idle, Then every request URL has origin `http://localhost:4173`, and at least one request was made
- Verification: acceptance `e2e/smoke.spec.ts::start page makes only same-origin requests`

### SPEC-22: All checks pass from a clean checkout (local stand-in for CI)
- Verifies: AC#1, AC#2, AC#6, AC#7, DoD#10, DoD#2
- Behaviour: Given the branch committed and cloned into an empty temp directory, When `npm ci && npm run lint && npm run typecheck && npm test && npm run build && npm run e2e` runs there, Then every command exits 0 and `dist/index.html` exists
- Verification: command `D=$(mktemp -d) && git clone -q --branch doit/TASK-1.1 . "$D" && cd "$D" && npm ci && npm run lint && npm run typecheck && npm test && npm run build && npm run e2e && test -f dist/index.html`

### SPEC-23: Definition-of-Done items that do not apply to this story
- Verifies: DoD#6, DoD#9, DoD#11, DoD#12
- Behaviour: DoD#6 (10,000-hand playtest) is N/A: no playtest runner and no engine/bot/advice code exist until TASK-1.6. DoD#9 (original strategy content) is N/A: this story adds no strategy text, charts, ranges or golden spots. DoD#12 (works offline) is N/A: no service worker until E13-S07. DoD#11 (story documentation) is done by the doit Documentor step, which publishes the story document to Backlog.md
- Verification: manual — reviewer confirms no `src/engine|bots|advice|stats` code, no strategy content and no service worker were added (`git diff --stat <base>`), and that a Backlog doc for TASK-1.1 exists after the documentation step (`backlog doc list --plain`)

### SPEC-24: Shipped dependencies have no high or critical advisories
- Verifies: DoD#8
- Behaviour: Given the committed lockfile, When `npm audit --omit=dev --audit-level=high` runs, Then it reports `found 0 vulnerabilities` and exits 0.
- Verification: command `npm audit --omit=dev --audit-level=high` → exit 0, output contains `found 0 vulnerabilities`

### SPEC-25: No critical advisories in any dependency
- Verifies: DoD#8
- Behaviour: Given the committed lockfile, When `npm audit --audit-level=critical` runs over all dependencies, Then it exits 0. The only tolerated advisory is the dev/build-time high GHSA-fc5q-39xc-vjpf (picomatch), per Q-3
- Verification: command `npm audit --audit-level=critical` → exit 0

## 7. Edge cases
- Empty headless folders (today's state): the coverage glob matches no files and passes. The boundary rule has nothing to lint (prototype-verified) → covered by SPEC-01/SPEC-04.
- Type-only React import, `globalThis.document`, dynamic `import()` in a headless module → SPEC-12.
- Node-safe globals (`console`, `setTimeout`, `crypto`, `URL`, `structuredClone`) in headless code are allowed → SPEC-10, SPEC-11.
- Browser global spelled through `window.x` → `window` itself is flagged → SPEC-10.
- Lint warnings (not errors) → `--max-warnings 0` fails lint → covered by the lint script; same path as SPEC-07.
- Prettier must not reformat Backlog/dream/doit files → `.prettierignore` (§5). SPEC-04 proves lint passes on the real repo with those files present.
- Port 4173 busy → `--strictPort` makes the web server fail fast with a clear error. Not separately tested (environmental).
- Playwright browsers missing → Playwright's own install hint and non-zero exit. AC#7 assumes browsers are installed. Documented in the README.
- Nested Vitest inside Vitest (sandbox tests) → env scrubbing in `runInSandbox` → exercised by SPEC-03/13/14/15.
- Sandbox clean-up on failure → `finally` removes the temp dir. Interruption (Ctrl-C) may leave a `tlh-sandbox-*` dir in the OS temp folder, which is harmless.
- Concurrency: sandbox tests run in parallel Vitest workers. Each uses its own `mkdtemp` dir, and the build test uses its own `--outDir`, so nothing is shared.
- Invalid input / permissions / duplicates: N/A — no user input or persisted data in this story.

## 8. Security considerations
- Trust boundaries: none at runtime. The app has no input, network calls, storage or secrets. Build-time inputs are
  our own source files.
- Third-party requests: the start page makes only same-origin requests (SPEC-21, REQ-058.1).
- New dependencies: the D-1 stack plus the D-2 supporting packages, all pinned exactly, with a committed lockfile and
  installed with `npm ci`. Only `react`/`react-dom` ship in `dist/`.
- Known advisory: GHSA-fc5q-39xc-vjpf (picomatch ReDoS, high) in dev/build-time deps (vite, vitest, typescript-eslint
  via tinyglobby/fdir). No patched picomatch exists, and the Vitest 3.x downgrade adds critical advisories, so it is tolerated per Q-3 (D-3). It is not reachable from untrusted input.
- Production dependencies: `npm audit --omit=dev --audit-level=high` must report 0 (SPEC-24). All deps: `npm audit --audit-level=critical`
  must exit 0 (SPEC-25).
- Child processes in tests: `spawnSync('npm', [...])` with an argument array (no shell). Probe contents are
  constants in the test files.
- Injection, authn/authz, sensitive logging, randomness: N/A. This story has no code paths for them.

## 9. Non-functional
- Speed: `npm test` ≤ 60 s and `npm run lint` + `npm run typecheck` ≤ 30 s on the local machine (the prototype
  took ~1 s each before sandbox tests; there are about 15 sandbox runs at ~1–3 s each). `npm run e2e` ≤ 120 s.
  Measured by `time` in the Judge run. The budgets are generous so the gate stays reliable.
- Coverage: global lines ≥ 70% (today 100%: only `src/ui/App.tsx` counts), headless ≥ 90% (no files yet).
- Accessibility: 0 serious/critical axe violations on the start page in Chromium and WebKit at 1280×720 (REQ-057.1, REQ-060).
- Bundle: no target in this story (the prototype `dist/` JS is ~220 kB, ~69 kB gzip, which is React only).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run build && npm run e2e`
- Pre-requisite (once per machine): `npm ci && npx playwright install chromium webkit`
- New tests (path → SPEC ids):
  - `tests/unit/app.test.tsx` → SPEC-02
  - `tests/toolchain/test-command.test.ts` → SPEC-03
  - `tests/toolchain/typecheck.test.ts` → SPEC-05, SPEC-06
  - `tests/toolchain/lint.test.ts` → SPEC-07, SPEC-08
  - `tests/toolchain/boundary.test.ts` → SPEC-09, SPEC-11, SPEC-12
  - `tests/toolchain/boundary.property.test.ts` → SPEC-10
  - `tests/toolchain/coverage.test.ts` → SPEC-13, SPEC-14, SPEC-15
  - `tests/toolchain/build.test.ts` → SPEC-16
  - `e2e/smoke.spec.ts` → SPEC-17, SPEC-18, SPEC-20, SPEC-21
  - `e2e/axe-helper.spec.ts` → SPEC-19
- End-to-end scenario for the Judge (as the project owner would):
  1. Run SPEC-22 (clean clone, `npm ci`, then every script). All exit 0.
  2. In the clone, add `src/engine/x.ts` with `import { useState } from 'react'; export const s = useState;`.
     `npm run lint` exits non-zero and names `'react'`. Delete the file.
  3. In the clone, add `src/ui/x.ts` with `export const n: number = 'x';`. `npm run typecheck` exits non-zero. Delete it.
  4. `E2E_INJECT_A11Y_VIOLATION=1 npm run e2e` exits non-zero with `image-alt (critical)` (SPEC-20).
  5. `npm run dev`, open the printed URL, and see "TLH Trainer" on a dark charcoal page.

## 11. Open questions
None. Q-3 was resolved as option (b); see D-3, SPEC-24 and SPEC-25.

## 12. Clarifications log
See `doit/TASK-1.1/qa.md`.
