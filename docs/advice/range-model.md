# Opponent range model

This document describes how the trainer estimates the hands each opponent may hold after the flop.
The code is `src/advice/ranges.ts` and the default ranges are `src/advice/ranges/heads-up.json`,
`src/advice/ranges/six-max.json` and `src/advice/ranges/full-ring.json`.
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

**Table size and position.** The number of seats dealt in picks the data file, and the seat picks
the position, counting only seats dealt in:

| Seats dealt in | Data file        | Positions                                       |
| -------------- | ---------------- | ----------------------------------------------- |
| 2              | `heads-up.json`  | BTN (the button, who posts the small blind), BB |
| 3 to 7         | `six-max.json`   | SB, BB, UTG, HJ, CO, BTN                        |
| 8, 9 or 10     | `full-ring.json` | SB, BB, UTG, UTG+1, MP, LJ, HJ, CO, BTN         |

The table size picks the same reference size as the preflop charts: 2 seats heads-up, 3 to 7 seats
six-max and 8 to 10 seats full ring. At six-max and full ring the seats are named back from the
button, as on the preflop charts. Six-max seats with 3 seats are BTN, SB, BB; with 4 seats CO, BTN,
SB, BB; with 5 seats HJ, CO, BTN, SB, BB; with 6 seats UTG, HJ, CO, BTN, SB, BB. With 7 seats the
two seats after the big blind are both UTG and share the UTG ranges. At full ring the names run BTN,
CO, HJ, LJ, MP, UTG+1, UTG. With 8 seats nobody is UTG: the first seat after the big blind is UTG+1.
With 10 seats the two seats after the big blind are both UTG and share the UTG ranges.

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
line. Every other line applies to every position. That gives 12 (position, line) pairs heads-up,
36 at six-max and 54 at full ring. Each has a range in its data file.

### Default range file

Each file is checked when the app loads. `referenceSize` is `heads-up`, `6-max` or `full-ring`.
Its shape:

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
apply at the file's size (such as UTG at heads-up, or a BB limp anywhere) or a duplicate pair stops
the file from loading, and the error lists every problem at once, for example
`heads-up ranges: missing range BTN limp`.

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

### Heads-up and full-ring ranges (TASK-7.26)

Full ring is tighter than six-max at every comparable seat, because more players are left to act.
Typical players raise less than the full-ring chart (UTG opens 6.9% of hands against the chart's
9.2%, the button 27.3% against 37.3%) and limp part of the rest; a seat's limp and open-raise
ranges never share a hand. Early re-raises are big pairs and AK only, and every four-bet range sits
inside the same seat's three-bet range. Heads-up is far wider: the button raises about 49% and
limps about 19%, while the big blind defends a raise with about 56% (45% calls, 11% re-raises), so
a typical heads-up player folds the big blind too often.

Each range's width (its combinations before dead cards, as a percent of 1,326) must lie inside its
band. A test checks every row below.

