## BUILD (2026-11-27)
- Added `createSettingsSaver` (src/ui/settings/settings-save.ts); App saves through it, reverts and sets `settingsSaveFailed` on a failed latest save, logs every failure, clears the flag on each change and on opening Settings. SettingsScreen renders the approved `role="alert"` message after the header; `.settings-error` uses #ff6b70 at 14px. Docs updated.
- Superseded outcome carries an optional `error` so App can still log superseded failures (A-6); otherwise the interface is as in spec §5.
- Tests: `tests/ui/settings-save.test.ts` (3), `tests/ui/settings-save-failed.acceptance.test.tsx` (1) — 4 passed. `npx playwright test e2e/settings-save-failed.spec.ts e2e/opponent-styles.spec.ts e2e/settings.spec.ts` — 18 passed (Chromium + WebKit).
- `npm run typecheck`, `npm run lint` clean; `npm run format` run; `npm test` exit 0.
