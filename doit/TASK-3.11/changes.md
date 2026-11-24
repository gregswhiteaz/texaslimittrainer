# Changes: TASK-3.11

- `src/table/session.ts` — `TableState.rebuys`; `userBusted(table)` and `rebuy(table)`; `'rebuy'` NextStep; `dealHand` refuses the rebuy step; `nextHandDelay` null on a bust; `nextHand` carries a cash user's $0 before the TEMPORARY top-up.
- `src/table/session-record.ts` — `rebuys` written from and restored to `TableState.rebuys`, capped at `MAX_SESSION_COUNT`; a cash user seat on 0 is left out of `assertChips` (D-1); the button check now reads `config.seats`.
- `src/ui/table/useTableSession.ts` — `rebuy()` action; exported pure updaters `dealAfterDone` (auto-deal and Deal next hand, no-op on a bust) and `rebuyAndDeal` (Rebuy then deal).
- `src/ui/table/BustDialog.tsx` — new: the modal Out of chips dialog (native `<dialog>`, `showModal()` in a layout effect, Escape ignored).
- `src/ui/table/Table.tsx` — renders `BustDialog` on a bust with no held review; `onRebuy` prop wired from the hook.
- `src/ui/styles.css` — dialog, backdrop and button styles.
- `tests/support/table-scenarios.ts` — `rebuys: 0` in `tableAt`.
- `tests/table/next-hand.test.ts` — re-pinned the user-at-$0 stack expectation (0 stays 0; 95 still tops up to 160); same number of checks.
- `tests/table/session.acceptance.test.ts` — type-only: the `steps` annotation includes `'rebuy'` so it typechecks with the widened `NextStep`; no assertion changed.
- `tests/table/rebuy.acceptance.test.ts` — new: SPEC-01..05, SPEC-07.
- `tests/table/rebuy.test.ts` — new: SPEC-08, SPEC-09.
- `tests/ui/bust-dialog.acceptance.test.tsx` — new: SPEC-06, SPEC-10.
- `e2e/rebuy.spec.ts` — new every-push spec: SPEC-11..14 (Chromium and WebKit, axe).
- `docs/storage/sessions.md` — `rebuys` field, the user's $0 stack, the stored bust state, validation exception and cap, new tests.
- `docs/ui/navigation.md` — the bust dialog's Leave table pauses to Home.

No new dependencies.
