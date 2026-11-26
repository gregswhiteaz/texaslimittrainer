# Changes — TASK-7.36

- `src/advice/golden.ts` (modified): `parseExample` runs `heroPreflopProblems` for postflop graded examples (view
  built, street not preflop) and reports each Major hero preflop step with the `Graded example <id>:` prefix. The
  unreachable `if (!result.ok) break;` in `heroPreflopProblems` is replaced by a narrowing cast to the
  `ApplyResult` success branch (new `type ApplyResult` import); doc comment widened to "spot or graded example".
- `tests/golden/graded-examples.json` (modified; locked under TASK-7.14, unlocked for this story): the three examples
  re-authored like-for-like. Gutshot: Kd 4h on a limped line where the big blind checks its option (new
  justification). Top pair: Kh 7h (justification names the non-playing seven kicker). Trips: Ah 3c (justification
  names the ace kicker). Ids, seats, street, user action, grade, rule id and margin unchanged.
- `tests/golden/graded-lines.acceptance.test.ts` (created): acceptance tests SPEC-01 to SPEC-04.
- `docs/advice/golden-spots.md` (modified): graded-example hero-line rule and its failure text, the TASK-7.31
  sentence updated, and the "Changes from TASK-7.36 (chart-consistent graded example lines)" table.
- `doit/TASK-7.36/build-log.md` (created): build notes and the SPEC-05 fact-check table.
- `doit/TASK-7.36/changes.md` (created): this file.

No new dependencies.
- `src/advice/golden.ts` — review NIT / judge J-1-01: rewrap the long doc-comment line (orchestrator)
