# TASK-12.10 changes

- `src/storage/hand-store.ts` — exported `UpgradeBlockedError`; `onblocked` rejects the open; a late success of a blocked open closes its connection; `openHandStore` clears its cached open after a blocked open so the next call retries (SPEC-02..04).
- `tests/storage/settings-store.test.ts` — v3 upgrade test opens via `count()` and asserts the raw `settings` record (SPEC-01).
- `tests/storage/upgrade-blocked.test.ts` — new: blocked rejection, retry after the blocker closes, app connection closes on `versionchange` (SPEC-02..04).
- `src/ui/settings/SettingsScreen.tsx` — `← Home` after the h1 in the DOM (SPEC-05, SPEC-07).
- `src/ui/stats/StatisticsScreen.tsx` — `← Home` after the h1, before the totals (SPEC-06).
- `src/ui/styles.css` — `order: -1` on the two header back buttons so the layout is unchanged (SPEC-08).
- `e2e/settings.spec.ts` — locked (Q-2, unlocked under TASK-12.1): Tab-order expectation re-pinned to `expected` and the two wrap comments updated (SPEC-07).
- `e2e/back-focus.spec.ts` — new acceptance: one Tab from the Settings/Statistics h1 reaches `← Home`; `← Home` stays left of the h1 (SPEC-05, SPEC-06, SPEC-08).
- `docs/storage/hand-records.md` — blocked-upgrade behaviour.
- `docs/ui/navigation.md` — one Tab from the Settings/Statistics heading reaches `← Home`.

No new dependencies.
