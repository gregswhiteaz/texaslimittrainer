# Postflop advice rules

This document is the single source for how the trainer decides between fold, check, call, bet and
raise on the flop, turn and river. The code in `src/advice/postflop.ts` returns one of the rule ids below with
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
- **Draw and outs.** With a card still to come (on the flop or turn), the hero has a draw when
  either of these holds:
  - a flush draw: exactly four cards of one suit among the hero's two cards and the board, at least
    one of them in the hero's hand. Its outs are the 9 unseen cards of that suit.
  - an open-ended straight draw: four ranks in a row, at least one from the hero's hand, that one
    more rank at either end turns into a straight. Its outs are the 8 unseen cards of those two
    ranks. The ace sits below the 2 only to finish 2-3-4-5, so A-2-3-4 and J-Q-K-A have one end
    and don't count.

  A hand with both draws counts every out once (15). A draw already made into a flush or straight
  has no outs. Gutshots (one rank missing inside the run) and backdoor draws (needing two more
  cards) count no outs. Outs are not reduced when they might also improve an opponent. On the river
  there are no outs.

- **Implied required equity.** The price of a call when a draw that hits gets paid one more big bet
  by each opponent still able to bet: call amount ÷ (pot + call amount + big bet × those
  opponents). Those opponents are the live opponents who are not all in, since an all-in player has
  no chips left to pay. The big bet is used on every street, because a draw that hits is paid on
  the turn or river, where bets are big bets. It applies only when the hero owes chips, has outs,
  still has chips after calling, and at least one such opponent remains.
- **Range that would call.** The hands an opponent would continue with against a bet or raise:
  their current range (as above) with the Air hands removed, so their Strong, Pair and Draw hands
  stay. These are the same classes the range model keeps when a player calls or raises (see
  [range-model.md](range-model.md)). If none of an opponent's hands would continue, their whole range
  is used instead.
- **Equity against the range that would call.** The hero's pot share, as for equity, but with each
  live opponent holding a hand from their range that would call. With several opponents it is one
  number, computed against all of their calling ranges at once. In the rare case where so many
  opponents' calling ranges overlap that no deal can be sampled, the plain equity is used instead.
- **Value threshold.** 50%. A bet or raise is for value when the hands that call it lose more often
  than they win: above 50% equity against them, each chip they put in earns the hero money.
- **Rounding.** Equity, equity against the range that would call, required equity and implied
  required equity are shown as
  percentages with one decimal place, rounded half up. The rules compare these rounded numbers, so
  the advice always agrees with what the player sees.

## Rules

The rules are checked in the order below and the first one that matches decides the advice.

### Rule `value-bet`

- **Condition:** the hero owes nothing, a bet is legal, and the rounded equity against the range
  that would call is above 50.0%.
- **Outcome:** bet. Required equity is 0%. (In the rare spot where a short all-in left a bet to
  match that the hero has already matched, the legal aggressive move is a raise, and the advice is
  that raise.)
- **Example:** heads-up on a flop of Ks 8d 7c, the hero is first to act. The opponent's range is
  KhKd, 8h7h, AhKh, 9h9d, 6h5h, Th9h, QhJh and Ac2c. The range that would call a bet drops the two
  Air hands, QhJh and Ac2c, and keeps the other six. Holding 8s8c (a set), the hero's equity against
  those six hands is 72.8%, above 50%, so the advice is bet. Holding AsKc (top pair, top kicker),
  equity against the whole range is 60.7% but only 48.9% against the six hands that would call, so
  this rule does not apply and the advice is check.
- **Why:** a bet earns money only from the hands that pay it off. When the hero is ahead of the
  hands that would call, every call adds chips the hero is favoured to win. The hands that fold to
  the bet don't matter: AsKc is ahead of the whole range, but the two Air hands it crushes fold to
  a bet, and the six hands that call win slightly more than half the pot against it.

### Rule `check-free`

- **Condition:** the hero owes nothing (no bet to face, or the hero has already matched it).
- **Outcome:** check. Required equity is 0%.
- **Example:** six players at $4/$8. Four players see a flop of a $16 pot. The small blind checks
  to the big blind. The big blind owes nothing, so the advice is check, whatever the cards.
