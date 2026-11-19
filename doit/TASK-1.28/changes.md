# TASK-1.28 changes

- `tools/lint/type-stripping.js` — new; `TYPE_STRIPPING_FILES`, shared `TYPE_STRIPPING_RESTRICTED_SYNTAX` (attribute-less JSON imports/re-exports, enums) and `typeStrippingConfig` (adds `@typescript-eslint/parameter-properties`) (D-1, SPEC-03/04).
- `eslint.config.js` — modified; registers `typeStrippingConfig` immediately before `headlessBoundaryConfig`.
- `tools/lint/headless-boundary.js` — modified; spreads `TYPE_STRIPPING_RESTRICTED_SYNTAX` into its `no-restricted-syntax` so headless dirs keep the new selectors (D-1).
- `tsconfig.json` — modified; `"erasableSyntaxOnly": true` (A-2).
- `tests/support/sandbox.ts` — modified; copies `tools/lint/type-stripping.js` into sandboxes.
- `tests/playtest/type-stripping.acceptance.test.ts` — new; SPEC-01 (playtest entry loads via the real loader) and SPEC-02 (negative controls).
- `tests/toolchain/type-stripping-lint.acceptance.test.ts` — new; SPEC-03 and SPEC-04 (sandboxed lint probes).
- `doit/TASK-1.28/changes.md`, `doit/TASK-1.28/build-log.md` — build records.

No new dependencies.
