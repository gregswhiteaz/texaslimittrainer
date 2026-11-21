# Changes — TASK-1.10

- `src/engine/hand.ts` — new private `buildPots` (one pot per distinct contribution level of non-folded seats, layer amounts, last pot uncapped; D-1, D-4); `gather` returns rebuilt `pots` instead of a single amount/eligible; `endRound` awards each pot to the best hand among its eligible seats via `splitPot` (D-2) and `foldOut` awards every pot to the last seat; completed hands keep every pot at amount 0 (D-3); `payOut` now sums a seat's shares across all awards; `HandResult.awards` and `HandState.pots` doc comments updated.
- `src/engine/invariants.ts` — new `potStructureMessage` (P6 pot count, P7 level eligibility, P8 layer held/paid) run at the end of `potEligibilityMessage`, skipped for one pot and one level (D-5, A-5).
- `tests/engine/side-pots.acceptance.test.ts` — new: SPEC-01..SPEC-07 scripted side-pot hands and the `splitPot` $29 case.
- `tests/engine/side-pots.property.test.ts` — new: SPEC-08, 100,000 random-stack hands with `checkStep` on every action.
- `tests/engine/side-pot-invariants.acceptance.test.ts` — new: SPEC-09, P6–P8 messages on crafted S1 states.

No new dependencies.
