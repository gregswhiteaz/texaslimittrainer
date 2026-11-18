# Changes — TASK-1.4

- `src/engine/hand.ts` — new: hand engine types, `createHand`, `legalActions`, `applyAction`, `splitPot` (blinds, deal, burns, betting rounds, fold-out, showdown, odd-chip split).
- `tests/engine/hand.acceptance.test.ts` — new: AC#1–AC#7 and burn-card acceptance tests (SPEC-01–04, 06, 08, 09, 18).
- `tests/engine/hand.property.test.ts` — new: AC#4 bet-size property over 2,000 seeded hands and AC#8 100,000 seeded hands (SPEC-05, SPEC-11).
- `tests/engine/hand.test.ts` — new: unit tests for BB option/reopening, `splitPot`, illegal actions, config validation (incl. stakes relationships), purity (SPEC-07, 10, 12, 13, 14).

No new dependencies.
