# TASK-6.29 changes

- `tools/lint/headless-boundary.js` — new shared `NAME_ONLY_POSITIONS` (reused by `BARE_GLOBAL_REFERENCE`, same matches), `FUNCTION_CONSTRUCTOR_MESSAGE` and `GLOBAL_ALIAS_MESSAGE`, six new `no-restricted-syntax` entries (B1..B6: `.constructor`, `'constructor'` literal and template, `{ constructor }` destructuring, value-position `Function`, value-position `global`) in `BOT_DETERMINISM_RESTRICTED_SYNTAX`, and two `no-restricted-properties` entries (B7 `globalThis.Function`, B8 `globalThis.global`) in `botDeterminismConfig` (SPEC-01..05).
- `tests/toolchain/bot-function-escapes.acceptance.test.ts` — new in-process ESLint acceptance probes for every ban plus clean probes and real-folder lint (SPEC-01..04).
- `tools/lint/headless-boundary.js` (FIX r1, AC#3) — `PROCESS_GLOBAL_MESSAGE`, B9 `no-restricted-syntax` entry for value-position `process` and B10 `no-restricted-properties` entry for `globalThis.process`.
- `tests/toolchain/bot-process-escapes.acceptance.test.ts` — new probes for `process.hrtime()[1]`, `process.uptime()`, `process.getBuiltinModule(...)`, `globalThis.process.hrtime()` and a clean `declare global` / `process` property-name probe (AC#3).

No new dependencies.
