## BUILD (Code Builder)
- Added `BOT_STYLES` + `configWithSeatStyle` (session.ts), per-row style select with edit state (GameConfigScreen.tsx), select CSS.
- Wrote tests: seat-style unit + acceptance (model), game-config-seat-style render acceptance, e2e/seat-style.spec.ts.
- Initial run: 8 locked unit tests failed only on row parsing / select counts (Q-2 files). Applied the Q-2 amendments (files were pre-unlocked by the orchestrator); no expected values changed.
- `npm run format` done; `npm run lint` clean; `npm run typecheck` clean.
- `npm test`: 193 files passed / 2 skipped; 694 tests passed / 14 skipped; coverage thresholds hold (all files 97.28% stmts).
- `npm run e2e` x2: 156 passed / 12 skipped each run (Chromium + WebKit).
- `npm run e2e:slow` not run: responsive-table and rapid-pace only click New game / Start game and never read Game Config rows or count selects.
