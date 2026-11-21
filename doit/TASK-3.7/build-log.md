# Build log: TASK-3.7

## BUILD (2026-11-21)
- Exported `fullBetTarget` from the engine and used it in `legalActions`; added all-in/chip labels, `isShortAllIn` and the `unit` argument to the bar model.
- Added the four test-only scenes and the `stacks` override on `userTableAfter`.
- Wrote the acceptance tests named in SPEC-01..SPEC-13 at the spec's paths and names. All spec worked examples matched the engine; no deviations.
- `npx vitest run tests/ui/action-bar-limits.acceptance.test.tsx`: 8 passed.
- `npx vitest run tests/table/action-bar-limits.acceptance.test.ts`: 2 passed (100,000-state property ~0.9 s).
- `npx vitest run tests/table/action-bar.test.ts`: 3 passed.
- `npx playwright test e2e/action-bar-limits.spec.ts e2e/action-bar.spec.ts`: 16 passed (Chromium + WebKit; TASK-3.2 locked spec unchanged and green).
- `npm run format`, `npm run lint`, `npm run typecheck`: clean.
- `npm test`: 141 files passed / 1 skipped; 499 tests passed / 7 skipped; coverage all files 96.78% stmts (thresholds met).
- `npm run e2e`: 120 passed, 6 skipped.
- `npm run playtest -- --hands 10000 --seed 42`: 0 invariant violations; output byte-identical (`cmp`) to the same run at base commit 0ebb31a in a temporary worktree (removed afterwards).

## FIX (2026-11-21)
- R1 NIT (SPEC-11 strengthen): fixed — added "a disabled bar's buttons submit nothing even when they carry actions" (real model from a facing-bet hand, `enabled: false`; all 3 buttons carry non-null actions; onClick never calls onAct). Mutation check: removing `model.enabled &&` from the click guard in `src/ui/table/ActionBar.tsx` fails the new test (1 failed / 8 passed); restored, 9 passed. Existing assertions unchanged.
- `npm run format`, eslint, tsc: clean.
