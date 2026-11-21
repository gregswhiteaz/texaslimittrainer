# Changes: TASK-3.7

- `src/engine/hand.ts`: exports `BetContext` and `fullBetTarget` (full bet level + bet unit). `betUnit` / `fullBetLevel` take `BetContext`; `legalActions` uses `fullBetTarget`. No behaviour change (10k playtest byte-identical).
- `src/table/action-bar.ts`: `AmountUnit`, `LabelOptions`, all-in and chip wording in `actionLabel`, new `isShortAllIn`, and `actionBar(view, unit = 'dollars')`. `userActionBar` still uses dollars (A-2), with a TASK-2.4 comment.
- `tests/support/table-scenarios.ts`: optional per-seat `stacks` override on `userTableAfter`; exports `CAPPED_FLOP`, `CALL_ALL_IN`, `RAISE_ALL_IN`, `BET_ALL_IN`.
- `e2e/support/table-scenes.tsx`: registers scenes `capped-flop`, `call-all-in`, `raise-all-in`, `bet-all-in`.
- `e2e/support/table-harness-bundle.ts`: widens `TableScene` with the four scene names.
- `tests/ui/action-bar-limits.acceptance.test.tsx`: new acceptance tests SPEC-01..SPEC-07 and SPEC-11 (incl. a disabled bar with real actions, FIX R1).
- `tests/table/action-bar-limits.acceptance.test.ts`: new acceptance tests SPEC-08 (100,000-state property, D-5 oracle) and SPEC-09.
- `tests/table/action-bar.test.ts`: adds the SPEC-13 unit test.
- `e2e/action-bar-limits.spec.ts`: new Playwright acceptance tests SPEC-10 and SPEC-12 (Chromium and WebKit).

No new dependencies.
