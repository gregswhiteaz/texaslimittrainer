# Changes: TASK-1.14

- `src/engine/hand.ts` — private `betUnit` and `fullBetLevel` (D-1); `legalActions` offers the bet/raise to `min(fullBetLevel + unit, streetContribution + stack)` and withholds it from seats that already acted (`hasActed`) or whose stack doesn't exceed the call; `applyAction` counts a bet/raise toward `betCount` and clears others' `hasActed` only when `2 × (amount − level) ≥ unit` (REQ-016.5, REQ-017.7). Doc comments on `hasActed`, `betCount`, `legalActions`.
- `src/engine/invariants.ts` — private `unitOf`/`countedBets` (checker's own derivation, D-2); bet-size clause accepts an all-in short bet/raise; `betCapMessage` counts only counted bets per street.
- `tests/engine/hand.test.ts` — D-3: the $6-stack-facing-$4 assertion now expects `[fold, call 4, raise 6]`.
- `tests/engine/short-all-in.acceptance.test.ts` — new: SPEC-01..07 (AC#1–AC#7).
- `tests/engine/short-all-in.test.ts` — new: SPEC-08..12 (completion, cumulative, turn/odd-unit thresholds, blinds and cap, checker).
- `tests/engine/short-all-in.property.test.ts` — new: SPEC-13 (20,000 seeded short-stack hands).

New dependencies: none.
