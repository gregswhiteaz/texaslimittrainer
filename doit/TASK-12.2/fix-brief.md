# Fix brief — TASK-12.2 (review round 1)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. [MAJOR] tests/ui/opponent-styles.acceptance.test.tsx:disabled-until-loaded-guard-untested (code review)
- Where: tests/ui/opponent-styles.acceptance.test.tsx:74
- Problem: The 'settings omitted -> disabled' check (SPEC-01, A-1) cannot fail if the `settings === undefined` part of the disabled condition is removed. The helper passes `onSettingsChange={settings && noop}`, so the loading render has BOTH settings and onSettingsChange undefined, and `disabled={onSettingsChange === undefined}` alone still renders disabled. App always passes onSettingsChange, so in the real app the only thing keeping the checkbox disabled before the launch read settles is the untested `settings === undefined` clause. Same for the `settings &&` guard in onChange (renderToString cannot fire events, and no e2e can observe the pre-load window). Mutating SettingsScreen.tsx:41 to `disabled={onSettingsChange === undefined}` and :43 to `onSettingsChange?.({ ...(settings ?? DEFAULT_SETTINGS), ... })` passes every test, which is exactly the defaults-overwrite A-1 is meant to prevent.
- Evidence: tests/ui/opponent-styles.acceptance.test.tsx:69-76 `onSettingsChange={settings && noop}` then `render(undefined)` at :90; src/ui/settings/SettingsScreen.tsx:41 `disabled={settings === undefined || onSettingsChange === undefined}`; src/ui/App.tsx:383-387 always passes `onSettingsChange={changeSettings}`.
- Expected fix: In the SPEC-01 test, render the loading case the way App does: `<SettingsScreen onHome={noop} version="1.2.0" settings={undefined} onSettingsChange={noop} />` and assert the input is `disabled="" checked=""` (keep or add the both-undefined case separately). This is a locked test, so route the edit through the orchestrator.

