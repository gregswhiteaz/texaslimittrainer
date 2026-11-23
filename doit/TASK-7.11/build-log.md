## BUILD (round 0)

- Added src/advice/golden.ts (format constants, parseGoldenSpots, GoldenSpotValidationError, checkGoldenSpot, sentencesOf, namedConcepts). wordCount/echo/isRecord are private in preflop-chart.ts, so golden.ts keeps its own small copies rather than widening that module (no chart changes in scope).
- Authored tests/golden/preflop-spots.json: 110 spots (heads-up 20, 6-max 42, full ring 48), every applicable (size, situation) pair covered, fold/check/call/raise all recommended. Hands were picked by reading each chart spot's documented strategy and grid and choosing cells far from action boundaries (premium raises, offsuit trash folds, free BB checks, calls whose neighbours call). Justifications were written one by one. The engine was run only afterwards to confirm: all 110 agreed on the first run, so no spot was swapped or edited to match.
- Judgement call: a non-array before is reported as missing player view (the steps do not reach a preflop decision); the spec lists no separate form for it.
- Tests: npx vitest run tests/golden/ → 2 files, 135 passed (acceptance 118: 110 per-spot + 8; unit 17). golden.ts coverage 100% lines.
- npm run format, npm run lint, npm run typecheck: clean.
- npm test: 206 files passed, 3 skipped; 908 tests passed, 35 skipped; exit 0. Output lists tests/golden/preflop.acceptance.test.ts.
- Playtest: npm run -s playtest -- --hands 10000 --seed 42 | shasum -a 256 = 14d746f736d6afd3968e7ae7e833814d95dab94378c80c11dd59b1fd6ea72e48 (unchanged), Invariant violations: 0.
- Scope: 5 files, about 2,020 added lines against a 1,900 budget (warn band); the JSON data alone is about 1,215 lines after Prettier.
