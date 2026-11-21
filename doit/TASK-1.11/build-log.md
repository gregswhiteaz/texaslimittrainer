# Build log — TASK-1.11

## BUILD
- Engine: seat range 2..10; heads-up blinds `sb = button`, `bb = dealOrder[0]` when `n === 2` (D-1). Preflop first-actor and postflop order rules unchanged (they already give heads-up order).
- CLI: `--size` 2..10, error text and usage updated.
- Tests: new `tests/engine/heads-up.acceptance.test.ts` (4), `tests/playtest/heads-up.acceptance.test.ts` (2); U1/U2 edits plus SPEC-07/08/09 unit cases in `hand.test.ts` and `cli.test.ts`. All passed first run.
- `npm run playtest -- --size 2` → exit 0, 10000 hands, fold 8940, showdown 1060, actions 42933, capped 801, largest pot $136, violations 0 (0.31 s).
- `npm run playtest -- --hands 10000 --seed 42` → identical to the §3 baseline (fold 5470, showdown 4530, actions 88831, capped 244, largest pot $70, same replay codes, violations 0).
- `npm run playtest -- --size 1` → exit 2, `Error: --size must be a whole number from 2 to 10.` + usage.
- `npm run format` ok; `npm run lint` ok; `npm run typecheck` ok.
- `npm test` (coverage) → 114 files, 402 passed, 6 skipped; all files 97.06% lines.
