# TASK-1.27 changes

- `src/engine/invariants.ts` — modified; K2a hole-card message (D-1), C3 split into totals (C3a) and per-award shares (C3b, D-2), new K4 deal-order check (`dealOrderMessage`, `deckMismatch`, A-3/A-5), new H1/H2 history check (`historyMessage`, reported by `checkState` as `legal-action`, A-1/A-2), P3 without the `PlayerState` cast, `checkStep` drops checkState's `legal-action` when the step has its own (SPEC-01..05, SPEC-10).
- `src/playtest/runner.ts` — modified; exports `toAction` and `ViolatingHand`, `PlaytestSummary.firstViolation: ViolatingHand | null` narrowed by an `isViolating` type guard (D-4).
- `src/playtest/cli.ts` — modified; `actionText` uses `describeAction(toAction(record))` for player actions; `formatReport` prints the block iff `firstViolation !== null`, `violationBlock` takes a `ViolatingHand` with no null guard (SPEC-08, SPEC-09).
- `tests/support/faulty-engine.ts` — modified; `MAX_ACTIONS_PER_HAND = 1000` and a `bounded` wrapper on every `FAULTS` engine (A-4, SPEC-06/07).
- `tests/engine/invariant-messages.acceptance.test.ts` — new; acceptance tests for SPEC-01..04.
- `tests/engine/invariants.test.ts` — modified; K2 hole-card and C3 award-share rows use the new messages; new test `history violations merge into checkStep` (SPEC-05).
- `tests/playtest/runner.test.ts` — modified; new test `fault engines fail fast when a runner keeps playing a violating hand` (SPEC-06).
- `tests/playtest/cli.test.ts` — modified; `ViolatingHand` typing, clean summary with `firstViolation: null`, source check on `violationBlock`; new test `prints player actions with describeAction wording` (SPEC-08, SPEC-09).
- `doit/TASK-1.27/changes.md`, `doit/TASK-1.27/build-log.md` — build records.

No new dependencies.
