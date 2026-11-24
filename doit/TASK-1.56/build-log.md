
## BUILD (TASK-1.56)
- Split `tests/advice/postflop-ranges.test.ts` by script (verbatim line ranges 105–146 and 260–302 moved to
  `tests/advice/postflop-ranges.property.test.ts`; 148–200 kept as the renamed fallback test).
- SPEC-03 diff command: no output (30 expect lines and all literals match).
- `npm run format`, `npm run lint`, `npm run typecheck`: clean.
- `npm run test:unit`: exit 0, 62 files, 299 passed / 1 skipped; coverage lines 92.65 %. Kept tests 174 ms and 142 ms under coverage.
- `npx vitest run tests/advice/postflop-ranges.property.test.ts`: 2 passed (1690 ms, 1605 ms).
