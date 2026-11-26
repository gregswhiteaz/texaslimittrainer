## BUILD (2026-11-26)
- Added REQ-029.3 and change-log row 1.12 to requirements.md (SPEC-02); doc comment on `PlayerView.earlierShowdowns`.
- New guard test `tests/bots/no-session-memory.acceptance.test.ts::bot actions ignore earlier showdowns` (SPEC-03):
  200-hand 6-max Mixed playtest, seed 20; every bot decision recomputed with an alternative list (`[]` when the real
  list is non-empty, else a frozen one-showdown list with all 6 seats shown). Runs in ~0.8 s.
- Mutation check (scratch copy of the repo, since deleted): made `decideTag` fold when `view.earlierShowdowns.length`
  is odd. The guard test failed with 55 mismatches ("expected [ …(55) ] to deeply equal []"). Unmodified: passes.
- `npm run format`: applied (test file rewrapped). `npm run lint`: pass. `npm run typecheck`: pass.
- `npm test`: 333 files passed, 9 skipped; 1488 tests passed, 56 skipped.
