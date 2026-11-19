## BUILD — 2026-11-18
- Added the headless view model `src/table/table-view.ts` (reads the hand only via `playerView(hand, userSeat)`; never reads `replayCode`), `BotStyle` + `TableState.handNumber` in `session.ts`, `CardBack size="small"`, Game Config style labels.
- Split `Table.tsx` into `TableView` (header + Leave table, seats in clockwise slots, felt with board/placeholders/pot, dealer disc, red border + "To act" badge) and `Table`; dropped `data-to-act`. Leave table wired through `TableScreen` → `App` (Home, h1 focused). Storyboard layout in `styles.css`.
- Tests: `tests/support/table-scenarios.ts` (scripted storyboard hand + seat-1 session), `tests/table/table-view.test.ts` (5), `tests/ui/table-display.acceptance.test.tsx` (9), `e2e/table-display.spec.ts` (7 × 2 browsers), scene harness (`e2e/support/table-scenes.tsx`, `buildTableScenes`/`openTableScene`), `e2e/support/table-locators.ts`.
- D-5 edits applied exactly as listed: `e2e/table.spec.ts` 1–5, `e2e/action-bar.spec.ts` 6 (7 sites), `e2e/home.spec.ts` 7, `tests/ui/table.acceptance.test.tsx` 8; only the `expectToAct` import added besides them. No file reported locked.
- Commands: `npm run typecheck` OK; `npm run lint` OK (after each test-file edit); `npm run e2e` 74 passed (Chromium + WebKit); `npm test` 65 files, 242 passed / 1 skipped, coverage 97.4% lines overall, table-view.ts 100%; `npm run playtest -- --hands 10000 --seed 42` 0 invariant violations; Node type-stripping load of `table-view.ts` and `table-scenarios.ts` OK.
- Screenshots (Chromium 1280 × 720): `doit/TASK-3.3/table-scene.png` (flop-bet scene), `doit/TASK-3.3/table-live.png` (live app, flop, user to act).

## FIX — review round 1 — 2026-11-18
Test-only additions; no `src/` change, no assertion removed. Each matching mutant was applied, seen failing, and reverted.
1. position-button-rotation-untested — fixed: `tests/table/table-view.test.ts` asserts all names for buttons 1-5 at 6-max and button 1 at 3-max. Mutant `const order = [...seats]` now fails.
2. raise-text-amount-indistinguishable-from-added — fixed: asserts `lastActionText({ ...record('raise', 8), added: 4 })` is 'Raised to $8'. Mutant `record.added` now fails ('Raised to $4').
3. latest-record-rule-untested — fixed: the big-blind test also asserts seat 1 shows 'Called $2'. Mutant `.at(0)` now fails ('Small blind $2').
4. showdown-keeps-river-action-untested — fixed: asserts SHOWDOWN seat 2 'Checked', seat 5 'Checked', seat 6 'Folded'. Mutant `const line = view.street` now fails (null).
5. street-line-hidden-at-zero-untested — fixed: `tests/ui/table-display.acceptance.test.tsx` (folded-bot test) asserts no street part for FLOP_BET seats 6 and 1 and no `data-part="street"` in `render(seatSession())`. Mutant `streetAmount >= 0` now fails.
- Commands: focused Vitest (2 files) 14 passed; `npm run typecheck` OK; `npm run lint` OK. The full `npm test` is left to the stop-hook gate.
