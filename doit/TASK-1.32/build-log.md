## Build (BUILD mode)
- Implemented spec §5: `echoText` in cards.ts, `parseCards`/`evaluate` type guards, `createHand` shape guard (read-once locals), truncated echoes in hand.ts and deck.ts; D-1 edit to deck.test.ts; new `tests/engine/input-guards.acceptance.test.ts` (5 tests).
- `npm run typecheck`: pass. `npm run lint`: pass (after `npm run format`).
- `npm test`: 93 files passed; 344 tests passed, 6 skipped.
- `npm run playtest`: exit 0, `Invariant violations: 0`.
