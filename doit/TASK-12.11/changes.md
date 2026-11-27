# TASK-12.11 changes

- `src/ui/settings/settings-save.ts` — new: `createSettingsSaver`, the pure tracker that decides per settled write whether it is the latest (`saved` / `failed` with `revertTo`) or `superseded` (carries `error` when it failed, so App still logs it, A-6).
- `src/ui/App.tsx` — `changeSettings` saves through the saver; `settingsSaveFailed` state; revert on a failed latest save; launch read seeds the saver; flag cleared on each change and on opening Settings.
- `src/ui/settings/SettingsScreen.tsx` — `saveFailed` prop rendering the `role="alert"` message after the header.
- `src/ui/styles.css` — `.settings-error` rule.
- `docs/storage/settings.md` — App reader: new failed-save behaviour.
- `docs/ui/navigation.md` — Display paragraph: the save-failed message.
- `tests/ui/settings-save.test.ts` — unit tests for the saver (SPEC-04, SPEC-05).
- `tests/ui/settings-save-failed.acceptance.test.tsx` — markup test (SPEC-03).
- `e2e/settings-save-failed.spec.ts` — Playwright tests with an inline init script that makes `settings` puts throw (SPEC-01, SPEC-02).

No new dependencies.
