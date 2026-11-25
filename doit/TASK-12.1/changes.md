# TASK-12.1 changes

- `vite.config.ts` — `define: { __APP_VERSION__ }` from `package.json`'s `version` (A-4).
- `src/ui/app-version.ts` — new: `APP_VERSION` and `versionText(v)` (`Version <v>`).
- `src/ui/settings/SettingsScreen.tsx` — new: Settings screen (← Home, h1, Play / Display / Your data, version line) (D-3).
- `src/ui/home/HomeScreen.tsx` — optional `onSettings` prop; Settings entry last in the Main menu (A-1, D-2).
- `src/ui/App.tsx` — `settings` member of `type Screen`, `case 'settings'`, `onSettings` on Home.
- `src/ui/styles.css` — `.settings-screen`, `.settings-header`, `.settings-section`, `.settings-version`.
- `src/table/settings.ts` — new headless model: `Settings`, `DEFAULT_SETTINGS`, `parseSettings`, `SettingsReader` (A-5, A-6).
- `src/storage/hand-store.ts` — `DB_VERSION = 4`, `SETTINGS_STORE`, `SETTINGS_KEY`, v4 upgrade step with the default record, `readSettings()` (D-1).
- `e2e/support/screen-list.ts` — `settings` screen entry.
- `e2e/support/play-money.ts` — dialog detector accepts a JSX-expression `role` (D-6).
- `e2e/support/hand-records.ts` — opens `tlh-trainer` at v4 and mirrors the v4 step (A-7).
- `e2e/home.spec.ts` — locked edit (D-4/Q-5): Main menu has 3 entries incl. Settings.
- `e2e/resume.spec.ts` — locked edit (D-4/Q-5): 3/4 entries, Settings last, Statistics before it.
- `e2e/play-money.spec.ts` — locked edit (D-4/Q-5): walk visits Settings.
- `tests/ui/screen-list.acceptance.test.ts` — locked edit (D-4/Q-5): routes gain `settings`.
- `tests/ui/play-money.test.ts` — unit fixture updated: `APP_SOURCE` gains the `settings` route (it is compared with the real `SCREEN_LIST`); the "unlisted screen/dialog" case uses a hypothetical `help` route and `HelpDialog` instead of `settings`. Every check kept.
- `tests/storage/hand-store.test.ts` — expected `DB_VERSION` 3 → 4.
- `tests/ui/home-settings.acceptance.test.tsx` — new: SPEC-01.
- `tests/ui/settings.acceptance.test.tsx` — new: SPEC-03, SPEC-04 (+ screen markup).
- `tests/ui/dialog-detector.acceptance.test.ts` — new: SPEC-09.
- `tests/table/settings.test.ts` — new: SPEC-13.
- `tests/storage/settings-store.test.ts` — new: SPEC-11, SPEC-12 (upgrade from a v3 DB with data).
- `e2e/settings.spec.ts` — new: SPEC-02, SPEC-05, SPEC-06, SPEC-10.
- `docs/ui/navigation.md` — Settings row and paragraph, screen count, history and tests lines.
- `docs/ui/play-money.md` — `statistics` and `settings` rows, JSX-expression role rule.
- `docs/storage/hand-records.md` — database version 4 and the `settings` store.
- `docs/storage/sessions.md` — database version 4, v4 upgrade step (was stale at 3).
- `docs/storage/reports.md` — database version 4 (was stale at 3).
- `docs/storage/settings.md` — new: record format, defaults, key, upgrade step, `readSettings` rules.

No new dependencies.
- `tests/storage/session-end.acceptance.test.ts` — DB_VERSION 4, stores incl. settings (TASK-10.1 locked; unlocked; orchestrator edit, Block 1)
- `e2e/home-control.spec.ts` — store names incl. settings (TASK-2.14 locked; unlocked; orchestrator edit, Block 1)
