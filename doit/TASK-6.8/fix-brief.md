# Fix brief — TASK-6.8 (code review R1 MINORs, in-story, strengthen-only)
1. `tests/playtest/replacement.acceptance.test.ts:125` soft-check-rests-on-one-draw: also assert each replacement's style
   equals `drawReplacementStyle(preset, size, handReplayCode(seed, k-1), seat)` (Soft, and Mixed/Tough where cheap), so the
   check doesn't rest on one draw. Keep every existing assertion.
2. `tests/table/replace-bot.acceptance.test.ts:18` duplicated `withFinalStacks` (also tests/table/next-hand.test.ts:100):
   move to tests/support/table-scenarios.ts and import it in both (next-hand.test.ts is not locked; check).
3. NIT `tests/playtest/replacement.acceptance.test.ts:140/165`: one slug-conversion helper.
Keep tests fast. `npm run format`; gate; never push.
