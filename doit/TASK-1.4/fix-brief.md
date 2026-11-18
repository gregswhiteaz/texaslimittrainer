# Fix brief — TASK-1.4 (review round 1)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. [MAJOR] src/engine/hand.ts:stakes-relationships-unvalidated (security review)
- Where: src/engine/hand.ts:134
- Problem: validate() checks each stake is a positive integer but nothing about how they relate. The A-7 stack minimum (8*smallBet + 8*bigBet) leaves the blinds out, so blinds can be larger than a stack. createHand then posts them anyway and stacks go negative, which creates chips. If smallBlind > bigBlind, the SB's streetContribution is above currentBet. legalActions then offers the SB 'check' (owe < 0), and because the round only closes when every streetContribution === currentBet, it can never close: a check/call loop runs forever.
- Evidence: HandConfig.stakes comes from engine callers, including replay of stored records (spec section 8: 'Config is fully validated') -> validate() line 134-135 only runs isPositiveInteger on each amount -> createHand line 168 'stack: stack - blind' with no affordability check; applyAction line 400 closing condition. Reproduced on a scratch copy of the engine: stakes {smallBlind:500,bigBlind:1000,smallBet:1,bigBet:1}, stacks 16 -> stacks [16,-484,-984]. Stakes {8,4,4,8}, stacks 200, always check/call -> 10,000 legal actions applied, still preflop, contributions [4,8,4] against currentBet 4, never ends.
- Expected fix: In validate(), reject stakes that break the fixed-limit structure, e.g. require smallBlind <= bigBlind <= smallBet < bigBet (or at least smallBlind <= bigBlind and bigBlind <= smallBet so the A-7 minimum covers the blinds). Use the existing 'Invalid stakes' RangeError and add a SPEC-13 case for each new rule.

