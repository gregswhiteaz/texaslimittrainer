## BUILD (TASK-6.27)
- Added the bot `TSImportType` selectors, the bot ban on `advice/golden`, and the `adviceHiddenStateConfig` advice block (D-3), registered in `eslint.config.js`.
- Added `tests/toolchain/bot-import-gaps.acceptance.test.ts` (SPEC-01..05).
- `npx vitest run` on the new file plus the locked `bot-boundary.acceptance.test.ts`: 8/8 passed. In-process spot check: `import('../engine/../engine/hand').Action` and `import('../engine//hand').Action` fail, while `Action` and `PlayerView` pass.
- `npm run format`: done. `npm run lint`: clean. `npm run typecheck`: clean. `npm run test:tooling`: 38 files, 125 passed, 6 skipped.
- `npm test`: 334 files passed, 9 skipped; 1493 tests passed, 56 skipped. `git diff --stat main -- src tests/toolchain/bot-boundary.acceptance.test.ts` is empty.

## FIX r1 (TASK-6.27)
- 1 advice-golden-extension-bypass: fixed. Bot golden ban is now `(^|/)advice/golden(\.|$)` (pattern and `TSImportType`); probes for `../advice/golden.js`, `.ts` and type-position `import('../advice/golden[.js]')`.
- 2 advice-may-import-golden: fixed. `(^|/)golden(\.|$)` added to `ADVICE_BOUNDARY_PATTERNS` and the advice `TSImportType` allow-list; probes `./golden`, `./golden.js`, `export * from './golden'`.
- 3 advice-boundary-misses-non-engine-modules: fixed. Advice catch-all `^(?!\./|\.\./engine/[^/]+$)` plus `ADVICE_TYPE_IMPORT_SYNTAX` (advice block now repeats the determinism `no-restricted-syntax`); probes for table/session (value, re-export, type-position), storage, playtest, package and non-normalized paths (MINOR).
- 4 bot-boundary-misses-non-engine-modules: fixed. Bot catch-all `^(?!\./|\.\./(advice|engine)/[^/]+$|\.\./table/session$)`; `../table/session` limited to `LineUpName`/`SessionConfig`/`SessionSeat` via `allowImportNames` plus `BOT_SESSION_VALUE_IMPORT` (type-only) and the side-effect selector. `allowTypeImports` was not used for table/session because typescript-eslint skips every pattern for a type import once any `allowTypeImports` pattern matches. The `TSImportType` selector is the same allow-list. `NON_NORMALIZED_PATH` also catches `./../…`. Probes for storage, TableState (type, inline, type-position, `.js`, `./../`), value, re-export, `export *`, side-effect, table/hint, playtest.
- Q-2 scope change: done as above; a clean probe checks the lineup types (type, inline type, type re-export, type-position) and `../advice/recommend.js` still pass. The old config fails 3 of the 7 tests in the new file.
- Commands: `npm run format` done; `npm run lint` clean (whole repo); `npm run typecheck` clean; locked `bot-boundary.acceptance.test.ts` passes unchanged; `npm run test:tooling` 38 files, 127 passed, 6 skipped; `npm test` 334 files passed, 9 skipped (exit 0).
