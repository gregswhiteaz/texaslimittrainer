# Fix brief — TASK-1.16 (review round 1)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. [MAJOR] tests/engine/check-deal.test.ts:c5-returned-rule-untested (code review)
- Where: tests/engine/check-deal.test.ts:50
- Problem: Nothing tests checkDeal's C5 returned-chips rule (src/engine/invariants.ts:493). That rule is the reason checkDeal exists for hands dealt out at the deal (A-6, §5). The `wrongReturn` case looks like it covers the rule, but checkState's conservation check already flags it, so the returnedMessage branch never decides the result.
- Evidence: Mutation: replaced `? returnedMessage(state)` with `? null` in checkDeal. All 51 tests in check-deal, all-in-blinds, button-blinds and tests/playtest still pass. Probe: checkState(wrongReturn) returns [chips 'table holds $158 but the hand started with $161'] by itself. A case only C5 catches: W7 dealt-out state with result.returned = {seat:1, amount:3}, seat 1 stack +3 and seat 2 stack -3. checkState gives [] and checkDeal gives [chips 'seat 1 got $3 back but $0 was uncalled']. With the mutation, checkDeal gives [].
- Expected fix: Replace the wrongReturn case (or add one beside it) with a state where conservation holds but the return is wrong. Example: W7 with `returned: {seat: 1, amount: 3}` and stacks moved +3 to seat 1 and -3 from seat 2. Assert checkState(state) is [] and checkDeal(state) equals [{invariant:'chips', message:'seat 1 got $3 back but $0 was uncalled'}].


## Also (MINOR, same round, apply in-story)
- `tests/playtest/runner.test.ts` ~line 307: the restart-after-violation test flags the first action, so the restart is
  always triggered by `result === null`. Make it flag the action that completes the hand, so the `hand.violations > 0`
  half of `runner.ts:320` is what triggers the restart; prove removing that half fails the test.
