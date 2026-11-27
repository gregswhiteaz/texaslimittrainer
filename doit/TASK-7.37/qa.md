# TASK-7.37 Q&A (autopilot)

No ask items.

## Q-1 (from builder blocked.json, SPEC-08) Locked tests/playtest/summary.acceptance.test.ts (owner TASK-1.26) fixture depends on TAG hand-1 play
Options: (a) withAwards fixture omits the copied result's optional `returned` so the test checks largestPot = award sum independent of TAG play; (b) re-pin 140 → 142; (c) change the fixture seat count.
**Answer: auto-accepted (recommended)** — (a). Unlocked under TASK-1.26; no assertion changed or dropped.
