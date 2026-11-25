## BUILD (2026-11-25)
- Grepped src, tests, e2e and tools for DB_VERSION, `tlh-trainer` opens, `objectStoreNames` and store lists: the
  only pins of version 4 / the four-store list are the six files named in spec §5 (other tests use `DB_VERSION`
  symbolically or open without a version). No additional locked files, so no blocked.json.
- Added `src/storage/persistent-storage.ts`, the v5 `meta` store and accessors in `hand-store.ts`, and the launch
  call in `main.tsx`. Re-pinned the six tests/helpers (version and store names only; every check kept).
- New tests: `tests/storage/persistent-storage.test.ts` (5 tests), `e2e/persistent-storage.spec.ts` (4 tests x 2 projects).
- `npm test`: 311 files passed, 5 skipped; 1410 tests passed, 46 skipped; coverage 92.86% statements.
- `npm run lint`: clean. `npm run typecheck`: clean.
- `npm run build && npx playwright test`: 357 passed, 19 skipped (SPEC-01 skips on WebKit by design).
- `dist/` contains no persist stub code. No vitest/playwright/preview processes left running.
- Publishing the story doc to Backlog (SPEC-10) is left to the orchestrator (the builder may not use the backlog folder).
