# TASK-6.3 changes

## Source
- `src/bots/style.ts` — `Deviation`, `DeviationStreet`, `DeviationAdvice`, `BotStyleData.deviations` (absent → `[]`), deviation validation in `parseStyle`, `findDeviation`, `drawDeviation` (D-1, A-2, A-5).
- `src/bots/styles/calling-station.json` — new: the Calling station's style file (description, no mixed spots, three deviations with justifications) (D-2).
- `src/bots/calling-station.ts` — new: `CALLING_STATION_STYLE` (validated at import), `CallingStationOptions`, `decideCallingStation` (D-4, A-1, A-4, A-6).
- `src/table/advice-service.ts` — worker default bot decision sends `'Calling station'` to `decideCallingStation`, others to `decideTag` (D-3).

## New tests
- `tests/bots/calling-station.acceptance.test.ts` — SPEC-01..SPEC-06.
- `tests/bots/calling-station.test.ts` — SPEC-09 and SPEC-08's seated-station 10,000-hand run.

## Extended tests
- `tests/bots/style.test.ts` — SPEC-07 (`parseStyle validates deviations`).
- `tests/table/advice-service.test.ts` — SPEC-10 (`default bot decision dispatches the Calling station`).

No new dependencies.
