## BUILD (round 0)

- Added src/advice/golden.ts (format constants, parseGoldenSpots, GoldenSpotValidationError, checkGoldenSpot, sentencesOf, namedConcepts). wordCount/echo/isRecord are private in preflop-chart.ts, so golden.ts keeps its own small copies rather than widening that module (no chart changes in scope).
- Authored tests/golden/preflop-spots.json: 110 spots (heads-up 20, 6-max 42, full ring 48), every applicable (size, situation) pair covered, fold/check/call/raise all recommended. Hands were picked by reading each chart spot's documented strategy and grid and choosing cells far from action boundaries (premium raises, offsuit trash folds, free BB checks, calls whose neighbours call). Justifications were written one by one. The engine was run only afterwards to confirm: all 110 agreed on the first run, so no spot was swapped or edited to match.
- Judgement call: a non-array before is reported as missing player view (the steps do not reach a preflop decision); the spec lists no separate form for it.
- Tests: npx vitest run tests/golden/ → 2 files, 135 passed (acceptance 118: 110 per-spot + 8; unit 17). golden.ts coverage 100% lines.
- npm run format, npm run lint, npm run typecheck: clean.
- npm test: 206 files passed, 3 skipped; 908 tests passed, 35 skipped; exit 0. Output lists tests/golden/preflop.acceptance.test.ts.
- Playtest: npm run -s playtest -- --hands 10000 --seed 42 | shasum -a 256 = 14d746f736d6afd3968e7ae7e833814d95dab94378c80c11dd59b1fd6ea72e48 (unchanged), Invariant violations: 0.
- Scope: 5 files, about 2,020 added lines against a 1,900 budget (warn band); the JSON data alone is about 1,215 lines after Prettier.

## FIX (round 1)

Hands chosen by reading each chart grid for a cell whose four neighbours share its action, and by checking the price and ranges first; the engine was run only afterwards (all agreed on the first run).

1. Fixed. BB re-raise folds after the hero raised trash over a limp (5:1 or 5.5:1 price) replaced by premium hands the hero would raise: hu-bb-re-raise-92o -> hu-bb-re-raise-aa (raise); 6max-bb-re-raise-98o -> 6max-bb-re-raise-aa (raise); fr-bb-re-raise-87s -> fr-bb-re-raise-ajs (call, justification argues from the real 22-chip pot and one small bet). No 'dominates' text for 98o remains. Re-raise coverage is kept at every size; folds remain elsewhere.
2. Fixed. Heads-up folds near the boundary replaced by uniform-region calls/raises: hu-btn-raise-72o -> hu-btn-raise-k7o (call); hu-btn-raise-93o -> hu-btn-raise-j9s (call); hu-bb-blind-defence-82o -> hu-bb-blind-defence-j6o (call); hu-bb-blind-defence-93o -> hu-bb-blind-defence-aks (raise). No heads-up BB fold is clear-cut at 3:1, so no fold was kept there; heads-up folds remain in BTN unopened.
3. Fixed. fr-sb-blind-defence-k9s (id kept): the raiser is now UTG (before ['raise', 6x 'fold']), and the justification says an under-the-gun range holds the bigger kings and aces.
4. Fixed. No 6-max raise chart (HJ, CO, BTN) has a call whose neighbours all call, so 6max-btn-raise-kts -> 6max-bb-blind-defence-kts (call vs a button steal; KJs, K9s, ATs, QTs all call). 6-max raise coverage stays via its raise and fold spots.
5. Fixed. hu-btn-unopened-72o now says 'one of the weakest starting hands'.
Orchestrator MINORs: fr-lj-raise-ako reworded (dominates AQ/AJ/KQ, close to even against middle pairs; no 'well ahead'); fr-hj-raise-and-calls-33 -> fr-hj-raise-and-calls-ajs (MP opens, LJ calls; AQs/ATs/KJs neighbours call); fr-co-raise-and-calls-a7s -> fr-co-raise-and-calls-ats (LJ opens, HJ calls; AJs/A9s/KTs neighbours call). golden.ts echo(): only strings and numbers go through String(), others shown as <array>/<null>/<object>/<boolean>; unit test added with {"toString":0}.
- npx vitest run tests/golden/ -> 2 files, 136 passed.
- Gate (doit.py gate TASK-7.11): PASS (test, lint, typecheck ok; scope warn 2044 vs 1900 lines).
