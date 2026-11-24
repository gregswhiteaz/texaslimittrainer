# TASK-7.14 changes

- `src/advice/golden.ts` — modified: board-aware dealing (`dealtHand` places flop/turn/river at the engine's D-5 deck
  indexes), street-aware `replay`/`buildView`, `parsePostflopGoldenSpots` + `PostflopGoldenSpot`, memoised
  `goldenPostflopAdvice` (A-1, D-3), the clear-cut rule via `gradeDecision` (D-2), `checkGoldenSpot` widened to both
  spot kinds, `parseGradedExamples` / `GradedExample` / `checkGradedExample` (D-6). Shared helpers extracted
  (`parseEntries`, `checkActions`, `checkJustification`, `viewOf`, `parseObserved`); preflop behaviour unchanged.
- `src/advice/charts/full-ring.json` — modified (Q-1, D-5): BTN facing a single raise, 99 and 88 C → R; the spot
  justification no longer says "call with a few pairs".
- `tests/golden/postflop-spots.json` — new: 120 authored postflop spots (45 flop, 40 turn, 35 river; 86 6-max,
  18 heads-up, 16 full ring; 20 multiway; 4 with observed opponent stats). FIX r1: justification wording corrected
  (made-hand / draw names) in 11 spots. FIX r2: `6max-turn-btn-bet-94o` trailing-hands clause and
  `hu-river-bb-call-tt` missed-draws clause corrected.
- `tests/golden/graded-examples.json` — new: 9 graded examples (A-6), all postflop ones on exact-enumeration spots. FIX r1:
  open-ender example renamed `graded-postflop-fold-minor-6max-flop-gutshot`, text says gutshot.
- `tests/golden/postflop.acceptance.test.ts` — new acceptance tests (SPEC-01..05, SPEC-10).
- `tests/golden/suite.acceptance.test.ts` — new acceptance tests (SPEC-06..09).
- `tests/golden/postflop-golden.test.ts` — new unit tests (SPEC-11..13), stubbed advice except one heads-up river spot.
- `docs/advice/golden-spots.md` — modified: postflop format, advice options, clear-cut rule with worked examples,
  graded examples, counts, AC#7–9 notes, originality.
- `tests/golden/preflop-spots.json` — modified (unlocked under TASK-7.11 for TASK-7.14 Q-1): AC#7 (`fr-btn-raise-88` →
  raise + new justification), AC#8 (AJs justification), AC#9 (`fr-co-limpers-87s` → `fr-co-limpers-44`,
  `fr-sb-unopened-65s` → `fr-sb-unopened-kjs`).

No new dependencies.
