# Changes — TASK-3.2

- `src/table/action-bar.ts` — created: headless action bar model (`ActionButton`, `ActionBarModel`, `IDLE_BUTTONS`, `actionLabel`, `actionBar(view)`, `userActionBar(table)`) (D-1, D-3, D-5, A-1).
- `src/ui/table/ActionBar.tsx` — created: renders the model as the "Your actions" group of native buttons, disabled when the model is; no key handlers.
- `src/ui/table/Table.tsx` — modified: replaced the inline verb buttons and `ACTION_LABELS` with `<ActionBar model={userActionBar(table)} />`, shown from the deal on (enabled or disabled).
- `src/ui/styles.css` — modified: replaced `.table-actions` rules with `.action-bar` styles from the storyboard (52 px tall, min 120 px wide, dark neutral, disabled opacity 0.45) (A-2, A-3).
- `tests/table/action-bar.test.ts` — created: SPEC-07, SPEC-08.
- `tests/table/action-bar.acceptance.test.ts` — created: SPEC-05 (10,000 seeded states).
- `tests/ui/action-bar.acceptance.test.tsx` — created: SPEC-01..SPEC-04, SPEC-06.
- `e2e/action-bar.spec.ts` — created: SPEC-09..SPEC-13 (Chromium and WebKit). Axe under the paused clock runs with Web Worker-backed timers swapped in for the scan only, since axe needs running timers and the fake clock would otherwise hang it.
- `e2e/table.spec.ts` — modified (TASK-3.1 acceptance test, D-4 only): `VERBS` -> `BUTTON_NAME` regex in `expectNoBuyInControl`; `checkOrCall` clicks the `Call $<n>` button; both `toHaveCount(0)` checks replaced by `expectDisabledBar` (visible, at least one button, all disabled).
- `doit/TASK-3.2/bar-turn.png` — created: review screenshot (Chromium 1280x720, pinned words 9e3779b9 00000001 00000002 00000003, user's preflop turn); not shipped.
- `doit/TASK-3.2/bar-waiting.png` — created: review screenshot of the same hand after "Call $4", Eli to act (disabled bar); not shipped.

No new dependencies.
