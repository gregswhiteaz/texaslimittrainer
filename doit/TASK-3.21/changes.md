# TASK-3.21 changes

- `src/table/session.ts` — removed the TEMPORARY top-up, the `minimum` local and the `minimumStack` import; every seat but a cash bot on $0 is carried at its final stack. Added `sitAndGoStopped`, the `'stopped'` `NextStep`, the `dealHand` guard and the null `nextHandDelay` for a stopped sit-and-go (D-1). `rebuy` refuses at `MAX_SESSION_COUNT` (A-1), which now lives here. Reflowed the `nextHand` docstring.
- `src/table/session-record.ts` — imports and re-exports `MAX_SESSION_COUNT` from `./session` (A-3); local definition removed.
- `src/ui/table/useTableSession.ts` — `dealAfterDone` deals nothing once a sit-and-go has stopped; `rebuyAndDeal` returns the table unchanged at the rebuy cap (A-2).
- `src/ui/table/BustDialog.tsx` — one-line comment on the Escape `onKeyDown`.
- `src/engine/hand.ts` — `minimumStack` docstring no longer names the session top-up.
- `docs/storage/sessions.md` — dropped the TEMPORARY top-up wording; a stopped sit-and-go's record is not resumable until TASK-5.2.
- `tests/table/short-stack.acceptance.test.ts` — new: SPEC-01 to SPEC-06.
- `e2e/short-stack.spec.ts` — new, every push: SPEC-07 (Chromium and WebKit).
- `tests/table/next-hand.acceptance.test.ts` — locked (TASK-3.4) re-pin per spec §5 (SPEC-08); same expect count (45).
- `tests/table/rebuy.acceptance.test.ts` — locked (TASK-3.11) re-pin per spec §5 (SPEC-09); same expect count (82).
- `tests/table/next-hand.test.ts` — user on 95 kept at 95, sit-and-go seat 1 on 0 kept at 0 (SPEC-10).
- `tests/table/game-type.test.ts` — SPEC-08 test renamed to "never refills a short or busted seat", deviation comment removed, 479 stays 479 and a seat on 0 stays 0 (SPEC-10).
- `tests/support/session-play.ts` — `playSession` rebuys a busted user before dealing (A-5).
- `tests/table/session.acceptance.test.ts` — type-only: the `steps` annotation includes `'stopped'` so it typechecks with the widened `NextStep` (same as TASK-3.11 did for `'rebuy'`); no assertion changed; not hook-locked.

No new dependencies.
