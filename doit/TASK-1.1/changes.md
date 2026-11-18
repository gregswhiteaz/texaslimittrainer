# Changes — TASK-1.1

All files are new (greenfield). 26 paths, 4,260 lines (package-lock.json is most of it).

| File | Purpose |
|---|---|
| `package.json` | Metadata, `"type": "module"`, `engines.node >=22.12.0`, scripts `dev/build/preview/test/e2e/lint/typecheck/format`, exact-pinned deps |
| `package-lock.json` | Generated lockfile (v3) for reproducible `npm ci` |
| `tsconfig.json` | Single strict TS config (strict, noUncheckedIndexedAccess, checkJs, types node + vite/client) over src, tests, e2e, tools, config files |
| `eslint.config.js` | Flat config: @eslint/js recommended, typescript-eslint strict + stylistic, react-hooks for `src/ui`, headless boundary, eslint-config-prettier last |
| `tools/lint/headless-boundary.js` | `HEADLESS_DIRS`, `HEADLESS_FILES`, `BROWSER_ONLY_GLOBALS` (computed, 1,146 names), `FORBIDDEN_IMPORT_PATTERNS`, `headlessBoundaryConfig` (no-restricted-imports/globals/properties/syntax) |
| `.prettierrc.json` | `singleQuote: true`, `printWidth: 100` |
| `.prettierignore` | Skips build output, lockfile and Backlog/workflow-managed folders |
| `vite.config.ts` | React plugin + Vitest config (test discovery, verbose reporter, v8 coverage, 70% global / 90% headless line thresholds) |
| `playwright.config.ts` | Chromium + WebKit at 1280×720, built app served by `vite preview` on 4173 (`--strictPort`), list + html (open: never) reporters |
| `index.html` | Vite entry HTML, no inline script/style |
| `src/main.tsx` | Mounts `<App />` in StrictMode into `#root`; throws `Missing #root element` if absent |
| `src/ui/App.tsx` | Placeholder start page (`<main><h1>TLH Trainer</h1><p>Texas Limit Hold 'Em Trainer</p></main>`) |
| `src/ui/styles.css` | Charcoal theme (`#1e1f22` / `#f2f2f2`) |
| `e2e/support/axe.ts` | Shared `expectNoSeriousAxeViolations(page)` helper |
| `e2e/smoke.spec.ts` | SPEC-17/18/20/21: load, axe scan (with `E2E_INJECT_A11Y_VIOLATION=1` injection), same-origin requests |
| `e2e/axe-helper.spec.ts` | SPEC-19: helper rejects on missing alt, resolves on `alt=""` |
| `tests/support/sandbox.ts` | `runInSandbox(files, script, args?)`, `REPO_ROOT`, `TOOLCHAIN_TIMEOUT_MS` |
| `tests/unit/app.test.tsx` | SPEC-02 |
| `tests/toolchain/test-command.test.ts` | SPEC-03 |
| `tests/toolchain/typecheck.test.ts` | SPEC-05, SPEC-06 |
| `tests/toolchain/lint.test.ts` | SPEC-07, SPEC-08 |
| `tests/toolchain/boundary.test.ts` | SPEC-09, SPEC-11, SPEC-12 |
| `tests/toolchain/boundary.property.test.ts` | SPEC-10 (+ unit test of the `BROWSER_ONLY_GLOBALS` worked example) |
| `tests/toolchain/coverage.test.ts` | SPEC-13, SPEC-14, SPEC-15 |
| `tests/toolchain/build.test.ts` | SPEC-16 |
| `README.md` | Setup and command list |

## Dependencies
All versions resolved exactly as pinned in spec §5 (no substitutions).
- dependencies: react 19.3.1, react-dom 19.3.1.
- devDependencies: typescript 6.0.3, vite 8.3.8, @vitejs/plugin-react 6.3.0, @types/react 19.3.0, @types/react-dom 19.3.0,
  @types/node 22.20.5, vitest 5.1.0, @vitest/coverage-v8 5.1.0, fast-check 4.10.2, @playwright/test 1.65.1,
  @axe-core/playwright 4.14.0, eslint 10.15.0, @eslint/js 10.0.1, typescript-eslint 8.73.0, eslint-plugin-react-hooks 7.1.1,
  eslint-config-prettier 10.1.8, prettier 3.10.1, globals 17.14.0.
- Rationale per D-1/D-2 (user-approved Q-1). Audit per D-3/Q-3: `--omit=dev --audit-level=high` → 0; `--audit-level=critical` → exit 0
  (13 high, all the tolerated picomatch GHSA-fc5q-39xc-vjpf chain).

## Deviation from spec (see spec_gaps)
- `tests/toolchain/lint.test.ts` SPEC-07 "fixed" probe uses `export const x = 1;` instead of the spec's
  `export const x: number = 1;`, which fails lint with `@typescript-eslint/no-inferrable-types` (from the spec-mandated
  `tseslint.configs.stylistic` preset).
