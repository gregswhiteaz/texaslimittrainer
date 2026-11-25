# Fix brief — TASK-6.21 (review round 1)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. [MAJOR] tools/lint/headless-boundary.js:non-normalized-engine-path-bypass (code review)
- Where: tools/lint/headless-boundary.js:144
- Problem: The engine patterns match the raw specifier text, so a path with a non-canonical segment that still resolves to src/engine/hand.ts gets past every pattern. The SPEC-09 scan this replaces ran posix.join on the target first, so it caught these. Replacing it this way loses coverage, which goes against SPEC-04 and the A-1 rule that 'nothing that is forbidden today becomes allowed'.
- Evidence: I ran the repo config in-process with ESLint lintText on src/bots/x.ts. `import { applyAction } from '../engine/./hand'`, `'../engine/hand/../hand'` and `'../engine//hand'` all produce no errors. `'./../engine/hand'`, `'../../engine/hand'` from src/bots/styles, `'../../src/engine/hand'`, `'../engine/hand.ts'`, aliased imports and re-exports (`applyAction as Action`, `export * as h`, `export *`, `export type * from hand`) are all caught. Side-effect `import '../engine/./hand'` is caught by the selector. src/engine has no index.ts, so a bare `'../engine'` import cannot resolve.
- Expected fix: Add a first pattern to BOT_BOUNDARY_PATTERNS that rejects any non-normalized relative specifier, e.g. { regex: '/\\./|//|(^|/)[^./][^/]*/\\.\\.(/|$)', message: BOT_BOUNDARY_MESSAGE } (matches '/./', '//', and 'name/..'). Add `../engine/./hand` and `../engine/hand/../hand` probes to the SPEC-01 sandbox set so a regression fails.

