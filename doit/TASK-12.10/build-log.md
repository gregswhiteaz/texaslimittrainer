## BUILD (TASK-12.10)
- `hand-store.ts`: `UpgradeBlockedError`, `onblocked` reject, late-success close, retry after a blocked open (cache reset only for that error, A-4).
- v3 upgrade test now opens via `count()` and asserts the raw `settings` record; new `tests/storage/upgrade-blocked.test.ts` (3 tests; the blocker DB is a real v4 schema so the retry upgrade 4→5 works).
- `← Home` moved after the h1 on Settings and Statistics; CSS `order: -1` keeps it visually first. Locked `e2e/settings.spec.ts` re-pinned to `expect(order).toEqual(expected)` + two comments (Q-2). New `e2e/back-focus.spec.ts` (3 tests). Docs updated.
- `npx vitest run tests/storage/` → 41 passed, 1 skipped.
- `npm run e2e -- e2e/back-focus.spec.ts e2e/settings.spec.ts e2e/statistics.spec.ts` → 16 passed (chromium + webkit).
- `npm run lint` clean; `npm run typecheck` clean; `npm run format` run.
- `npm test` → 346 files passed / 11 skipped; 1537 tests passed / 60 skipped.

## FIX r1 (TASK-12.10)
- Item 1 (SPEC-02 failed) / Item 2 (J-1-01): fixed — `opened()` reports a blocked request's eventual settle; `openHandStore` tracks it and, while it is pending, a store call waits at most 100 ms (`BLOCKED_GRACE_MS`) for it to finish (covers the blocker having just closed, SPEC-03) and otherwise rejects with `UpgradeBlockedError` without starting another open. New unit test `a call made while the upgrade is still blocked rejects promptly` (count + readSettings reject within 1 s, then succeed after the blocker closes).
- Orchestrator note: added `a blocked open that later succeeds closes its connection` (after the blocker closes, an open at `DB_VERSION + 1` queued behind the late upgrade is not blocked and sees oldVersion 5).
- Docs: `docs/storage/hand-records.md` describes the pending-blocked behaviour.
- `npx vitest run tests/storage/` → 43 passed, 1 skipped. `npm run lint` clean; `npm run typecheck` clean; `npm run format` run.
- `npm test` → 346 files passed / 11 skipped; 1539 tests passed / 60 skipped.
