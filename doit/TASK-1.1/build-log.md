# Build log — TASK-1.1

## BUILD (2026-11-17)

### Done
- Created `package.json` and installed all deps with `npm install --save-exact` (every pin resolved as specified).
- `npx playwright install chromium webkit` (downloaded chromium-1255 / webkit-2388 for Playwright 1.65.1).
- Wrote configs (tsconfig, ESLint flat config + `tools/lint/headless-boundary.js`, Prettier, Vite/Vitest, Playwright),
  app shell (`index.html`, `src/main.tsx`, `src/ui/App.tsx`, `src/ui/styles.css`), e2e helper + specs, sandbox helper,
  unit and toolchain tests, README.
- Mutation check: disabling `headlessBoundaryConfig` made all boundary tests fail; replacing the thresholds with
  `{ lines: 10 }` made SPEC-13 and SPEC-14 tests fail. Configs restored afterwards.

### Spec issue found
- SPEC-07's "fixed" probe `export const x: number = 1;` is itself a lint error
  (`@typescript-eslint/no-inferrable-types`, from `tseslint.configs.stylistic`, which the spec mandates). The test uses
  `export const x = 1;` for the passing half instead. Reported as a spec gap.

### Commands and results
- `npm run lint` → exit 0 (ESLint 0 problems; "All matched files use Prettier code style!")
- `npm run typecheck` → exit 0, no diagnostics
- `npm test` → exit 0; Test Files 8 passed (8), Tests 15 passed (15); coverage 100% lines (1 file), no `ERROR: Coverage`; ~4.4 s
- `npm run e2e` → exit 0; `10 passed` (5 tests × chromium, webkit); ~9 s
- `E2E_INJECT_A11Y_VIOLATION=1 npm run e2e` → exit 1; `2 failed`, `8 passed`; output contains `- image-alt (critical): Images must have alternative text — img`
- `npm audit --omit=dev --audit-level=high` → exit 0, `found 0 vulnerabilities`
- `npm audit --audit-level=critical` → exit 0 (13 high, all picomatch GHSA-fc5q-39xc-vjpf, tolerated per Q-3)
- SPEC-22 stand-in (no commit allowed for the builder): copied the 26 new files + `.gitignore` into an empty temp dir,
  ran `npm ci && npm run lint && npm run typecheck && npm test && npm run build && npm run e2e && test -f dist/index.html`
  → all exit 0, `10 passed`. The real clone-based SPEC-22 must be run after the branch is committed.
