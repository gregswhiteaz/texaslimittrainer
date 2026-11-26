# TASK-6.27 changes

- `tools/lint/headless-boundary.js` — modified: `BOT_TYPE_IMPORT_SYNTAX` (two `TSImportType` selectors) appended to `botSeatPolicyConfig`'s `no-restricted-syntax`; `advice/golden` pattern added to `BOT_BOUNDARY_PATTERNS`; new `ADVICE_BOUNDARY_FILES`, `ADVICE_BOUNDARY_IGNORES`, `ADVICE_BOUNDARY_MESSAGE`, `ADVICE_BOUNDARY_PATTERNS` and `adviceHiddenStateConfig` with the D-3/Q-1 comment.
- `eslint.config.js` — modified: imports and registers `adviceHiddenStateConfig` after `botSeatPolicyConfig`.
- `tests/toolchain/bot-import-gaps.acceptance.test.ts` — created: acceptance tests for SPEC-01..05 (one sandbox `npm run lint` plus in-process ESLint checks).

No new dependencies.
