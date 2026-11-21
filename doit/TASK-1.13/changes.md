# Changes: TASK-1.13

- `tests/engine/illegal-actions.acceptance.test.ts` — new locked acceptance file: AC#1–AC#4 scripted rejections (deep-freeze + JSON snapshot + structuredClone + legal follow-up) and AC#5 seeded 100,000-state injection run (SPEC-01..05).
- `src/engine/hand.ts` — doc comments only on `ApplyErrorCode` and `applyAction` documenting the three rejection codes, their precedence and the no-mutation guarantee. No logic change.

New dependencies: none.
