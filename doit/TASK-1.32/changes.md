# TASK-1.32 changes

- `src/engine/cards.ts` — exports `echoText` (TASK-1.21 echo rule: first 10 chars + `...`), used by `parseCard`; `parseCards` throws `RangeError('Invalid card: expected a string, got <typeof>')` on non-strings.
- `src/engine/hand-evaluator.ts` — `evaluate` throws `RangeError('Invalid hand: expected an array, got <typeof>')` on non-arrays (A-2, A-3).
- `src/engine/hand.ts` — `createHand` shape guard `RangeError('Invalid hand config')` (config, stakes, seat entries non-object; seats/deck non-array; each field read once); `Invalid seat` and `Button must be a dealt-in seat` echo via `echoText(String(...))`.
- `src/engine/deck.ts` — `Invalid replay code` echo via `echoText(String(code))`.
- `tests/engine/input-guards.acceptance.test.ts` — new acceptance tests SPEC-01..SPEC-05.
- `tests/engine/deck.test.ts` — D-1: the 32-char replay-code assertions now expect the truncated message (SPEC-06).

No new dependencies.
