# Fix brief — TASK-1.53 (review round 1)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. [MAJOR] tests/ci/sweep-shards.test.ts:invalid-weight-cases-cannot-fail (code review)
- Where: tests/ci/sweep-shards.test.ts:25
- Problem: SPEC-05 says a weight of -1, NaN or a string counts as 1. The test puts each bad value on `e` in the worked example, but `e` is the lightest file and sorts last by path. So for -1 and NaN the result is the same whether the bad weight is replaced by 1 or used as is. An implementation that drops the `value >= 0` check, or the `Number.isFinite` check, still passes.
- Evidence: I copied the LPT into a scratch script and ran three weightOf variants: the correct one, one without the `>= 0` check, and one that uses any number as is. With `{...WEIGHTS, e: -1}` and `{...WEIGHTS, e: NaN}` all three return [["a","d"],["b","c","e"]]. The `-1` case also gives the same result for all three variants whichever file holds it. Line 30 (e: 9) proves only that the default is not 9; it says nothing about how invalid values are handled.
- Expected fix: Use a fixture where the bad value changes the outcome, e.g. `for (const bad of [-1, NaN, '5']) expect(assignShards(['x', 'y'], { x: bad, y: 1 } as unknown as Record<string, number>, 2), String(bad)).toEqual([['x'], ['y']]);`. If x counts as 1 it ties with y and goes first by path, so it lands in group 0. If x keeps -1 the result is [['y'],['x']], and if x keeps NaN it is [['x','y'],[]]. Keep the worked-example assertions as they are.


## Orchestrator note (in scope, cheap)
Also close review MINOR `tools/ci/sweep-shards.ts:48`: add a unit test that a `WeightedSequencer` constructed without the weights argument uses the committed `tools/ci/sweep-weights.json` (e.g. its shard assignment for a few real heavy file paths differs from the empty-weights assignment). And use `DEFAULT_WEIGHT_SECONDS` instead of the literal `1` in `tests/ci/ci-shards.acceptance.test.ts:102` only if that file is not locked yet; otherwise leave it.
