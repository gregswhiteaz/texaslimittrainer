# Opponent range model

This document describes how the trainer estimates the hands each opponent may hold after the flop.
The code is `src/advice/ranges.ts` and the default ranges are `src/advice/ranges/six-max.json`.
The postflop rules in [postflop-rules.md](postflop-rules.md) compute the hero's equity against
these ranges when the player asks for a hint or reads the hand review.

## What the model reads

The model reads only what the hero can see at the table: the seats dealt in, the button, who has
folded, the board, the hero's own two cards and every public action so far. It never reads another
player's hole cards, a bot's style name or any of a bot's internal settings. The type checker
enforces this: passing a bot's style or options object into the advice functions is a compile
error, and the advice code imports nothing from the bots, the table or the user interface.

Every opponent starts as a typical player. Once 30 or more of an opponent's hands have been seen,
their preflop range is rebuilt from their observed habits (see "Adjusting to observed play" below).

## Starting range

Each live opponent starts from a default range picked by two keys.

**Position.** At a six-handed table the seats after the button are SB, BB, UTG, HJ, CO and BTN.

**Preflop line.** The opponent's last voluntary action before the flop, counted against how many
raises came before it. Posting a blind is not a voluntary action.

| Last action            | No raise before | One raise before | Two or more raises before |
| ---------------------- | --------------- | ---------------- | ------------------------- |
| check (big blind)      | `check`         | —                | —                         |
| call (or SB completes) | `limp`          | `call-raise`     | `call-three-bet`          |
| raise                  | `open-raise`    | `three-bet`      | `four-bet`                |

So a player who limps and then calls a raise is on the `call-raise` line, and a player who opens and
then calls a re-raise is on the `call-three-bet` line. A blind who went all in when posting, and so
never acted, is keyed as if they had called: `check` for the big blind or `limp` for the small blind
when nobody raised, `call-raise` after one raise and `call-three-bet` after more.

The seven lines are `check`, `limp`, `open-raise`, `call-raise`, `three-bet`, `call-three-bet` and
`four-bet`. Only the big blind can take the `check` line, and the big blind never takes the `limp`
line, so a six-handed table has 36 (position, line) pairs. Each has a range in the data file.

### Default range file

The file is checked when the app loads. Its shape:

```json
{
  "format": "tlh-default-ranges",
  "version": 1,
  "referenceSize": "6-max",
  "justification": "Why these ranges, in at least 50 words.",
  "ranges": [
    {
      "position": "CO",
      "line": "open-raise",
      "justification": "Why this range, in at least 15 words.",
      "hands": "33+ A2s+ A9o+ ..."
    }
  ]
}
```

Every pair must be present exactly once with a plain-English justification and at least one hand.
A missing pair, a short justification, an empty or invalid `hands` field, a pair that does not
apply at six-max or a duplicate pair stops the file from loading, and the error lists every problem
at once.

### Hand notation

`hands` is a list of hand classes separated by spaces. The higher rank comes first.

- `AA`, `AKs`, `T9o`: one class (a pair, suited or offsuit).
- `TT+`: that pair and every higher pair (`TT JJ QQ KK AA`).
- `A9s+`, `KTo+`: the first card fixed and the second rising to one below it (`A9s ATs AJs AQs AKs`).
- `22-66`: every pair between the two, in either order.
- `K5s-K9s`: the same first card and suitedness, with every second card between the two.

Classes named by more than one token count once. Anything else, such as `AAs`, `KAs` or `KK+s`, is
rejected.

The ranges model a typical low-stakes limit player, who is looser than the trainer's own preflop
chart. The data file holds the justification for each range.

### Removing dead cards

A class is turned into its two-card combinations, and every combination that uses one of the
hero's cards or a board card is dropped. Cards shown at earlier showdowns are not dropped, because
every hand is dealt from a fresh deck.

## Adjusting to observed play

The caller may pass a snapshot of each opponent's session stats with every decision: hands seen,
VPIP % (how often they put chips in voluntarily before the flop) and PFR % (how often they raised
before the flop). The advice reads it as part of its input, so the same decision with the same
snapshot always gets the same advice. Only the player's hints and review can pass it; the bots
never do, so their play does not change. Nothing passes a snapshot yet: the hint (TASK-8.1), the
review (TASK-9.3) and the decision record (TASK-3.12) add it and show the basis on screen.

**Threshold.** An opponent with fewer than 30 observed hands, or with no entry, keeps the default
range. Entries for the hero, folded seats or seats not in the hand are ignored. Hands seen must be
a whole number of at least 0, and VPIP and PFR must be between 0 and 100; anything else, or a seat
listed twice, is an error.

**Width.** From 30 hands on, the range width in percent of all 1,326 starting combinations is

`width = d + (o − d) × min(n, 100) ÷ 100`

where `d` is the width of the default range (its combinations before dead cards are removed, as a
percent of 1,326), `o` is the observed stat and `n` is the hands seen. The observed habit counts
for more as hands build up and fully from 100 hands. With `d` = 20 and 30 hands, an `o` of 0, 20 or
100 gives 14.0, 20.0 or 44.0; with 100 hands and `o` = 60 the width is 60.0.

| Preflop line                           | Observed stat `o` |
| -------------------------------------- | ----------------- |
| `open-raise`, `three-bet`, `four-bet`  | PFR %             |
| `limp`, `call-raise`, `call-three-bet` | VPIP %            |
| `check` (big blind, nobody raised)     | not scaled        |

