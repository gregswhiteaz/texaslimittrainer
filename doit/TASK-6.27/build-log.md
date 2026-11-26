## BUILD (TASK-6.27)
- Added the bot `TSImportType` selectors, the bot ban on `advice/golden`, and the `adviceHiddenStateConfig` advice block (D-3), registered in `eslint.config.js`.
- Added `tests/toolchain/bot-import-gaps.acceptance.test.ts` (SPEC-01..05).
- `npx vitest run` on the new file plus the locked `bot-boundary.acceptance.test.ts`: 8/8 passed. In-process spot check: `import('../engine/../engine/hand').Action` and `import('../engine//hand').Action` fail, while `Action` and `PlayerView` pass.
- `npm run format`: done. `npm run lint`: clean. `npm run typecheck`: clean. `npm run test:tooling`: 38 files, 125 passed, 6 skipped.
- `npm test`: 334 files passed, 9 skipped; 1493 tests passed, 56 skipped. `git diff --stat main -- src tests/toolchain/bot-boundary.acceptance.test.ts` is empty.
