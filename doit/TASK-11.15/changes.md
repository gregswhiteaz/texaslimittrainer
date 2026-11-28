# TASK-11.15 changes

- `e2e/support/keyboard.ts` — new: `TabKey`, `chooseButtonTabKey(reaches)` (Tab, then Alt+Tab, else throw) and `buttonTabKey(page)` (probe page in the same context, closed in `finally`); doc comment names macOS Full Keyboard Access.
- `e2e/keyboard-helper.spec.ts` — new: SPEC-02 (real-browser probe, page count and focus unchanged) and SPEC-02b (injected fallback) tests.
- `e2e/report-navigation.spec.ts` — Tab-order step uses `buttonTabKey`; comment names the macOS cause; unused `browserName` dropped (SPEC-01).
- `e2e/back-focus.spec.ts` — Tab press uses `buttonTabKey`; comment; `browserName` dropped (SPEC-04).
- `e2e/settings.spec.ts` — `tabOrder` call uses `buttonTabKey`; comment; `browserName` dropped (SPEC-05).
- `e2e/error-recovery.spec.ts` — `expectErrorScreen(page)` uses `buttonTabKey`; `browserName` param, six callers and five fixtures dropped (SPEC-06).

No new dependencies.
