
## BUILD (2026-11-21)
- Added `CASH_STAKES`, the stake select on Game Config, select styling; applied D-2 to the locked home acceptance test.
- WebKit ignored `min-height` on the native select (23 px); fixed with `appearance: none` plus an inline SVG chevron.
- `npm run format` — ok. `npm run lint` — ok. `npm run typecheck` — ok.
- `npm test` — 135 files passed / 1 skipped; 479 tests passed / 7 skipped; coverage thresholds met (all files 97.1% stmts).
- `npx playwright test e2e/stake-choice.spec.ts` — 6 passed (Chromium + WebKit).
- `npm run e2e` — 110 passed.
- `npm run playtest -- --hands 10000 --seed 42` — invariant violations: 0.

## FIX round 1 (2026-11-21)
- Item 1: fixed — added `font-family: inherit;` to `.config-fields select` in `src/ui/styles.css`.
- Item 2: fixed — `.config-fields select` border #4a515c -> #6b7380; measured WCAG contrast on #1a1d22: 3.53:1 (was 2.11:1), meets 3:1. Other #4a515c borders in the file left untouched (out of scope).
- `npm run format` — ok. `npx playwright test e2e/stake-choice.spec.ts` — 6 passed (Chromium + WebKit).
