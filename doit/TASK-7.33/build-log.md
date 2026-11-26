
## BUILD (2026-11-26)
- Implemented SPEC-01..09 per spec: required fields, `{riverBet}` slot + `POT_ODDS_RIVER_BET_CLAUSE`, no `.replace` in `explainPostflop`, finite check on a present `valueThresholdPct`, `GoldenNumbers` threshold optional, AC#4 renames, docs.
- Locked edits limited to exactly the three listed in qa.md/spec §3.
- Mutation check: removing `{riverBet}` from `pot-odds-fold` makes both AC#2 tests fail; file restored.
- `npm run typecheck`: pass. `npm run lint`: pass. `npm run format`: clean.
- `npm test`: 330 files passed / 7 skipped; 1472 tests passed / 52 skipped.
- Golden suite `npx vitest run tests/golden`: 6 files, 288 passed (incl. `AC#5 … 6max-flop-co-raise-jj-3way`).
- SPEC-07 greps: `it('AC#6 65.1% …'` → 1, `AC#6 50.1%` → 0.
- Playtest SHA-256 before = after:
  - `playtest --hands 2000 --seed 42`: d9800984fb821e281de45532b56823c2d60ff08afcc30a23171ee335de1bb8a3
  - `playtest --check-advice --hands 2000 --seed 42`: 2dc20178c1ef7293caeb8687ccc2a540a848647016a512c53817038b61ff9308
