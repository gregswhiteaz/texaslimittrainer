# Postflop advice rules

This document is the single source for how the trainer decides between check, call and fold on the
flop, turn and river. The code in `src/advice/postflop.ts` returns one of the rule ids below with
every recommendation, and a test checks that the ids here, the ids in the code and the unit tests
all match.

## Inputs

- **Hero.** The player asking for advice. Only the hero's own two cards and the public board are
  used. Other players' cards, burn cards and cards still in the deck are never looked at.
- **Live opponents.** Every other player dealt into the hand who has not folded. A player who is
  all in still counts.
- **Opponent hands.** The advice the player sees (hints and review grades) puts each live opponent
  on a range estimated from that opponent's actions in the hand: a default range for their seat
  and preflop line, narrowed on each later street by what they did there. The range model, its
  default ranges and the narrowing rule are described in [range-model.md](range-model.md). The
  bots still treat each opponent as holding any two cards the bot cannot see, every combination
  equally likely. Cards shown at earlier showdowns are never removed, because every hand is dealt
  from a fresh deck.
- **Equity.** The hero's share of the pot if the hand were played out to the river against all live
  opponents at once: wins count in full, ties count as an equal split.
- **Pot.** Every chip already in the middle before the hero acts: all pots from earlier streets
  plus every player's bets on the current street, including the bet the hero is facing.
- **Call amount.** The chips the hero must add to call. It is 0 when nothing is owed.
- **Required equity.** The share of the final pot the hero is paying for:
  call amount ÷ (pot + call amount). It is 0 when nothing is owed.
- **Rounding.** Both equity and required equity are shown as percentages with one decimal place,
  rounded half up. The rules compare these rounded numbers, so the advice always agrees with what
  the player sees.

## Rules

The rules are checked in the order below and the first one that matches decides the advice.

### Rule `check-free`

- **Condition:** the hero owes nothing (no bet to face, or the hero has already matched it).
- **Outcome:** check. Required equity is 0%.
- **Example:** six players at $4/$8. Four players see a flop of a $16 pot. The small blind checks
  to the big blind. The big blind owes nothing, so the advice is check, whatever the cards.
- **Why:** folding when checking costs nothing throws away a chance to win the pot for free. Even
  the weakest hand keeps some chance to improve or to win when everyone else checks behind.

### Rule `pot-odds-call`

- **Condition:** the hero owes chips and the rounded equity is at least the rounded required
  equity.
- **Outcome:** call.
- **Example:** same hand. The small blind bets $4 into the $16 pot, so the pot is now $20 and the
  big blind must call $4. Required equity is 4 ÷ 24 = 16.7%. With equity of 16.7% the advice is
  call: the hand wins at least as often as the price demands.
- **Why:** a call that wins its share of the pot at least as often as it pays for that share does
  not lose money over many hands. An exact tie is treated as a call, because a break-even call
  keeps the hero in the hand at no long-run cost.

### Rule `pot-odds-fold`

- **Condition:** the hero owes chips and the rounded equity is below the rounded required equity.
- **Outcome:** fold.
- **Example:** same spot, but the hero's equity is 16.6%, a tenth of a point under the 16.7%
  needed. The advice is fold.
- **Why:** calling with less equity than the price loses a little every time the spot comes up.
  Over many hands those small losses add up, so letting the hand go is the cheaper choice.

## Not applied yet

These rules use immediate pot odds only. Later work adds:

- betting and raising for value when the hand is ahead of the hands that would call (TASK-7.8);
- implied odds, counting chips won on later streets when a draw hits (TASK-7.9);
- adjusting each opponent's range to their observed habits once 30 or more of their hands have
  been seen (TASK-7.13);
- default ranges for heads-up and full-ring tables (TASK-7.6). Until then opponents at other
  table sizes start from every unseen hand and are narrowed by their actions after the flop;
- action-based ranges for the bots' own decisions, which still use every unseen hand.

Until then the advice never recommends a bet or a raise after the flop.
