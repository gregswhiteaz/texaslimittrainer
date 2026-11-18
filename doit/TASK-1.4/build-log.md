
## BUILD (Code Builder)
- Implemented `src/engine/hand.ts` per spec §5 (D-1..D-5): createHand/legalActions/applyAction/splitPot, casino burns, typed apply errors, pot zeroed after award so Σstack = Σstarting at completion.
- Tests: `tests/engine/hand.acceptance.test.ts` (8 tests: AC#1–AC#7 + burn), `tests/engine/hand.property.test.ts` (2 tests: AC#4 property over 2,000 hands, AC#8 100,000 hands, 300,000 ms timeout, no duration assertion), `tests/engine/hand.test.ts` (5 unit tests).
- `npm run format`, `npm run lint` (0 problems), `npm run typecheck` (clean), SPEC-15 grep (no matches).
- `npm test`: 24 files, 74 tests passed; coverage hand.ts 100% lines, no coverage errors.
