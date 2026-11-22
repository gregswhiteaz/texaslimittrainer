# TASK-6.4 changes

## Source
- `src/bots/style.ts` — `DeviationAdvice` widened to `fold|raise|check|call`, new `DeviationInstead` (`call|bet|raise`), five new supported triples, stored `instead` kept as read (D-1).
- `src/bots/styles/maniac.json` — new: the Maniac's style file (description, no mixed spots, five deviations with justifications) (D-2).
- `src/bots/maniac.ts` — new: `MANIAC_STYLE` (validated at import), `ManiacOptions`, `decideManiac` (D-4, A-1, A-2, A-5).
- `src/table/advice-service.ts` — worker default bot decision sends `'Maniac'` to `decideManiac` (D-3).

## New tests
- `tests/bots/maniac.acceptance.test.ts` — SPEC-01..SPEC-06 (Examples A–G pinned).
- `tests/bots/maniac.test.ts` — SPEC-09 and SPEC-08's seated-Maniac 200-hand run.

## Extended tests
- `tests/bots/style.test.ts` — SPEC-07 (`parseStyle validates deviations`); `preflop/fold/raise` unsupported case replaced by `preflop/fold/bet`.
- `tests/table/advice-service.test.ts` — SPEC-10 (`default bot decision dispatches the Maniac`); `'Maniac'` removed from the TAG list.

No new dependencies.
