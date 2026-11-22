## BUILD
- Added `resolveLineUpName`, `lineUpSessionConfig` and seat checks to `src/bots/lineup.ts`; reworded `LineUpName` comment; wrote acceptance file (AC#1–AC#4) and unit tests (SPEC-05, SPEC-06).
- `npx vitest run tests/bots/lineup-name.acceptance.test.ts tests/bots/lineup.test.ts`: 2 files, 7 tests passed.
- `npm run format`, `npm run lint`, `npm run typecheck`: clean.
- `npm test`: 170 files passed (1 skipped), 595 tests passed (9 skipped); coverage 97.42% lines.
- `npm run test:unit`: 47 files, 173 tests passed (1 skipped); thresholds met.
- `npm run -s playtest -- --hands 10000 --seed 42 --size 6 --lineup mixed`: Invariant violations: 0.
