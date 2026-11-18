## BUILD (Code Builder)
- Applied A-4 fixes (equity.ts field, preflop.ts JSON import attribute); added `src/bots/tag.ts`; made runner default size-aware via `defaultPolicyFactory`.
- Wrote tests: tests/bots/tag.acceptance.test.ts (4), tests/bots/tag-playtest.acceptance.test.ts (2), tests/bots/tag.test.ts (3), SPEC-10 case in tests/playtest/runner.test.ts.
- `npm run typecheck` and `npm run lint` after each test-file edit: pass.
- `npm run playtest -- --hands 10000 --seed 42`: exit 0, Hands played 10000, Invariant violations 0, 0.6 s wall.
- `npm run playtest -- --hands 500 --seed 9 --size 7`: Invariant violations 0 (random-move seats).
- `npx vitest run tests/advice tests/playtest tests/bots`: 21 files, 72 tests passed (4.2 s).
- SPEC-11 grep over src/bots: clean.
