# TASK-6.4 changes

## Source
- `src/bots/style.ts` — `DeviationAdvice` widened to `fold|raise|check|call`, new `DeviationInstead` (`call|bet|raise`), five new supported triples, stored `instead` kept as read (D-1).
- `src/bots/styles/maniac.json` — new: the Maniac's style file (description, no mixed spots, five deviations with justifications) (D-2).
- `src/bots/maniac.ts` — new: `MANIAC_STYLE` (validated at import), `ManiacOptions`, `decideManiac` (D-4, A-1, A-2, A-5).
- `src/table/advice-service.ts` — worker default bot decision sends `'Maniac'` to `decideManiac` (D-3).

## New tests
- `tests/bots/maniac.acceptance.test.ts` — SPEC-01..SPEC-06 (Examples A–G pinned).
- `tests/bots/maniac.test.ts` — SPEC-09, J-1-01's river check→bet test, and SPEC-08's seated-Maniac run (20-hand smoke every push; the 200-hand run gated by `TLH_SLOW_TESTS=1`). Views come from the first 50 hands of the D-5 run with memoized equity (A-6).

## Extended tests
- `tests/bots/style.test.ts` — SPEC-07 (`parseStyle validates deviations`); `preflop/fold/raise` unsupported case replaced by `preflop/fold/bet`.
- `tests/table/advice-service.test.ts` — SPEC-10 (`default bot decision dispatches the Maniac`); `'Maniac'` removed from the TAG list.

## Changed acceptance test (unlocked by the orchestrator, option 1)
- `tests/bots/maniac.acceptance.test.ts` — only `collect()`'s input preparation: seat 1 plays `decideTag` with the shared equity memo instead of `seededTagPolicy(code)` (same actions; 200 hands kept). The unused `seededTagPolicy` import was dropped. Every assertion is unchanged.

## Config
- `package.json` — `test:slow` also runs `tests/bots/maniac.test.ts`, so the gated 200-hand seated run has an entry point.

No new dependencies.
