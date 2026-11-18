# Fix brief — TASK-7.2 (review round 1)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. [MAJOR] src/advice/charts/six-max.json:hj-raise-and-calls-wrong-premise (code review)
- Where: src/advice/charts/six-max.json:310
- Problem: The HJ raise-and-calls justification describes a spot that can't happen, and the range was built on the same wrong idea. It says 'the raiser came from an early seat and is strong'. But HJ sits directly after UTG, so on the first round no call can come between a UTG raise and HJ. HJ only faces raise-and-calls after limping itself, when a later seat (CO, BTN, SB or BB) raised and others called. The acceptance script builds exactly this: 4 call, 5 call, 6 raise, 1 call, 2 fold, 3 fold, 4 call, then hero 5. This text is strategy the user sees (SPEC-15 requires each justification to explain the range correctly). The grid follows the wrong idea too: HJ raise-and-calls folds A9s-A6s, KTs, QTs and 87s, which CO raise-and-calls calls. Yet HJ already has a bet in, faces a wider raiser from a later seat, and the betting is close to closed, so it should be at least as wide as CO.
- Evidence: Spec section 5 rule 3, plus the SCRIPTS entry for HJ raise-and-calls in tests/advice/preflop.acceptance.test.ts. Compare the HJ and CO raise-and-calls grids, row A and row K.
- Expected fix: Rewrite the HJ raise-and-calls justification for the spot that actually occurs: we limped, a later seat raised, at least one player called, and we owe one more bet into a multiway pot, usually closing the action. Then review the grid against that premise, for example by calling the suited aces and suited kings that CO raise-and-calls calls. Keep it within the 6-18% band.