The `check` line is not a voluntary range, so it keeps its default. Tables that are not six-handed
have no default range to scale yet, and the simpler "every unseen hand" mode ignores the snapshot.

**Hand order.** The rebuilt range is the strongest `width` % of starting hands in the hand order
stored in `src/advice/ranges/hand-order.json`: the shortest run of classes from the top of the
order whose combinations reach `width ÷ 100 × 1,326`. It never holds fewer than AA, so a width of
0 leaves the 6 combinations of a pair of aces, and a width of 100 or more holds every class. The
order ranks all 169 classes by their all-in equity before the flop against one random hand,
computed with the project's own calculator (the class's lowest-numbered combination against every
unseen combination, 30,000 sampled deals seeded from the input) and rounded to one decimal place.
Equal numbers keep the starting-hand grid order. AA (85.5%) is first and 32o (32.1%) is last. The
file is checked when the app loads: it needs its format and version, a justification of at least
50 words, all 169 classes once each, falling equities and AA first.

Dead cards, narrowing after the flop and the safety rules then apply as for a default range.

**Basis.** Each estimate and each postflop recommendation states, per live opponent, which range
was used: `typical player`, or `based on N hands of this opponent` when the range was rebuilt. When
any opponent's range was rebuilt, the explanation starts by naming the opponent type (see
[explanations.md](explanations.md)).

## Narrowing after the flop

On each street the opponent has acted on, the model takes the most aggressive thing they did there
(raise, then bet, then call, then check), sorts each combination in their range into one of four
classes on the board as it stood on that street, and keeps only some classes:

| Action on the street | Keeps              |
| -------------------- | ------------------ |
| bet                  | Strong, Pair, Draw |
| check                | Pair, Draw, Air    |
| call                 | Pair, Draw         |
| raise                | Strong, Draw       |

So a check-raise narrows once, as a raise. A street the opponent has not acted on yet does not
narrow their range. Each street narrows what the previous street left.

### Classes

The checks run in order and the first that matches decides the class.

1. **Strong:** the best five cards from the combination plus the board make two pair or better, and
   that hand is a higher category than the board makes on its own. A player whose best hand is the
   board's own two pair, or the board's own straight, is not Strong.
2. **Pair:** the two cards are a pocket pair, or either card matches the rank of a board card.
3. **Draw:** four cards of one suit among the combination and the board, at least one of them from
   the combination; or four ranks in a row, at least one from the combination, that one more card
   could complete at either end. 2-3-4-5 counts (an ace or a 6 completes it) and 10-J-Q-K counts,
   but A-2-3-4 and J-Q-K-A do not.
4. **Air:** anything else.

On a flop or turn the board's own category comes from its paired ranks only (a pair, two pair,
trips or quads); on the river it is the board's best five-card hand.

### Worked example

An opponent's range is {KhKd, 8h7h, AhKh, 9h9d, 6h5h, Th9h, QhJh, Ac2c} and the flop is Ks 8d 7c.
The board on its own is just a high card.

| Combination | Class on Ks 8d 7c | Why                                      |
| ----------- | ----------------- | ---------------------------------------- |
| KhKd        | Strong            | three kings                              |
| 8h7h        | Strong            | two pair, eights and sevens              |
| AhKh        | Pair              | the king pairs the board                 |
| 9h9d        | Pair              | a pocket pair                            |
| 6h5h        | Draw              | 5-6-7-8, open at both ends               |
| Th9h        | Draw              | 7-8-9-10, open at both ends              |
| QhJh        | Air               | J-Q-K is only three in a row; two hearts |
| Ac2c        | Air               | three clubs only, no run                 |

- If the opponent bets the flop, Air goes: 6 combinations remain.
- If they check, Strong goes: {AhKh, 9h9d, 6h5h, Th9h, QhJh, Ac2c}.
- If they call a bet, only Pair and Draw stay: {AhKh, 9h9d, 6h5h, Th9h}.
- If they raise, only Strong and Draw stay: {KhKd, 8h7h, 6h5h, Th9h}.

If they check the flop and then call a bet on the turn 2d, the six checked combinations are sorted
again on Ks 8d 7c 2d. Ac2c now pairs the 2, so it is a Pair; QhJh is still Air. Calling keeps Pair
and Draw, which leaves {AhKh, 9h9d, 6h5h, Th9h, Ac2c}.

## Safety rules

- **Nothing left.** If one street's narrowing would leave no combination, that street is skipped
  and the range from before it is kept.
- **Fully blocked start.** If the hero's cards and the board block every combination of a tiny
  default range, the opponent starts from every unseen hand instead.
- **Cards that cannot all be dealt.** With several opponents, their ranges can occasionally clash
  so that no deal gives every one of them a hand. The equity is then computed again from the
  starting ranges before narrowing, and if that also fails, from every unseen hand for everyone.
- **Other table sizes.** Default ranges exist for six-handed tables only so far (TASK-7.6 adds
  heads-up and full-ring). At any other size every opponent starts from every unseen hand, and the
  narrowing after the flop still applies.

All of these steps are fixed and depend only on what the hero can see, so the same decision always
gets the same advice.

## Who uses it

Hints and review grades use these ranges. The bots still weigh their own decisions against every
unseen hand for now; moving them to this model is a later task.
