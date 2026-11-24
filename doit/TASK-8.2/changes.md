# Changes — TASK-8.2

- `src/table/session.ts` — `UserDecision.hinted?`; `applyUserAction(table, action, observed?, hinted = false)` writes `hinted: true` only when hinted (A-2, A-3).
- `src/table/hand-record.ts` — `decisionRecord` writes `hinted` from the decision; doc comment updated.
- `src/table/hint.ts` — `hintedAt(state, decision)`: true iff the hint was opened at this decision (A-1).
- `src/ui/table/useTableSession.ts` — `act(action, hinted?)` passes the flag to `applyUserAction`.
- `src/ui/table/Table.tsx` — `onAct` passes `hintedAt(hint, table.hand)` before resetting the hint.
- `tests/support/table-scenarios.ts` — `userTableAfter` gains a 6th `hints` parameter (drives the real hint state machine); exports `REVIEW_DECK` and `LIMP_THEN_BET`.
- `tests/table/hinted.acceptance.test.ts` — new: SPEC-01..SPEC-05 acceptance tests.
- `tests/table/hint.test.ts` — `hintedAt` / `applyUserAction` / `decisionRecord` units (SPEC-06).
- `e2e/hinted.spec.ts` — new: SPEC-07, SPEC-08 live-table tests reading stored records.
- `docs/storage/hand-records.md` — `hinted` row describes TASK-8.2 behaviour.
- `docs/ui/hint.md` — new "Hinted decisions" section.

No new dependencies.
