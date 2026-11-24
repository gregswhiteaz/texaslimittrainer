
## BUILD (Code Builder)
- Added `tools/lint/sync-copies.js` (matcher/walker/CLI, imports `node:process` because ESLint's no-undef flags the global in tools/lint), chained it first in `npm run lint`, added `.gitignore` patterns, sandbox CONFIG_FILES entry, README section and lint row, and `tests/toolchain/sync-copies.test.ts`.
- `npx vitest run tests/toolchain/sync-copies.test.ts tests/toolchain/lint.test.ts`: 9/9 passed.
- `npm run test:tooling`: 35 files, 116 passed, 6 skipped.
- `npm test`: 212 files passed (3 skipped), 936 tests passed, 35 skipped.
- `npm run lint`: exit 0. `npm run typecheck`: exit 0. `npm run format`: run.
- `time node tools/lint/sync-copies.js`: 0.03 s, exit 0 on the current tree.
- Judge e2e: `touch "src/zz 2.ts"` -> lint exit 1 naming it; absent from `git status --porcelain` and `git add -A --dry-run`; removed afterwards.
