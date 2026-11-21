# TASK-2.3 — Changes

- `src/table/session.ts` — modified: export frozen `CASH_STAKES`, the six REQ-006.1 stakes ascending (D-3).
- `src/ui/config/GameConfigScreen.tsx` — modified: Stakes row is a labelled native `<select id="config-stake">` seeded from `config.stake`; Buy-in follows the chosen stake; Start game passes `{ ...config, stake }` (D-1).
- `src/ui/styles.css` — modified: `.config-fields select` styling (44 px, dark theme, `appearance: none` + inline SVG chevron so WebKit honours the height, inherited font family, #6b7380 border for 3.53:1 non-text contrast) and `align-items: center` on field rows.
- `tests/ui/home.acceptance.test.tsx` — modified (locked, TASK-2.1): extraction-only amendment per D-2 / Q-2; expected values unchanged.
- `tests/table/stakes.acceptance.test.ts` — new: SPEC-01, SPEC-02, SPEC-03.
- `tests/ui/game-config-stake.acceptance.test.tsx` — new: SPEC-04, SPEC-05, SPEC-06.
- `e2e/stake-choice.spec.ts` — new: SPEC-07, SPEC-08, SPEC-09 (Chromium + WebKit).

No new dependencies.
