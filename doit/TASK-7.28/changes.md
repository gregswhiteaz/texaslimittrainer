# TASK-7.28 changes

- `src/advice/ranges.ts` — `openEnderStart` counts a run only when a hole rank not on the board is in it; `drawOuts` drops straight outs when a suit has five or more cards (made flush); doc comments.
- `tests/advice/straight-outs.acceptance.test.ts` — new acceptance tests for AC#1, AC#3, AC#4 (SPEC-01..03).
- `tests/advice/ranges.test.ts` — unit edge cases: `drawOuts counts straight outs only when a hole card adds a rank to the run` (SPEC-04) and `classifyCombo is unchanged by the hole-card straight-draw rule` (SPEC-05).
- `docs/advice/postflop-rules.md` — "Draw and outs" bullet states the hole-card-not-on-board rule and that a made flush or straight gets no straight-draw outs (SPEC-07).
- `doit/TASK-7.28/build-log.md` — build log with playtest SHAs and style-bands results (pipeline file).
- `doit/TASK-7.28/changes.md` — this list (pipeline file).

No new dependencies.
