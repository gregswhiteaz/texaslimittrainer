# TASK-1.31 changes

- `src/engine/hand.ts` — `validate` rejects stacks totalling more than `Number.MAX_SAFE_INTEGER` with `RangeError('Stacks must total at most 9007199254740991')` (D-1, D-2), after the per-seat check (A-1); `minimumStack` doc comment and the A-4 comment no longer claim a raise cap (AC#4).
- `tests/engine/chip-safety.acceptance.test.ts` — new acceptance tests SPEC-01..SPEC-05 (worst-case always-raise hand at the bound, random legal play, total-stack rejection, A-4 factor 10, read-once config access).
- `tests/engine/input-hardening.acceptance.test.ts` — TASK-1.21 locked file, user-approved edit (qa.md Q-2) to AC#2 only: seat 3 at `MAX_SAFE_INTEGER - 800` is accepted; seat 3 at `MAX_SAFE_INTEGER` throws the new total-stack error.

No new dependencies.
