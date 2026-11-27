# Changes — TASK-13.13

- `e2e/error-recovery-history.spec.ts` — new: SPEC-01 (Return Home after a hand-1 error clears `history.state.tlhTable`; one Back leaves the app) and SPEC-02 (the 0-hand paused session is offered for Resume and Resume deals Hand #1, per Q-1 A).
- `src/ui/AppRoot.tsx` — removed the redundant `generation` state and the `key` prop on `App` (D-1, SPEC-03).
- `docs/ui/navigation.md` — recorded the 0-hand Resume decision (TASK-13.13 Q-1) and added the new e2e file to the Tests list.

No new dependencies.
