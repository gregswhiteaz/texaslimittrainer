## BUILD (2026-11-27)
- Added `tests/bots/tag-short-handed-river.acceptance.test.ts` (SPEC-01). `npx vitest run tests/bots/tag-short-handed-river.acceptance.test.ts` → 1 passed (246 ms).
- SPEC-02 mutation: in `decideTag`, returned the legal `call` when `view.street === 'river'` and the engine move is `raise`. New test → 1 failed (`river seat 2: expected { seat: 2, type: 'call', amount: 8 } to deeply equal { seat: 2, type: 'raise', amount: 16 }`). Reverted from backup; rerun → 1 passed. `git diff --stat main -- tests/bots/tag-short-handed.acceptance.test.ts src/` → empty.
- `npm run format`, `npm run lint` (clean), `npm run typecheck` (clean).
- `npm test` → 349 files passed / 11 skipped; 1546 tests passed / 60 skipped. New test 1136 ms under coverage (< 3 s budget).
