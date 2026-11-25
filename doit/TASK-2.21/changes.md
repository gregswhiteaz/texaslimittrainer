# TASK-2.21 changes

- `src/storage/hand-store.ts` — `ended()` rechecks `isEnded` on the record it reads inside its own strict transaction (before the 0-hand delete) and aborts with `DOMException('Session already ended', 'ConstraintError')`, writing nothing (D-1, A-1); doc comment updated.
- `src/table/session-report.ts` — `SessionEnder.endSession` doc: an already-ended session is rejected with `ConstraintError`.
- `src/ui/config/GameConfigScreen.tsx` — layout effect focuses Start game when a shown end prompt is cleared while Game Config stays mounted (D-2; covers the failed Confirm).
- `e2e/support/hold-writes.ts` — `armSessionsHold(page, scope = ['sessions'])` stores the sorted scope in `__tlhSessionsHoldScope`; the init script holds the next readwrite transaction with exactly that scope (D-3). Default behaviour unchanged.
- `tests/storage/end-recheck.acceptance.test.ts` — new: SPEC-01, SPEC-02.
- `e2e/end-session-hardening.spec.ts` — new: SPEC-03 (failed end → focus to Start game, values kept), SPEC-04 (Table opens only after the held end transaction commits; 0-hand session polled before hand 1, same id after hand 1).
- `docs/storage/reports.md` — Ending bullet: an already-ended session is rejected inside the transaction.
- `docs/ui/navigation.md` — failure sentence: focus returns to Start game.

No new dependencies.
- `doit/TASK-2.21/build-log.md` — build log.
