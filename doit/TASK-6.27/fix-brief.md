# Fix brief — TASK-6.27 (review round 2)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. [MAJOR] tools/lint/headless-boundary.js:import-meta-glob-bypasses-allow-lists (security review)
- Where: tools/lint/headless-boundary.js:55
- Problem: Vite's import.meta.glob() gets round both new allow-lists and the headless ban on dynamic import(). HEADLESS_RESTRICTED_SYNTAX bans only ImportExpression. import.meta.glob is a MetaProperty member call, so neither no-restricted-imports nor the TSImportType selectors see it. Vite rewrites it into real imports (static imports with { eager: true }) of any matching project module. tsconfig includes the vite/client types, so it typechecks. Vitest supports it too. A bot or advice file can then load src/storage/hand-store (sharedHandStore -> stored records with replay codes) or src/table/session (TableState.hand, botTurn) at runtime. That is the round-1 MAJOR path again, one syntax away. It is also an idiomatic Vite feature (e.g. for loading styles/*.json), so it could turn up without anyone meaning harm.
- Evidence: Linted in-process with the repo config: src/bots/zz.ts `export const m = import.meta.glob('../storage/*.ts', { eager: true });` -> 0 errors; the same in src/advice/zz.ts -> 0 errors. No headless module uses import.meta today (grep of src/engine, bots, advice, stats, playtest, table), so a ban breaks nothing.
- Expected fix: Add { selector: "MetaProperty[meta.name='import'][property.name='meta']", message: 'import.meta (including import.meta.glob) is not allowed in headless modules (REQ-059.2).' } to HEADLESS_RESTRICTED_SYNTAX. It flows into the bot and advice blocks through BOT_DETERMINISM_RESTRICTED_SYNTAX. Add a probe for src/bots and one for src/advice to the acceptance test.


## Also fix in this round (orchestrator; review r2 MINORs, small and in scope)
- Security MINOR: in bot and advice files ban computed member access on globalThis (e.g. globalThis['indexed'+'DB'], globalThis[k]) and turn on no-eval, no-implied-eval and no-new-func. Confirm the whole repo still lints clean.
- Code MINORs: add probes for `./x/../../storage/hand-store` from src/bots, advice type-position `import('./golden')` and `import('../engine/hand').HandState`; document in the advice block's JSDoc that it must stay after botDeterminismConfig; correct the comment at ~line 257 to match the selector.
- Add import.meta probes for src/bots and src/advice (the MAJOR).
Tests go in tests/toolchain/bot-import-gaps.acceptance.test.ts (unlocked for strengthening). Keep every existing assertion; locked TASK-6.21 test unchanged.
