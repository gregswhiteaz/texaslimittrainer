## BUILD (TASK-12.10)
- `hand-store.ts`: `UpgradeBlockedError`, `onblocked` reject, late-success close, retry after a blocked open (cache reset only for that error, A-4).
- v3 upgrade test now opens via `count()` and asserts the raw `settings` record; new `tests/storage/upgrade-blocked.test.ts` (3 tests; the blocker DB is a real v4 schema so the retry upgrade 4→5 works).
- `← Home` moved after the h1 on Settings and Statistics; CSS `order: -1` keeps it visually first. Locked `e2e/settings.spec.ts` re-pinned to `expect(order).toEqual(expected)` + two comments (Q-2). New `e2e/back-focus.spec.ts` (3 tests). Docs updated.
- `npx vitest run tests/storage/` → 41 passed, 1 skipped.
- `npm run e2e -- e2e/back-focus.spec.ts e2e/settings.spec.ts e2e/statistics.spec.ts` → 16 passed (chromium + webkit).
- `npm run lint` clean; `npm run typecheck` clean; `npm run format` run.
- `npm test` → 346 files passed / 11 skipped; 1537 tests passed / 60 skipped.
