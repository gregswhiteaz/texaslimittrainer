# Changes — TASK-1.9

- `src/engine/hand.ts` — all-in calls: call amount `min(owe, stack)`; `allIn` set when a call/bet/raise empties the stack; all-in seats skipped for `toAct` and round closing; `gather` returns the uncalled top street contribution to its bettor (A-5) and reports it; new `dealNextStreet` helper (D-5 indices) used for the next street and the D-7 runout when ≤ 1 seat can still bet; `HandResult.returned` set on fold-out and showdown; `createHand` floor is `bigBlind + 1` (D-1); doc comments for `allIn`, `HandResult`, `minimumStack`, `HandState.street`.
- `src/engine/invariants.ts` — C3/C4 subtract `result.returned`; new C5 `returnedMessage` (returned = top total contribution − second) run in `checkStep` on the completing step when chips is otherwise clean (D-4).
- `src/playtest/runner.ts` — `largestPot` adds `result.returned.amount` (D-5).
- `tests/engine/all-in.acceptance.test.ts` — new: SPEC-01..07.
- `tests/engine/all-in-invariants.acceptance.test.ts` — new: SPEC-08, SPEC-09.
- `tests/table/hand-result-uncalled.acceptance.test.ts` — new: SPEC-10.
- `tests/engine/hand.test.ts` — U1 (floor case 4 / "at least 5") and new unit test `all-in flags, floor and actor order` (SPEC-11); fix: exact whole-stack call played to showdown and to an immediate runout pins no `returned` and award = full pot (J-1-02).
- `tests/engine/hand.acceptance.test.ts` — E1 (locked): preflop fold-out result 4 + `returned {3, 2}`; flop award 24.
- `tests/engine/fold-out.acceptance.test.ts` — E2 (locked): 36 → 32.
- `tests/table/review.acceptance.test.ts` — E3 (locked): walk winner amount 6 → 4.
- `tests/ui/hand-result.acceptance.test.tsx` — E4 (locked): 'Ava wins $16' → 'Ava wins $12'.
- `e2e/next-hand.spec.ts` — E5 (locked): 'Ava wins $12' → '$8' (×2), 'Ben wins $12' → '$8'; confirmed by running the spec.
- `e2e/review.spec.ts` — E6 (locked): 'You win $6' → 'You win $4'.
- `tests/engine/input-hardening.acceptance.test.ts` — E7 (locked): floor message 96 → 5.
- `tests/engine/chip-safety.acceptance.test.ts` — E8 (locked): floor message 96 → 5.
- `tests/table/next-hand.test.ts` — U2: stacks `[95, …]` → `[4, …]`.
- `tests/playtest/runner.test.ts` — fix: unit test pinning Largest pot counts returned chips (walk $6, flop fold-to-raise $36) (J-1-01).
- `tests/playtest/cli.test.ts` — U3: 'Result: seat 5 wins $6' → '$4'.
- `tests/support/table-scenarios.ts` — U4: AVA_UNCONTESTED comment ($12, $4 bet returned).

No new dependencies.
