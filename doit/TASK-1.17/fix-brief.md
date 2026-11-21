# Fix brief — TASK-1.17 (judge round 1)

1. **J-1-02 (LOW, apply in-story):** add a unit test in `tests/playtest/shards.test.ts` (unlocked) where the same
   invariant id is non-zero in two shards (e.g. chips 2 and chips 3) and assert the combined count is the sum (5).
   Prove it fails if the combine step used `Math.max` instead of a sum (exact text replacement, then restore).
2. **J-1-01 (branch CI red):** not a code change in this task — the failing test is `e2e/cards.spec.ts:215` (WebKit
   logo-decode check), untouched by this task and passing 20/20 locally. Do NOT edit it. The orchestrator will push
   this fix commit and require a green CI run.
Run `npm run format` before the gate. Never push.
