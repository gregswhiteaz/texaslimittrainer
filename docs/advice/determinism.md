# Advice determinism

## The guarantee (REQ-036)

The same decision always gets the same advice. The hint, its grade and the post-hand review are a pure function
of two inputs:

1. the deciding seat's `PlayerView` (its own hole cards, the board, the public betting and earlier showdowns), and
2. the observed-stat snapshot of its opponents taken at that decision (`ObservedOpponent[]`: seat, hands, VPIP,
   PFR).

Nothing else feeds the advice: not the clock, not `Math.random`, not other players' hidden cards (REQ-025), and not
stats that change after the decision.

## Where the randomness comes from

Postflop equity is sometimes sampled rather than enumerated (multiway spots). The sampler's generator is seeded
from a hash of the canonical equity input: the hero's cards, the board and the opponents' estimated ranges, all
sorted (`deriveSeed` in `src/advice/equity.ts`). So the same view and snapshot always produce the same samples and
the same percentages. Hidden cards are not in the view, so they can't reach the seed.

## Decision-time snapshot

Observed stats change as the session goes on, so the snapshot belongs to the decision, not to the hand:

- `applyUserAction(table, action, observed)` stores a copy of the snapshot with the decision
  (`UserDecision.observed`). Later changes to the caller's array don't reach the stored copy.
- The advice worker's `recommend` and `grade` requests accept the same `observed` field. An invalid snapshot
  (for example a negative hand count) comes back as `ok: false` with a `RangeError`.
- `reviewEntries` regrades each decision with that decision's own snapshot. The review therefore repeats the hint
  even when the finished hand has already moved the opponent's stats.
- A decision recorded without a snapshot has no `observed` key and is reviewed exactly as before.

The app session doesn't supply snapshots yet; that is TASK-8.1.

## The playtest check

`npm run -s playtest -- --hands 10000 --seed 42 --check-advice`

At every seat's decision point the check computes the user-facing advice
(`recommend(view, { opponentRanges: 'actions', observedOpponents })`) and the grade of the action the seat took,
twice, each time from fresh copies of the view and the snapshot. It compares the two grade results (which include
the whole recommendation) field by field.

The snapshot comes from the run itself: for each seat other than the one acting that has been dealt at least one
counted hand, its hands dealt and unrounded VPIP and PFR, in seat order. Hands that ended at an invariant violation
or without a result don't count, and a bot seat that was replaced (`--lineup` cash runs) starts again from zero.

The report adds one line after the bot results:

```
Advice check: 100113 decision points, 0 mismatches
```

If the two computations ever differ, the run also prints

```
First advice mismatch: hand 17, replay code <code>, player action 4 (seat 3 calls $4), recommendation.equityPct differs
```

naming the first differing field. The mismatch counts as an `advice-determinism` invariant violation: that hand
stops there, the usual `First violation`, `Replay:` line and hand dump follow, and the run exits 1. A mismatch is a
bug in the advice code to report and fix, not noise.

Without `--check-advice` the playtest output is unchanged. The flag can't be combined with `--replay-code`.

## Tests

- `tests/playtest/check-advice.acceptance.test.ts`: 0 mismatches and byte-identical output at 100 hands on every
  push, and at 10,000 hands in `npm run test:slow`; the mismatch report with a varying stub.
- `tests/advice/determinism.acceptance.test.ts`: 1,000 deals that differ only in hidden cards give the same hint
  and grade; the review repeats the hint with later stats; a stored recommendation regrades to the same result.
