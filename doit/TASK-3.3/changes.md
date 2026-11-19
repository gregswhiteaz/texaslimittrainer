# Changes — TASK-3.3

## Source
- `src/table/table-view.ts` — new: headless view model `tableView` (reads the hand only via the user's `PlayerView`, never the replay code), `lastActionText`, `positionName`, `seatSlot`, `slotPosition`, `potTotal`, `headerText`.
- `src/table/session.ts` — `BotStyle` union (Q-1), `SessionSeat.style: BotStyle | null`, `TableState.handNumber` (A-3, `seatSession` sets 1).
- `src/ui/table/Table.tsx` — presentational `TableView` (header with Leave table, seats in slots, felt with board, placeholders and pot, dealer marker, "To act" badge, action bar, Hand over) and the stateful `Table`; `data-to-act` removed.
- `src/ui/table/TableScreen.tsx` — optional `onLeave` prop passed to `Table`; `<main className="table-screen">`.
- `src/ui/App.tsx` — Leave table returns to Home with the h1 focused (Q-4).
- `src/ui/cards/PlayingCard.tsx` — `CardBack` `size` prop; `'small'` draws 30 × 42 (default stays 60 × 84).
- `src/ui/config/GameConfigScreen.tsx` — labels for the widened `BotStyle` union.
- `src/ui/styles.css` — table layout from the storyboard (header, oval felt, seat cards, board slots, to-act border/badge, dealer disc).

## Tests
- `tests/support/table-scenarios.ts` — new: scripted storyboard hand (PREFLOP … SHOWDOWN, full history) and the seat-1 session; shared by Vitest and the e2e scene harness.
- `tests/table/table-view.test.ts` — new: SPEC-16 unit tests of the view model.
- `tests/ui/table-display.acceptance.test.tsx` — new: SPEC-01, 02, 03, 05, 06, 07, 09, 11, 13.
- `e2e/table-display.spec.ts` — new: SPEC-04, 08, 10, 12, 14, 15, 18 (Chromium + WebKit).
- `e2e/support/table-scenes.tsx` — new: test-only page rendering a named scripted scene with the shipped CSS (`?inline`).
- `e2e/support/table-harness-bundle.ts` — shared IIFE build helper; `buildTableScenes()` and `openTableScene()`.
- `e2e/support/table-locators.ts` — new: `toActSeats` and `expectToAct`.
- `e2e/table.spec.ts` — D-5 edits 1–5 (plus the `expectToAct` import).
- `e2e/action-bar.spec.ts` — D-5 edit 6 (plus the `expectToAct` import).
- `e2e/home.spec.ts` — D-5 edit 7 (plus the `expectToAct` import).
- `tests/ui/table.acceptance.test.tsx` — D-5 edit 8.

## Artefacts
- `doit/TASK-3.3/table-scene.png` — 1280 × 720 Chromium screenshot of the `flop-bet` scene (user to act on the flop).
- `doit/TASK-3.3/table-live.png` — 1280 × 720 Chromium screenshot of the live app mid-hand (flop, user to act).

No new dependencies.
