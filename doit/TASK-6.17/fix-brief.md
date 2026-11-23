# TASK-6.17 fix brief (review round 1 MINORs, done in-story; strengthen only)

File: tests/bots/maniac.acceptance.test.ts (unlocked under TASK-6.4; never remove or loosen an assertion)
1. Line ~210, Example A comment: "u < 0.85 threshold" → "u < 0.6 threshold" (the pinned draw is below 0.6 × 2^32).
2. After the Example C re-pin (now calls), no concrete postflop call→raise example remains. Add one postflop
   example where a pinned draw u < 0.6 turns an advised call into a raise (same style as Examples A–C:
   pinned RNG, exact expected move and amount). Keep it < 50 ms.
Then npm run format and the gate.
