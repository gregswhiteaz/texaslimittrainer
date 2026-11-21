# TASK-2.4 changes

- `src/table/session.ts`:
  - `GameType` is now `'cash' | 'sit-and-go'`, and `SessionConfig` is the union `CashSessionConfig | SitAndGoSessionConfig` (D-3).
  - Adds `SIT_AND_GO_STARTING_CHIPS`, the frozen `SIT_AND_GO_LEVEL_1`, `tableStake`, `startingStack` and `configForGameType`.
  - `resolveSessionConfig` drops `stake` for a sit-and-go.
  - `seatSession` gives every seat `startingStack` (1,500 in a sit-and-go) and sets the limits from `tableStake`.
  - Recorded deviation from A-3 (fix brief, Option 2): the TEMPORARY top-up is `buyIn(tableStake(table.config))`, so a short sit-and-go seat refills to 800, not 1,500. The locked TASK-3.4 test is untouched.
- `src/table/table-view.ts`: `headerText` handles sit-and-go (`Sit-and-go · 6 players · 20/40 · Hand #k`, D-2).
- `src/table/action-bar.ts`: `userActionBar` shows chip labels for a sit-and-go and dollar labels for cash (AC#6).
- `src/ui/config/GameConfigScreen.tsx`: Game type radio group (D-4). Stakes and Buy-in rows only for Cash game. The stake state starts per A-7. Start game uses `configForGameType`.
- `src/ui/styles.css`: `.config-choice` radio option styling (44 px, checked 2px #d7262e, other 1px #343a43).
- `tests/support/table-scenarios.ts`: `STORYBOARD_CONFIG` typed `CashSessionConfig`.
- `tests/ui/home.acceptance.test.tsx`: LOCKED (TASK-2.1). D-5 (1) extraction-only amendment; expected values unchanged.
- `tests/ui/game-config-stake.acceptance.test.tsx`: LOCKED (TASK-2.3). D-5 (2) extraction-only amendment.
- `tests/table/game-type.acceptance.test.ts`: new, SPEC-04, SPEC-05, SPEC-06.
- `tests/table/game-type.test.ts`: new, SPEC-07, SPEC-08 (top-up expectation 800 per the deviation).
- `tests/ui/game-config-game-type.acceptance.test.tsx`: new, SPEC-01, SPEC-02, SPEC-03.
- `e2e/game-type-choice.spec.ts`: new, SPEC-09, SPEC-10.
- `doit/TASK-2.4/blocked.json`: created in BUILD 1, deleted after the fix-brief decision.

No new dependencies.
