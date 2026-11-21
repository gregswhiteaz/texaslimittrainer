# Fix brief — TASK-6.2 (code review round 1 MINOR + NIT, applied in-story)

1. **MINOR** `tests/bots/tag-seed-parity.acceptance.test.ts:67` (unlocked for this, strengthen-only): record the seed
   the playtest policy actually used — capture it inside `makePolicy` (wrap seededTagPolicy so each decision logs the
   seed it derived) — and assert it equals the worker request's seed for every bot decision, in addition to the existing
   action-list equality. Prove it fails if the policy used a different seed (e.g. k+1) — exact text replacement in a
   temp copy, then restore.
2. **NIT** `src/bots/style.ts:121`: for {0,0} report both problems (fewer than two non-zero actions AND sum ≠ 1) instead
   of `else if`; add the {0,0} case to tests/bots/style.test.ts.
Don't change other assertions. `npm run format` before the gate. Never push.
