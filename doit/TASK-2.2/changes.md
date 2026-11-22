# TASK-2.2 changes

## Created
- `tests/ui/game-config-players.acceptance.test.tsx` — SPEC-01..04: players options 2..10 with size names and 6 selected; approximate note at 3/4/5/7 (6-max) and 8 (full ring) with aria-describedby; no note at 2/6/9/10; Opponents list n − 1 bots and `You · Seat min(5, n)`.
- `tests/table/table-size.acceptance.test.ts` — SPEC-05..09: seating, header and dealt players at every size (cash and sit-and-go); heads-up blinds and labels across a button move (pins SCENARIO_CODE: the button bot does not fold, used by the e2e); position names at 2..10; review grading at 2 and 10 players; size survives game type and stake.
- `e2e/players-choice.spec.ts` — SPEC-10/11: every size in the browser (options, note, opponents, header, seat count, Leave table, axe on Config at 7 and the table at 2 and 10, same-origin requests); heads-up table under a paused clock with `runUntilMyTurn`. Carries the worker-timer axe helper used by the other paused-clock specs.

## Modified
- `src/table/session.ts` — `TABLE_SIZES` (frozen 2..10) and `configForPlayers` (D-4 seating, A-2 carry-over, A-5 RangeError).
- `src/table/table-view.ts` — `positionName`: heads-up button = `Small blind`, other seat = `Big blind` (D-3).
- `src/ui/config/GameConfigScreen.tsx` — players `<select id="config-players">` with label, approximate note (`playersNote`, via `referenceSizeOf` and `TABLE_SIZE_NAMES`), Opponents/You row and Start game follow the chosen size (A-1).
- `src/ui/styles.css` — `.config-note` (muted #a7aeb8 on the panel, 13 px).
- `tests/table/session-config.test.ts` — SPEC-12 unit test `configForPlayers rejects bad sizes and keeps game type, stake, speed and line-up`.
- `tests/table/table-view.test.ts` — 2-seat `positionName` expectations (SPEC-07).
- `tests/ui/home.acceptance.test.tsx` — LOCKED (TASK-2.1), Q-5 edit only: control list gains the players `<select>`.
- `tests/ui/game-config-stake.acceptance.test.tsx` — LOCKED (TASK-2.3), Q-5 edits only: two selects (`config-players`, `config-stake`); stake select picked by id.
- `tests/ui/game-config-game-type.acceptance.test.tsx` — LOCKED (TASK-2.4), Q-5 edit only: in sit-and-go the only `<select>` is `config-players`.
- `e2e/stake-choice.spec.ts` — LOCKED (TASK-2.3), Q-5 edits only: combobox count 2.
- `e2e/game-type-choice.spec.ts` — LOCKED (TASK-2.4), Q-5 edit only: in sit-and-go the stake select is absent and one combobox (players) remains.

## Dependencies
- None.
