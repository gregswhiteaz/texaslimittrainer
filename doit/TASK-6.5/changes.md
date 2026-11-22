# TASK-6.5 changes

## Source
- `src/bots/style.ts` — `RangeSpot`, `BotStyleData.startingRange`, `parseStyle`'s optional `chart` argument (default `SIX_MAX_CHART`), starting-range validation (`parseStartingRange`: 26 spots once each, known unrepeated classes, justification, subset of TAG non-fold cells, fewer per spot and per position; required for Rock), and `startingRangeFor` (D-1, D-5, D-6).
- `src/bots/styles/rock.json` — new: the Rock's style file (description, no mixed spots, no deviations, 26 ranges with justifications, text as in spec §5) (D-2).
- `src/bots/rock.ts` — new: `ROCK_STYLE` (validated at import), `RockOptions`, `decideRock` (D-3, A-3, A-4).
- `src/table/advice-service.ts` — worker default bot decision sends `'Rock'` to `decideRock` (D-4).

## New tests
- `tests/bots/rock.acceptance.test.ts` — SPEC-01..SPEC-06 (Examples A–E pinned).
- `tests/bots/rock.test.ts` — SPEC-09 decision units and SPEC-08's seated 1,000-hand Rock run.

## Extended tests
- `tests/bots/style.test.ts` — SPEC-07 (`parseStyle validates starting ranges`).
- `tests/table/advice-service.test.ts` — SPEC-10 (`default bot decision dispatches the Rock`); `'Rock'` removed from the TAG expectation.

No new dependencies.
