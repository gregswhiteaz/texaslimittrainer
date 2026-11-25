# TASK-12.1 build log

## BUILD (2026-11-25)

Implemented the whole spec: `src/table/settings.ts`, DB v4 + `readSettings()` in `src/storage/hand-store.ts`,
`__APP_VERSION__` define + `src/ui/app-version.ts`, `SettingsScreen`, Home `onSettings` entry, `settings` route
in `App.tsx` (no `;` in the union's comments), CSS, screen-list entry, dialog-detector regex (D-6), e2e IDB
helpers at v4, D-4 locked edits (home, resume, play-money e2e; screen-list acceptance), new tests for SPEC-01..13
(incl. SPEC-12: upgrade from a v3 DB with one hand, session and report, all read back unchanged), docs.

Not in the spec but required:
- `tests/ui/play-money.test.ts` (unit, not locked): its fixture is compared with the real `SCREEN_LIST`, so the
  spec's "Unchanged" was wrong. Fixture gains the `settings` route; the unlisted-screen case now uses a
  hypothetical `help` route / `HelpDialog`. Every assertion kept.
- `tests/storage/hand-store.test.ts` (unit, not locked): expected `DB_VERSION` 3 → 4.
- `docs/storage/sessions.md`, `docs/storage/reports.md`: stale "version 3" → 4.
- `e2e/settings.spec.ts` tab walk: Tab from the focused h1 leaves the page before wrapping to `← Home` (which
  precedes the h1), so the walk tolerates one page exit and stops at a repeat or second exit.

Commands and results:
- `npm run typecheck` — 0 errors. `npm run lint` — 0 problems, Prettier clean.
- `npm test` — 304 files passed, 1 failed; 1396 tests passed, 1 failed, 46 skipped. The failure is
  `tests/storage/session-end.acceptance.test.ts` "a v2 database upgrades to v3 with its records intact"
  (`expect(DB_VERSION).toBe(3)` and store names `['hands','reports','sessions']`) — locked by TASK-10.1.
- `npm run build && npx playwright test` — 322 passed, 2 failed, 8 did not run (serial block), 18 skipped.
  Failures: `e2e/home-control.spec.ts:136` (Chromium + WebKit), `expectSessionUnchanged` line 113
  `storeNames` toEqual `['hands','reports','sessions']`, received `+ "settings"` — locked by TASK-2.14.
  `e2e/settings.spec.ts` 6/6 passed; home, resume, play-money, statistics specs pass.
- No vitest/playwright/preview process left running.

Blocked: both failing files are locked acceptance tests of earlier tasks not unlocked by Q-5; see blocked.json.
