# TASK-2.8 changes

## Source
- `src/table/session.ts` — adds `BOT_STYLES` (frozen option order TAG, Calling station, Maniac, Rock) and `configWithSeatStyle(config, preset, seat, style)`: sets one bot's style and re-resolves the line-up name through `lineUpSessionConfig` (Custom when any bot differs from the preset). RangeError on an unknown style or a non-bot seat (spec §5, D-2).
- `src/ui/config/GameConfigScreen.tsx` — per-seat `edits` state folded over `configForLineUp` with `configWithSeatStyle`; each bot row ends with `<label class="config-style">Style <select aria-label="Style for <name>">` (values checked against `BOT_STYLES`); preset or players change clears the edits (A-2); Start game passes the edited config (D-1).
- `src/ui/styles.css` — `.config-seats select` shares the 44 px `.config-fields select` look; `.config-style` label layout.

## New tests
- `tests/table/seat-style.test.ts` — SPEC-08 unit tests for `configWithSeatStyle` / `BOT_STYLES`.
- `tests/table/seat-style.acceptance.test.ts` — SPEC-02, 04, 05, 06 (model rows, Custom/Tough names, edited seats play their own policy through `handleAdviceRequest`).
- `tests/ui/game-config-seat-style.acceptance.test.tsx` — SPEC-01, 07 (render: four options, selected style, labels).
- `e2e/seat-style.spec.ts` — SPEC-03, 09, 10 (browser flows, axe, same-origin requests); FIX R1: row checks retry via `expect.poll`, plus a players-count-change test proving edits clear (A-2).

## Locked-test amendments (Q-2 routine; no expected values changed)
- `tests/ui/home.acceptance.test.tsx` — row cells add the selected option text; the control list counts only selects with an id.
- `tests/ui/game-config-players.acceptance.test.tsx` — `seatRows` adds the selected option text as the third cell.
- `tests/ui/game-config-stake.acceptance.test.tsx` — `selects` helper scoped to selects with an id (Session panel).
- `tests/ui/game-config-lineup.acceptance.test.tsx` — `seatRows` adds the selected option text as the third cell.
- `e2e/game-type-choice.spec.ts` — combobox count scoped to the Session panel.
- `e2e/stake-choice.spec.ts` — combobox counts scoped to the Session panel (`sessionComboboxes`).
- `e2e/lineup-choice.spec.ts` — row style read from the row select's chosen option.

No new dependencies.
