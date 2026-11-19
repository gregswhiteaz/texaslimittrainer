# Changes — TASK-1.21

- `src/engine/cards.ts` — `parseCard` throws `RangeError('Invalid card: expected a string, got <typeof>')` for non-strings; rejected strings longer than 10 characters are echoed as the first 10 plus `...`.
- `src/engine/hand.ts` — `createHand` copies config into a snapshot (stakes field by field, seats as `{ seat, stack }`, deck, button) and validates/builds only from it; stakes and stacks must be safe integers; stakes rejected when `10 * minimumStack(stakes)` exceeds `Number.MAX_SAFE_INTEGER` (A-4); doc comment updated. Existing messages unchanged.
- `src/engine/seeded-random.ts` — `nextIntUnbiased` guards n (integer in 1..2^32, else `RangeError`), computes the exact 64-bit product from 16-bit halves (private `multiply32`), doc comment states the range. Same Lemire rejection rule; results identical wherever the old double product was exact.
- `tests/engine/input-hardening.acceptance.test.ts` — new acceptance test for AC#1–AC#4 (SPEC-01, 02, 04, 06, 07, 08).
- `tests/engine/cards.test.ts` — unit cases for the non-string message and a 10-character echo via `parseCards` (SPEC-03).
- `tests/engine/hand.test.ts` — unit cases for the A-4 bound (rejected at bigBet 2^50, accepted at 2^40 with 2^44 stacks) (SPEC-05).
- `tests/engine/seeded-random.test.ts` — test-local legacy formula; equality for n in 1..2^21 and all powers of two, including end state (SPEC-09).
- `tests/engine/deck.test.ts` — test-local legacy shuffle; 10,000 codes from `Xoshiro128(2121)` plus the golden codes deal identical decks (SPEC-10).

No new dependencies.
