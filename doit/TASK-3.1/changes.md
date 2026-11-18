# Changes — TASK-3.1

- `src/table/session.ts` — created: headless table session (config, `stakesFor`, `buyIn`, default seating A-1, `seatSession`, `nextStep`, `dealHand`, `stepBot`, `applyUserAction`, `userActions`, `completedHand`) (SPEC-01..10).
- `src/ui/table/useTableSession.ts` — created: React hook holding `TableState`; one `setTimeout(…, 0)` per deal/bot step, nothing scheduled on the user's turn or when done; ref-guarded `onHandComplete` (D-2).
- `src/ui/table/Table.tsx` — created: minimal Table screen (seats, stacks, user's cards, board, plain-verb action buttons, "Hand over" status, A-9 data attributes) (SPEC-11..17).
- `src/ui/App.tsx` — modified: renders `<h1>TLH Trainer</h1>` and `<Table />` inside `<main>`.
- `src/ui/styles.css` — modified: felt section, seat list, card rows and action-button styles (buttons get explicit colours for axe contrast in WebKit).
- `tests/table/session.acceptance.test.ts` — created: SPEC-01..SPEC-07.
- `tests/table/session.test.ts` — created: SPEC-08..SPEC-10.
- `tests/ui/table.acceptance.test.tsx` — created: SPEC-11 (`renderToString`).
- `tests/unit/app.test.tsx` — modified: App renders the heading and the seated default table.
- `e2e/table.spec.ts` — created: SPEC-12..SPEC-17 in Chromium and WebKit.
- `e2e/support/table-harness.tsx` — created: test-only entry mounting the $10/$20 `Table` (A-10).
- `e2e/support/table-harness-bundle.ts` — created: `buildTableHarness()` (in-test Vite IIFE build), `openTableHarness(page, bundle, words)` and the `stubReplayWords` crypto stub (A-11).
- `doit/TASK-3.1/table-turn.png` — created: review screenshot (Chromium 1280x720, seeded deal 9e3779b9 00000001 00000002 00000003, user's flop turn); not shipped.
- `doit/TASK-3.1/table-end.png` — created: review screenshot of the same hand at "Hand over"; not shipped.

No new dependencies.
