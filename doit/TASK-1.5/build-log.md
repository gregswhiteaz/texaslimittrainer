## BUILD (Code Builder)
- Implemented `src/engine/player-view.ts` per spec §5 (D-1, D-2, A-2..A-5): explicit field copies, `legalActions` only for `toAct`, `earlierShowdowns` passed by reference, RangeError for a seat not dealt in, `hand-complete` without calling the policy.
- Tests: acceptance (AC#1, AC#3), property (AC#2, 300 hands, every decision point, plus own-card swap control), unit (SPEC-04–07).
- `npx vitest run tests/engine/player-view`: 3 files, 7 tests passed. `npm run format`, `npm run lint` (clean), `npm run typecheck` (clean); SPEC-08 grep prints nothing.
- Lines in scope: 619 / 620 across 4 files. Full `npm test` left to the stop-hook gate.
