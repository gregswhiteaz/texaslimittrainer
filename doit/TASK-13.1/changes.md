# TASK-13.1 changes

- `src/ui/AppRoot.tsx` — new: top-level error boundary plus window `error` / `unhandledrejection` listeners; renders `App` (keyed by generation) or `ErrorScreen`; Return Home steps off the Table history entry, prewarms/replaces the shared advice client and remounts App on Home.
- `src/ui/error/ErrorScreen.tsx` — new: the error screen markup (heading, one sentence, native Return Home button) and the D-1 text constants.
- `src/ui/error/unexpected-error.ts` — new: pure classifiers for window error events and unhandled rejections (A-1).
- `src/ui/App.tsx` — modified: optional `returned` prop for the first Home screen (`type Screen` untouched).
- `src/main.tsx` — modified: renders `<AppRoot />` instead of `<App />`.
- `src/ui/advice/advice-client.ts` — modified: `failed` getter; `sharedAdviceClient` replaces a failed client (D-5).
- `src/ui/styles.css` — modified: `.screen .error-home` joins the `.report-home` rule; `.error-screen` / `.error-message` layout.
- `tests/ui/error-screen.acceptance.test.tsx` — new (acceptance, SPEC-08): ErrorScreen markup.
- `tests/ui/unexpected-error.test.ts` — new (unit, SPEC-09): window event classifiers.
- `tests/ui/advice-client-recovery.test.ts` — new (unit, SPEC-10): failed shared client replaced, healthy kept.
- `e2e/support/fault-injection.ts` — new: Playwright init script (Worker wrapper + one-shot focus patch), `armFault`, `workerCount` (D-3).
- `e2e/error-recovery.spec.ts` — new (acceptance, SPEC-01..07, SPEC-12): five flows through the built App.
- `docs/ui/navigation.md` — modified: Error screen row, section and tests (SPEC-13).

No new dependencies.
