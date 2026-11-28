# Fix brief — TASK-10.14 (orchestrator, from review r1 MINOR 2; recorded deviation from A-5)

A-5 is an assumption, and AC#2 requires accuracy. Below the 65% bar, the implied-odds rule can also decide (postflop.ts:197-199, 249; docs/advice/postflop-rules.md:112).

1. In `src/stats/leak-categories.json`, set the `flop-facing-a-bet-raise` justification to exactly:
   "The value-raise rule asks for more than 65% equity against the hands that would call a raise, so a hand below that bar should just call or fold by the pot-odds and implied-odds rules (value-raise, pot-odds-call, implied-odds-call)."
2. Update the same cell in `docs/stats/leaks.md`, and the expected constant in `tests/stats/leak-copy.acceptance.test.ts` (unlocked for this; replace the value only, keep every check).
3. Change nothing else. `npm run format`, then the gate must pass.