| Size      | Position | Line           | Band % |
| --------- | -------- | -------------- | ------ |
| heads-up  | BB       | check          | 65–90  |
| heads-up  | BTN      | limp           | 10–30  |
| heads-up  | BTN      | open-raise     | 40–70  |
| heads-up  | BB       | open-raise     | 10–30  |
| heads-up  | BTN      | call-raise     | 5–20   |
| heads-up  | BB       | call-raise     | 35–65  |
| heads-up  | BTN      | three-bet      | 2–8    |
| heads-up  | BB       | three-bet      | 6–20   |
| heads-up  | BTN      | call-three-bet | 12–40  |
| heads-up  | BB       | call-three-bet | 8–30   |
| heads-up  | BTN      | four-bet       | 1.5–8  |
| heads-up  | BB       | four-bet       | 1.5–8  |
| full-ring | BB       | check          | 80–97  |
| full-ring | UTG      | limp           | 3–14   |
| full-ring | UTG+1    | limp           | 3–14   |
| full-ring | MP       | limp           | 3–14   |
| full-ring | LJ       | limp           | 3–14   |
| full-ring | HJ       | limp           | 3–14   |
| full-ring | CO       | limp           | 3–14   |
| full-ring | BTN      | limp           | 5–20   |
| full-ring | SB       | limp           | 20–55  |
| full-ring | UTG      | open-raise     | 5–10   |
| full-ring | UTG+1    | open-raise     | 6–12   |
| full-ring | MP       | open-raise     | 7–14   |
| full-ring | LJ       | open-raise     | 8–16   |
| full-ring | HJ       | open-raise     | 10–19  |
| full-ring | CO       | open-raise     | 13–25  |
| full-ring | BTN      | open-raise     | 18–35  |
| full-ring | SB       | open-raise     | 9–25   |
| full-ring | BB       | open-raise     | 4–12   |
| full-ring | UTG      | call-raise     | 5–15   |
| full-ring | UTG+1    | call-raise     | 5–15   |
| full-ring | MP       | call-raise     | 5–15   |
| full-ring | LJ       | call-raise     | 5–15   |
| full-ring | HJ       | call-raise     | 8–20   |
| full-ring | CO       | call-raise     | 8–22   |
| full-ring | BTN      | call-raise     | 12–28  |
| full-ring | SB       | call-raise     | 8–22   |
| full-ring | BB       | call-raise     | 18–45  |
| full-ring | UTG      | three-bet      | 2–8    |
| full-ring | UTG+1    | three-bet      | 2–8    |
| full-ring | MP       | three-bet      | 2–8    |
| full-ring | LJ       | three-bet      | 2–8    |
| full-ring | HJ       | three-bet      | 2–8    |
| full-ring | CO       | three-bet      | 2–8    |
| full-ring | BTN      | three-bet      | 2–8    |
| full-ring | SB       | three-bet      | 2–8    |
| full-ring | BB       | three-bet      | 2–8    |
| full-ring | UTG      | call-three-bet | 2.5–18 |
| full-ring | UTG+1    | call-three-bet | 2.5–18 |
| full-ring | MP       | call-three-bet | 2.5–18 |
| full-ring | LJ       | call-three-bet | 2.5–18 |
| full-ring | HJ       | call-three-bet | 2.5–18 |
| full-ring | CO       | call-three-bet | 2.5–18 |
| full-ring | BTN      | call-three-bet | 2.5–18 |
| full-ring | SB       | call-three-bet | 2.5–18 |
| full-ring | BB       | call-three-bet | 2.5–18 |
| full-ring | UTG      | four-bet       | 1–4    |
| full-ring | UTG+1    | four-bet       | 1–4    |
| full-ring | MP       | four-bet       | 1–4    |
| full-ring | LJ       | four-bet       | 1–4    |
| full-ring | HJ       | four-bet       | 1–4    |
| full-ring | CO       | four-bet       | 1–4    |
| full-ring | BTN      | four-bet       | 1–4    |
| full-ring | SB       | four-bet       | 1–4    |
| full-ring | BB       | four-bet       | 1–4    |

### Removing dead cards

A class is turned into its two-card combinations, and every combination that uses one of the
hero's cards or a board card is dropped. Cards shown at earlier showdowns are not dropped, because
every hand is dealt from a fresh deck.

### Effect at heads-up and full ring (TASK-7.26)

Measured on all-TAG cash playtests (seed 42), the five style stats summed over every seat, before and after the
heads-up and full-ring ranges. Healthy ranges are from `src/stats/healthy-ranges.json`.

| Size (hands)            | VPIP  | PFR   | Aggression | WTSD  | W$SD  |
| ----------------------- | ----- | ----- | ---------- | ----- | ----- |
| heads-up 10,000, before | 79.3  | 47.0  | 66.4       | 42.7  | 53.6  |
| heads-up 10,000, after  | 79.3  | 47.0  | 69.5       | 43.2  | 53.9  |
| heads-up 100,000, after | 79.3  | 47.0  | 69.5       | 42.7  | 53.8  |
| heads-up healthy        | 65–90 | 40–75 | 50–70      | 40–55 | 46–56 |
| 9 seats 10,000, before  | 15.2  | 11.3  | 59.4       | 50.7  | 49.8  |
| 9 seats 10,000, after   | 15.2  | 11.3  | 63.7       | 38.6  | 50.5  |
| 9 seats 100,000, after  | 15.1  | 11.3  | 63.8       | 38.4  | 50.9  |
| full-ring healthy       | 13–20 | 9–16  | 50–66      | 28–40 | 47–57 |

