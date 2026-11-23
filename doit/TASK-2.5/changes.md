# TASK-2.5 changes

## Source
- `src/table/session.ts` — adds `configForLineUp(config, players, preset)` (seats the size with the preset's line-up via `seatLineUp` + `lineUpSessionConfig`) and `botsClockwise(config)` (bot seats ordered clockwise from the user) (spec §5, D-4).
- `src/ui/config/GameConfigScreen.tsx` — adds the "Line-up" preset radiogroup (Mixed/Tough/Soft, A-1 start preset). Rows come from `configForLineUp` and are ordered by `botsClockwise`. Start game passes the same config.
- `src/ui/styles.css` — `.config-lineup` spacing for the preset group.

## New tests
- `tests/ui/game-config-lineup.acceptance.test.tsx` — SPEC-01, 02, 04, 05 (render-level rows and preset control).
- `tests/table/lineup-config.acceptance.test.ts` — SPEC-03, 06, 07 (model-level reseat, Start game seats, button).
- `tests/table/lineup-config.test.ts` — SPEC-08 unit tests for `configForLineUp` / `botsClockwise`.
- `e2e/lineup-choice.spec.ts` — SPEC-09, 10 (browser flows, axe, same-origin requests).

## Locked-test amendments (Q-2 routine, Q-3 user-approved, Q-4 routine)
- `tests/ui/home.acceptance.test.tsx` — Q-2: rows in clockwise order with Mixed names/styles; Q-4: three extra `<input ` entries (after the selects).
- `tests/ui/game-config-players.acceptance.test.tsx` — Q-2: expected rows clockwise from the user, Mixed style labels.
- `tests/ui/game-config-game-type.acceptance.test.tsx` — Q-4: group found by `aria-labelledby="config-game-type"`, `checkedValues` scoped to `name="game-type"`, five radio inputs.
- `tests/ui/game-config-stake.acceptance.test.tsx` — Q-4: five radio inputs.
- `e2e/home.spec.ts` — Q-2: seat-name order Ben, Cal, Dee, Eli, Ava, You.
- `e2e/table.spec.ts` — Q-2: `MIXED_NAMES` for the Game Config test; the harness test keeps `NAMES`.
- `e2e/players-choice.spec.ts` — Q-2: Opponents rows Seat 6 Ava, Seat 1 Ben … Seat 4 Eli.
- `e2e/next-hand.spec.ts` — Q-2: "Ava wins $8" → "Ben wins $8" (:250, :265) and hand 2 "Ben wins $8" → "Cal wins $8" (:275, same seat 2 and amount); Q-3: "Ben wins $10" → "Cal wins $50" and "Ben's cards" → "Cal's cards" (:236, :238).
- `e2e/action-bar.spec.ts` — Q-3: replay words re-pinned to `9e3779b9 00000001 00000002 000000b8`.
- `e2e/rapid-pace.spec.ts` — Q-5 (option A): the scripted-user helper `foldElseCheck` clicks Fold only when a Fold button exists and is enabled, otherwise Check. No assertion changed.
- `e2e/review.spec.ts` — Q-3: winner "Cal wins $50", pinned review entries/grades, badge colours and hand-2 stacks updated to the Mixed table's output.

## Work folder
- `doit/TASK-2.5/blocked-1.resolved.json`, `doit/TASK-2.5/blocked-2.resolved.json` — the two resolved blocks (SPEC-11).
- `doit/TASK-2.5/changes.md`, `doit/TASK-2.5/build-log.md` — this record and the build log.

No new dependencies.
