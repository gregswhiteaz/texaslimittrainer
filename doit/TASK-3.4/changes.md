# Changes — TASK-3.4

- `src/engine/hand.ts` — modified: exports `minimumStack(stakes)`; `validate` uses it (A-8). No behaviour change.
- `src/table/session.ts` — modified: `TableState.button` (set by `seatSession`, used by `dealHand`); `NEXT_HAND_DELAY_MS`,
  `nextHandDelay`, `nextHand` with the TEMPORARY Q-4 top-up; `completedHand` uses one `dealtIn` helper that throws
  `RangeError('Seat <n> is not dealt in')` (A-5).
- `src/table/hand-result.ts` — created: `handName`, `handResultView`, `WinnerView`, `HandResultView` (headless).
- `src/table/table-view.ts` — modified: dealer marker falls back to `table.button`; stack helper throws
  `RangeError('Seat <n> has no stack')` instead of `?? 0` (A-5).
- `src/ui/table/useTableSession.ts` — modified: 1.5 s next-hand timer (`dealHand(nextHand(t), code)`), `holdNextHand`
  option, `onHandComplete` keyed on `handNumber` (A-1, A-3, A-4).
- `src/ui/table/Table.tsx` — modified: `HandResult` block (Hand over title, winner lines, hand names, winners' cards)
  replaces the bare "Hand over" status.
- `src/ui/styles.css` — modified: `.hand-result` styles (A-9 colours; compact one-row layout, 30×42 shown cards).
- `tests/support/table-scenarios.ts` — modified: E4 `button: 6` in `tableAt`; `fixedDeck` helper and `KINGS_SHOWDOWN`,
  `AVA_UNCONTESTED`, `SPLIT_STRAIGHT` states.
- `tests/table/hand-result.test.ts` — created: SPEC-05, SPEC-06.
- `tests/table/next-hand.test.ts` — created: SPEC-08, SPEC-12, SPEC-15.
- `tests/table/next-hand.acceptance.test.ts` — created: SPEC-09, SPEC-10, SPEC-11, SPEC-13.
- `tests/ui/hand-result.acceptance.test.tsx` — created: SPEC-01, SPEC-02, SPEC-03.
- `e2e/next-hand.spec.ts` — created: SPEC-04, SPEC-07, SPEC-14 (Chromium + WebKit).
- `e2e/table.spec.ts` — modified: D-2 edits E1 and E2 only (paused clock, `nextTurnPaused`, face-up count outside the
  result, 28 × 50 ms instead of 3 s, header still Hand #1).
- `e2e/action-bar.spec.ts` — modified: D-2 edit E3 only (second context on its own paused clock).
- `doit/TASK-3.4/result-showdown.png`, `doit/TASK-3.4/result-uncontested.png` — created: 1280×720 Chromium screenshots
  of a showdown and an uncontested result (requested by the orchestrator).

No new dependencies.
