# Build log — TASK-13.1

## BUILD
- Implemented AppRoot (boundary + window listeners), ErrorScreen, classifiers, App `returned` prop, main.tsx switch,
  AdviceClient `failed` + shared-client replacement, CSS, e2e fault injection init script and spec, docs.
- `npx vitest run` (new files + advice-worker + app): 5 files, 7 tests passed.
- `npm run build && npx playwright test e2e/error-recovery.spec.ts`: 10 passed (Chromium + WebKit).
- `npm run lint`: clean. `npm run typecheck`: clean.
- `npm test`: 310 files passed, 5 skipped; 1405 tests passed, 46 skipped; coverage thresholds met.
- `npm run build && npx playwright test` (full suite): 350 passed, 18 skipped, 0 failed.
- `npx prettier --write` on every touched file. No locked test changed. No vitest/playwright/preview process left running.
- Gate: a manual `doit.py gate TASK-13.1` run passed (673 lines, 13 files). The stop-hook gate that ran at the same time
  failed only on Vitest's coverage-directory lock (two `--coverage` runs at once), not on a test. Nothing is running now.
