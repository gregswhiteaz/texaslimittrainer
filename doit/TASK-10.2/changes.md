# TASK-10.2 changes

- `src/engine/hand.ts`: `forceFold(state, seat)` (REQ-004.8, in turn or out of turn); the round-settling tail of `applyAction` moved into the private `settle` helper shared by both (no behaviour change).
- `src/table/session.ts`: `handInProgress(table)` (A-1) and `foldUserToLeave(table)` (pure; never touches `userDecisions`).
- `src/table/hand-record.ts`: optional `forcedFold: true` on `HandRecord`, written by `handRecord` only for a forced-fold hand; `parseHandRecord` validates it (D-2).
- `src/ui/table/LeaveDialog.tsx` (new): the modal "Leave now? Your hand will be folded." dialog (Cancel focused, Escape = Cancel, Confirm).
- `src/ui/table/useTableSession.ts`: `paused` and `onLeft` options; returns `leaving` and `leave()`; no deal/bot step while paused, no next deal while leaving, `onLeft` once the left hand's write settles; `rebuy`/`dealNext` no-ops while leaving.
- `src/ui/table/Table.tsx`: Leave table opens the dialog during a hand in progress, Cancel returns focus to Leave table, Confirm calls `leave()`; `TableView` gains `leavePrompt`, `leaving` (A-4) and `leaveRef`.
- `src/ui/styles.css`: `.leave-dialog` styles (shared with the bust / end-session dialogs) and disabled header buttons.
- `e2e/support/screen-list.ts`: `leave-dialog` entry.
- `tests/ui/screen-list.acceptance.test.ts`: locked edit D-5 (1) (owner TASK-2.15): dialogs list adds `LeaveDialog`.
- `e2e/play-money.spec.ts`: locked edit D-5 (2) (owner TASK-2.15): visits `leave-dialog` during hand 14, then Cancel.
- `e2e/table-display.spec.ts`: locked edit D-5 (3) (owner TASK-3.3): Leave table during hand 1 → Confirm → 1-hand Session report; retitled.
- `tests/ui/play-money.test.ts`: unit fixture (not locked, owner TASK-2.15) adds a `LeaveDialog.tsx` fixture file, because it compares fixture files with the real `SCREEN_LIST`, which now has `leave-dialog`; expected dialog lists extended. No assertion removed.
- `tests/engine/force-fold.acceptance.test.ts` (new): SPEC-01, SPEC-02, SPEC-03.
- `tests/table/leave-mid-hand.acceptance.test.ts` (new): SPEC-04 … SPEC-07.
- `tests/ui/leave-dialog.acceptance.test.tsx` (new): SPEC-08.
- `e2e/leave-mid-hand.spec.ts` (new): SPEC-09 … SPEC-12.
- `docs/ui/navigation.md`: Leave table during a hand (dialog, freeze, Confirm play-out, forced fold not a decision); TASK-10.1 interim removed.
- `docs/storage/hand-records.md`: `forcedFold` field and its validation on read.
- `docs/ui/play-money.md`: `leave-dialog` row in the screen list.

No new dependencies.
