# Build log — TASK-7.7

## BUILD
- Exported `cardText`/`mulberry32` from `tools/equity/generate-reference.js`; wrote `tools/equity/generate-multiway-reference.js` per spec §5 rules 1–5 (A-4 method rule, D-1 weighting).
- `node tools/equity/generate-multiway-reference.js`: 120 cases written in 64.2 s (wall 1:04). Split: 84 exhaustive (all 40 `mw-*`, 44 `rr-*`), 36 high-sample (2,000,000 trials each). Preflop: rr-b0-05 and rr-b0-17 (one 24-combo opponent, E ≈ 82M ≤ 100M) came out exhaustive; the other 18 preflop range cases are high-sample.
- Re-ran the generator: fixture sha1 identical (47dbfd06…) → reproducible.
- `npx vitest run tests/advice/equity-multiway.acceptance.test.ts tests/advice/equity-multiway-reference.test.ts`: 2 files, 7 tests passed, 2.42 s total (acceptance AC#1 758 ms, AC#3 orders 1507 ms, AC#3 swap 20 ms; reference unit tests ~15 ms).
- AC#1 log: `AC#1: 120 cases, largest error 0.870 pp (rr-b5-04)`. No case missed 1.5 pp; `src/advice/equity.ts` unchanged. No case dropped, replaced or reseeded.
- `npm run format`, `npm run lint`, `npm run typecheck`: pass. Network grep (SPEC-06): no matches.
- Gate build #1: PASS (812 changed lines vs 750 budget: warn; 5 files). `npm test`: 198 files passed / 2 skipped, 707 tests passed / 14 skipped.
