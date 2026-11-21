# Fix brief — TASK-1.10 (code review round 1 MINORs, applied in-story)

No blocking findings. Two small improvements:

1. **Strengthen** `tests/engine/side-pot-invariants.acceptance.test.ts` (unlocked for this, add-only): add case (f) —
   the S1 turn state with pots collapsed to a single pot `[{amount: 104, eligible: [1,2,3,4]}]` while contributions
   make 3 levels; expect exactly one `pot-eligibility` violation with message `there are 1 pots but contributions make 3`
   (use the exact P6 wording from the spec/impl). Prove it bites: the guard mutant `pots.length <= 1 || levels.length <= 1`
   must make it fail. Don't change existing cases.
2. **Rename** in `src/engine/invariants.ts` (~line 267) the per-seat capped contribution `level` to `matched` so it
   isn't confused with `levels`. No behaviour change.

Optional NIT (skip if it adds lines): share the top/second scan with `returnedMessage`.
Run `npm run format` before the gate. Never push.