Before the change the 9-seat WTSD (50.7) was above its healthy range; with the full-ring ranges it falls to 38.4, inside
the range. Every stat at both sizes is now inside its healthy range. Heads-up aggression (69.5) sits just under its
70 ceiling. Preflop stats do not move, because the preflop charts are unchanged.

### Effect at 3, 4, 5 and 7 seats (TASK-7.35)

Measured the same way (all-TAG cash, seed 42, stats summed over every seat), before and after tables with 3, 4, 5
or 7 seats moved from every unseen hand to the six-max ranges. Each size is compared with the six-max healthy
ranges, as the session report does.

| Size (hands)           | VPIP  | PFR   | Aggression | WTSD  | W$SD  |
| ---------------------- | ----- | ----- | ---------- | ----- | ----- |
| 3 seats 10,000, before | 31.0  | 21.9  | 64.2       | 41.2  | 52.6  |
| 3 seats 10,000, after  | 31.0  | 21.9  | 65.8       | 40.9  | 52.8  |
| 3 seats 100,000, after | 31.1  | 22.0  | 65.9       | 41.7  | 52.7  |
| 4 seats 10,000, before | 27.9  | 20.1  | 63.2       | 44.4  | 51.6  |
| 4 seats 10,000, after  | 27.9  | 20.1  | 65.0       | 42.5  | 51.7  |
| 4 seats 100,000, after | 28.1  | 20.4  | 65.2       | 41.5  | 52.2  |
| 5 seats 10,000, before | 24.9  | 18.1  | 61.9       | 44.9  | 51.6  |
| 5 seats 10,000, after  | 24.9  | 18.1  | 64.6       | 41.1  | 52.0  |
| 5 seats 100,000, after | 24.8  | 18.1  | 64.7       | 40.9  | 52.0  |
| 7 seats 10,000, before | 20.4  | 14.8  | 60.8       | 46.5  | 50.6  |
| 7 seats 10,000, after  | 20.4  | 14.8  | 63.9       | 40.0  | 51.5  |
| 7 seats 100,000, after | 20.4  | 14.9  | 63.7       | 40.3  | 51.2  |
| 6-max healthy          | 20–28 | 14–22 | 50–66      | 30–42 | 47–57 |

Before the change WTSD was above its healthy range at 4, 5 and 7 seats (44.4, 44.9 and 46.5). With the six-max
ranges it falls to 40.3–41.7 over 100,000 hands, inside the range at every size. Aggression rises by 1.5 to 3 points
and stays inside. Stats still outside their healthy range after the change:

- 3 seats VPIP 31.1 (100,000 hands; 31.0 over 10,000), above 20–28.
- 4 seats VPIP 28.1 (100,000 hands), just above 20–28 (27.9 over 10,000).
- 4 seats WTSD 42.5 over 10,000 hands, just above 30–42 (41.5 over 100,000, inside).

VPIP and PFR come from the preflop charts, which this change does not touch, so the two VPIP misses were there
before too.

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

The `check` line is not a voluntary range, so it keeps its default. The scaling applies at every
table size from 2 to 10 seats, because every size has default ranges. The simpler "every unseen
hand" mode ignores the snapshot.

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

**Known limits.** Equity against one random hand values offsuit high-card hands above suited
connectors: Q2o (47.1%) ranks ahead of 76s (45.2%), although 76s plays better against the ranges
real opponents hold. Scaling the `three-bet` and `four-bet` lines by PFR % also widens those
re-raise ranges a lot, since an opponent's raise rate is far higher than their re-raise rate. A
follow-up decision task (TASK-7.29) tracks whether to change the order or the re-raise scaling.

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
- **Other table sizes.** Only heads-up, six-max and full-ring ranges are authored. Tables with 3,
  4, 5 or 7 seats dealt in use the six-max ranges for their positions (TASK-7.35), so the ranges
  are an approximation there, as the preflop charts are.

All of these steps are fixed and depend only on what the hero can see, so the same decision always
gets the same advice.

## Who uses it

Hints, review grades and the bots all use these ranges. The bots always use the typical-player
basis: they never pass observed stats, so their ranges come from the default ranges and the
narrowing above only (REQ-029.2). Before TASK-7.32 the bots weighed their decisions against every
unseen hand, which made them call almost every bet after the flop (see
[postflop-rules.md](postflop-rules.md#why-bots-almost-never-folded-task-732)).
