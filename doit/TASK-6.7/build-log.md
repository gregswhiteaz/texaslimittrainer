## BUILD
- Added `resolveLineUpName`, `lineUpSessionConfig` and seat checks to `src/bots/lineup.ts`; reworded `LineUpName` comment; wrote acceptance file (AC#1–AC#4) and unit tests (SPEC-05, SPEC-06).
- `npx vitest run tests/bots/lineup-name.acceptance.test.ts tests/bots/lineup.test.ts`: 2 files, 7 tests passed.
- `npm run format`, `npm run lint`, `npm run typecheck`: clean.
- `npm test`: 170 files passed (1 skipped), 595 tests passed (9 skipped); coverage 97.42% lines.
- `npm run test:unit`: 47 files, 173 tests passed (1 skipped); thresholds met.
- `npm run -s playtest -- --hands 10000 --seed 42 --size 6 --lineup mixed`: Invariant violations: 0.

## FIX r1
- Brief 1 (error-order-not-pinned): fixed — `tests/bots/lineup.test.ts` adds two-rule cases per §5 order: `[]` + preset Custom → numbering; duplicate seat + null style → numbering; no user seat + null style → user-seat; null name + preset Custom → style/name; 11 seats + null style → style/name; 11 seats + preset Custom → table size; button 7 with `[]` → numbering, with no user seat → user-seat. Optional `find` refactor not taken (no behaviour change needed). `npm run format`; `npx vitest run tests/bots/` 18 files, 65 passed, 1 skipped; tsc and eslint clean.
