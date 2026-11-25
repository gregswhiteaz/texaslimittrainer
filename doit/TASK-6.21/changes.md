# TASK-6.21 changes

- `tools/lint/headless-boundary.js` — modified: extracted `BOT_DETERMINISM_RESTRICTED_SYNTAX` (same entries as before); added `BOT_BOUNDARY_FILES`, `BOT_BOUNDARY_PATTERNS`, side-effect import selector and `botSeatPolicyConfig` (REQ-025.1 bot import boundary for `src/bots/**`).
- `eslint.config.js` — modified: registers `botSeatPolicyConfig` after `botDeterminismConfig`.
- `tests/toolchain/bot-boundary.acceptance.test.ts` — created: SPEC-01, SPEC-02 (one sandbox `npm run lint`), SPEC-03 (in-process ESLint).
- `tests/bots/tag.test.ts` — modified: removed the SPEC-09 source-scan test, `ENGINE_TYPES`, `IMPORT`, `boundaryProblems` and their now-unused imports (SPEC-04).

No new dependencies.
