## BUILD

- Added the Function-constructor and `global` alias bans to `tools/lint/headless-boundary.js` (surgical edit; `BARE_GLOBAL_REFERENCE` now reuses `NAME_ONLY_POSITIONS`, matches unchanged).
- Wrote `tests/toolchain/bot-function-escapes.acceptance.test.ts` (4 tests, SPEC-01..04).
- `npx vitest run tests/toolchain/bot-function-escapes.acceptance.test.ts` → 4/4 passed.
- SPEC-05 mutation check: removed each of B1..B8 in turn and reran the new test file; all 8 mutations made it fail; file restored (cmp identical).
- `npm run format` → ok; `npm run lint` → exit 0; `npm run typecheck` → exit 0; `npm test` → exit 0 (coverage 92.91% statements).

## FIX round 1
- Item 1 [MAJOR] node-process-global-open: fixed. Added B9 (value-position `process` Identifier with NAME_ONLY_POSITIONS) and B10 (`globalThis.process` no-restricted-properties), message cites REQ-028.1/REQ-025.1. New test tests/toolchain/bot-process-escapes.acceptance.test.ts (4 failing probes x 3 bot files + clean `declare global` probe): 2/2 pass. Mutation check: disabling B9 or B10 each fails 1 test.
