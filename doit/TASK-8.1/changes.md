# TASK-8.1 changes

Status: build complete except one hook-locked e2e test that conflicts with the spec (see blocked.json).

## Source
- `src/advice/explanations.ts` — AC#12: value-bet, check-free and value-raise second sentence now names "Your equity against the hands that would call"; new `CHART_BASIS`, `CHART_NAMES`, `CHART_POSITIONS` (approved copy).
- `src/advice/explain.ts` — new `chartBasisText(rec)` filling `CHART_BASIS`.
- `src/table/session.ts` — D-2 alternative (fix brief item 1): `ObservedCounts` type, pure `countObserved(counts, completedHand)` and `userObservedSnapshot(table, counts)`. `TableState` and `nextHand` are unchanged from main.
- `src/table/hint.ts` (new) — `hintInput`, `requestHint`, `HintAdvisor`, hint state machine (`NO_HINT`, `toggleHint`, `hintArrived`, `hintFailed`, `shownHint`) and the `HintCardView` model `hintCard`.
- `src/ui/advice/advice-client.ts` — `recommend(view, observed?)`; `observed` is sent only when given (D-4).
- `src/ui/table/HintCard.tsx` (new) — presentational hint card (loading / ready / error).
- `src/ui/table/Table.tsx` — `hint` / `onHint` props on `TableView`, `div.action-row` with the Hint / Hide hint toggle after the unchanged `ActionBar`, card before the row; hint state, request and reset-on-action in `Table`.
- `src/ui/table/useTableSession.ts` — observed counts held in a ref (empty at every mount, Q-3), added at each completed hand; `act` stores `userObservedSnapshot(t, counts)`; returns `observedCounts()` for the hint request.
- `src/ui/styles.css` — `.action-row`, `.hint-toggle`, `.hint-card` styles (storyboard colours).

## Tests
- `tests/support/table-scenarios.ts` — `PREFLOP_DECISION`, `TURN_DECISION`, `TEN_SEAT_FLOP`, `observedStyle(...)` (replaces the spec's `withObserved(table, …)`, since counts are no longer on TableState).
- `tests/table/observed-snapshot.test.ts` (new) — SPEC-01, SPEC-02, SPEC-03, and the resume edge case.
- `tests/table/hint.test.ts` (new) — SPEC-12, SPEC-14 (no equity work: coverage job).
- `tests/ui/hint.acceptance.test.tsx` (new) — SPEC-04 … SPEC-08, SPEC-10.
- `tests/ui/hint-toggle.acceptance.test.tsx` (new) — SPEC-09, SPEC-11.
- `tests/ui/hint-worker.acceptance.test.ts` (new) — SPEC-13.
- `tests/advice/value-copy.acceptance.test.ts` (new) — SPEC-15.
- `tests/advice/explain.test.ts` — re-pinned the three rewritten template strings (4 occurrences); `chartBasisText` unit (SPEC-16).
- `e2e/hint.spec.ts` (new) — SPEC-17 … SPEC-20.
- `e2e/support/table-scenes.tsx` — `ten-seat-hint` scene (TEN_SEAT_FLOP with a ready card); scenes pass `hint` / `onHint`.
- `e2e/support/table-harness-bundle.ts` — `'ten-seat-hint'` added to `TableScene`.
- `e2e/hint-observed.spec.ts` (new, fix r1 item 1) — live-session check: the recommend message's `observed` (empty in hand 1; one `hands: 1` entry per bot seat, ascending, in hand 2) and each stored user decision's snapshot equal to it. In a new file because `e2e/hint.spec.ts` is hook-locked.
- `e2e/support/records-harness.tsx` — the harness log gains `observed`: each completed hand's user-decision snapshots (from `onHandComplete`).

## Docs
- `docs/ui/hint.md` (new) — the hint button, card, behaviour and observed snapshot.
- `docs/advice/explanations.md` — AC#12 wording and the chart basis sentence.

No new dependencies.
- `e2e/table.spec.ts` — BUTTON_NAME allow-list gains Hint (TASK-3.1 locked; unlocked for TASK-8.1 block 2; orchestrator edit)
