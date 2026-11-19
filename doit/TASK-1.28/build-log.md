## BUILD

- Added `tools/lint/type-stripping.js`, wired it into `eslint.config.js` before the headless block, spread its selectors into `headless-boundary.js`, set `erasableSyntaxOnly` in `tsconfig.json`, and added the file to sandbox `CONFIG_FILES`.
- Wrote `tests/playtest/type-stripping.acceptance.test.ts` (SPEC-01, SPEC-02) and `tests/toolchain/type-stripping-lint.acceptance.test.ts` (SPEC-03, SPEC-04; one sandbox lint run shared in `beforeAll`).
- `npx vitest run` on the two new files: 4/4 passed.
- `npm run format`: clean. `npm run lint`: exit 0. `npm run typecheck`: exit 0.
- `npm test`: 86 files, 313 passed, 3 skipped (316).
- `npm run playtest -- --hands 10000 --seed 42`: Invariant violations: 0.