- **Why:** folding when checking costs nothing throws away a chance to win the pot for free. Even
  the weakest hand keeps some chance to improve or to win when everyone else checks behind.

### Rule `value-raise`

- **Condition:** the hero owes chips, a raise is legal (the street is not capped at four bets and
  the hero has chips beyond the call), and the rounded equity against the range that would call is
  above 50.0%.
- **Outcome:** raise. Required equity is still shown as the price of the call.
- **Example:** six players at $4/$8. The small blind bets $4 into a $16 flop pot, so the pot is $20
  and required equity is 4 ÷ 24 = 16.7%. If the hero's equity against the hands that would call a
  raise is 50.1%, the advice is raise. If the flop already has four bets in, the raise is not legal,
  so the same hand is called or folded by the pot-odds and implied-odds rules below.
- **Why:** a raise puts more chips in when the hero is ahead of the hands that will keep paying.
  Just calling gives up the extra chips those hands would have put in.

### Rule `pot-odds-call`

- **Condition:** the hero owes chips, the value-raise rule does not apply, and the rounded equity
  is at least the rounded required equity.
- **Outcome:** call.
- **Example:** same hand. The small blind bets $4 into the $16 pot, so the pot is now $20 and the
  big blind must call $4. Required equity is 4 ÷ 24 = 16.7%. With equity of 16.7% the advice is
  call: the hand wins at least as often as the price demands.
- **Why:** a call that wins its share of the pot at least as often as it pays for that share does
  not lose money over many hands. An exact tie is treated as a call, because a break-even call
  keeps the hero in the hand at no long-run cost.

### Rule `implied-odds-call`

- **Condition:** the hero owes chips, the value-raise and pot-odds-call rules do not apply, the
  implied required equity applies, and the rounded equity is at least the rounded implied required
  equity.
- **Outcome:** call. Required equity is still shown as the plain pot-odds price, with the implied
  required equity and the outs beside it.
- **Example:** six players at $4/$8, on the turn. The board is Kh 8h 7c 2d and the hero holds
  Ah5h, a flush draw with 9 outs: 2h 3h 4h 6h 7h 9h Th Jh Qh. The only opponent left holds AsKd and
  bets $8, so the pot is $28. The hero wins with 9 of the 44 unseen river cards, equity 20.5%.
  Required equity is 8 ÷ 36 = 22.2%, so pot odds alone say fold. One more big bet from the opponent
  when a heart comes makes the implied required equity 8 ÷ 44 = 18.2%, so the advice is call. With
  a $12 pot instead, required equity is 8 ÷ 20 = 40.0% and implied required equity 8 ÷ 28 = 28.6%;
  20.5% falls short of both and the advice is fold.
- **Why:** when a draw comes in, an opponent who is still in the hand usually puts in at least one
  more bet, and the hero wins it. Those later chips are part of what the call buys, so a draw can
  be worth calling at a price slightly worse than the pot alone offers. Only one big bet per
  opponent is counted, which keeps the estimate modest.

### Rule `pot-odds-fold`

- **Condition:** the hero owes chips, the value-raise rule does not apply, the rounded equity is
  below the rounded required equity, and the implied-odds rule does not apply.
- **Outcome:** fold.
- **Example:** same spot, but the hero's equity is 16.6%, a tenth of a point under the 16.7%
  needed. The advice is fold.
- **Why:** calling with less equity than the price loses a little every time the spot comes up.
  Over many hands those small losses add up, so letting the hand go is the cheaper choice.

## Not applied yet

These rules use pot odds, implied odds for flush and open-ended straight draws, and the value
threshold only. They never bluff: a bet or raise is recommended only for value. Later work adds:

- adjusting each opponent's range to their observed habits once 30 or more of their hands have
  been seen (TASK-7.13);
- default ranges for heads-up and full-ring tables (TASK-7.6). Until then opponents at other
  table sizes start from every unseen hand and are narrowed by their actions after the flop;
- action-based ranges for the bots' own decisions, which still use every unseen hand (TASK-7.25).

The bots apply the same rules, but compute equity with a smaller budget than the advice the player
sees: exact only when the work is small (2,500 hand evaluations instead of 200,000), otherwise 500
sampled deals instead of 30,000. Their numbers are rougher, which keeps long playtests fast; the
player's hints and grades are unaffected.
