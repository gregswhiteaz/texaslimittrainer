## BUILD (Code Builder)
- Added `randomBotStyles` + `configWithSeatStyles` (session.ts), the Randomise line-up button and `seated` fold (GameConfigScreen.tsx), `.config-opponents-header` CSS.
- Applied the four Q-3 button-list amendments (pre-unlocked); no other locked test changed or failed.
- Wrote tests: randomise-lineup unit + model acceptance, game-config-randomise render acceptance, e2e/randomise-lineup.spec.ts.
- `npm run format` done; `npm run lint` clean; `npm run typecheck` clean.
- `npm test`: 196 files passed / 2 skipped; 700 tests passed / 14 skipped; coverage thresholds hold (all files 97.26% stmts).
- `npm run e2e` x2: 164 passed / 12 skipped each run (Chromium + WebKit).
