# Changes — TASK-7.31

- `src/advice/golden.ts` (modified): new private `heroPreflopProblems` rule. A postflop spot whose hero preflop step
  grades as a Major error on the chart is rejected with the A-5 text, before any advice runs. The clear-cut check now
  runs in its own try/catch, so a `gradeDecision` throw becomes a `clear-cut check failed (<message>)` problem for
  that spot.
- `tests/golden/postflop-spots.json` (modified; locked under TASK-7.14, unlocked for this story by Q-1): the 72 spots
  with Major hero preflop lines re-authored like-for-like. 10 take the chart's action (ids kept), 59 swap hole cards
  (new ids), 2 change line and `6max-turn-bb-raise-92o` follows A-7 ("kings full"). Every changed justification was
  rewritten.
- `tests/golden/postflop-lines.acceptance.test.ts` (created): the locked acceptance tests SPEC-01 to SPEC-05.
- `tests/golden/postflop-golden.test.ts` (modified): the heads-up second-pass probe now uses a chart-consistent line
  (`raise, raise, call`), plus the SPEC-06 unit test "hero preflop line rule and guarded clear-cut check".
- `docs/advice/golden-spots.md` (modified): the postflop `before` rule and its failure text, the clear-cut failure
  text, "Adding a spot" step 2, the example's chart-consistent `before`, and the "Changes from TASK-7.31
  (chart-consistent hero lines)" table (72 rows).
- `doit/TASK-7.31/build-log.md` (created): build notes and the SPEC-08 fact-check table.
- `doit/TASK-7.31/changes.md` (created): this file.

No new dependencies.
