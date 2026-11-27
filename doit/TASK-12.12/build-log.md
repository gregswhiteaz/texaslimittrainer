# Build log — TASK-12.12

## BUILD
- `src/storage/hand-store.ts`: `OPEN_TIMEOUT_MS` (10 s) + per-store `openTimeoutMs`; `opened()` gives up via the blocked path when no first event arrives; tidy-ups (no `blockedOpen` reset, no `db === opening`, docblock ≤120 cols).
- Tests SPEC-01/SPEC-02 added to `tests/storage/upgrade-blocked.test.ts`; `e2e/settings-save-held.spec.ts` (SPEC-04); `hold-writes.ts` generalised (A-5); docs version table to 5.
- `npx vitest run tests/storage`: 15 files passed, 45 tests passed, 1 skipped.
- SPEC-05 `npx playwright test e2e/pause-history.spec.ts e2e/end-session-hardening.spec.ts e2e/settings-save-failed.spec.ts e2e/settings-save-held.spec.ts`: 20 passed (chromium + webkit).
- `npm run format`, `npm run lint`, `npm run typecheck`, `npm test`: all exit 0.
