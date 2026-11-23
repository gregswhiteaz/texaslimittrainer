# TASK-7.11 changes

- `src/advice/golden.ts` — new: tlh-golden-spots v1 format constants (stakes 2/4, stack 160), parseGoldenSpots validator that rebuilds each PlayerView with the engine and collects every problem in a GoldenSpotValidationError, checkGoldenSpot runner check, sentencesOf and namedConcepts helpers.
- `tests/golden/preflop-spots.json` — new: 110 authored preflop spots (heads-up 20, 6-max 42, full ring 48) on non-borderline chart cells, each with an individually written justification naming its hand and a listed concept.
- `tests/golden/preflop.acceptance.test.ts` — new acceptance file (SPEC-01..SPEC-08): completeness, incomplete-spot failures, npm test inclusion, one agreement test per spot, mismatch message, count and coverage, borderline rejection, explanation and justification checks, distinct justifications naming their hand.
- `tests/golden/golden-spots.test.ts` — new unit tests (SPEC-09, SPEC-10): every validator problem text, opponent stats, sentence and concept helpers, view construction at heads-up, 6-max and full ring.
- `docs/advice/golden-spots.md` — new: format and table constants, field rules, clear-cut rule, how to add a spot, how the suite runs, failure message, originality statement.

No new dependencies.
