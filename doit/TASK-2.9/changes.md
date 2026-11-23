# TASK-2.9 changes

## Source
- `src/table/session.ts` — adds `randomBotStyles(config, nextWord)` (one `BOT_STYLES[w % 4]` per bot seat in `botsClockwise` order, frozen result, RangeError on a word outside 0..2^32-1) and `configWithSeatStyles(config, preset, styles)` (folds a seat→style map through `configWithSeatStyle`) (D-1, D-3).
- `src/ui/config/GameConfigScreen.tsx` — "Randomise line-up" outline button beside the Opponents heading in `.config-opponents-header`; its draw (one 1-word `crypto.getRandomValues` call per bot) replaces all edits (A-1); `seated` now uses `configWithSeatStyles` (D-2, D-3).
- `src/ui/styles.css` — `.config-opponents-header` row (flex, space-between, wrap, gap 8px, centred); the h2 keeps its look.

## New tests
- `tests/table/randomise-lineup.test.ts` — SPEC-07 unit tests (word mapping, clockwise order, call counts, frozen result, RangeErrors, `configWithSeatStyles`).
- `tests/table/randomise-lineup.acceptance.test.ts` — SPEC-02 (1,000 seeded draws tabulated per seat) and SPEC-03 (Custom / preset name, seated styles).
- `tests/ui/game-config-randomise.acceptance.test.tsx` — SPEC-06 (button in the Opponents header, page button order).
- `e2e/randomise-lineup.spec.ts` — SPEC-01, SPEC-04, SPEC-05 (9-player randomise, axe, 44 px, same-origin; stubbed draw to table; edit replacement and preset change).

## Locked-test amendments (Q-3 routine; only 'Randomise line-up' inserted after '← Home')
- `tests/ui/home.acceptance.test.tsx`
- `tests/ui/game-config-game-type.acceptance.test.tsx`
- `tests/ui/game-config-stake.acceptance.test.tsx`
- `e2e/stake-choice.spec.ts`

No new dependencies.
