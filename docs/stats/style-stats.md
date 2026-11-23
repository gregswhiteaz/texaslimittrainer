# Style stats (REQ-045)

`src/stats/style-stats.ts` is the one definition of the five style stats used by the Session Report, the
opponent stats panel, range scaling and the bot style-band checks. It is pure and headless: it imports only
engine types.

## Formulas

All values are percentages from 0 to 100, unrounded. A stat is `null` when its denominator is 0.

| Stat       | Numerator                                    | Denominator                         |
| ---------- | -------------------------------------------- | ----------------------------------- |
| VPIP       | hands with a voluntary preflop call or raise | hands dealt in                      |
| PFR        | hands with a preflop raise                   | hands dealt in                      |
| Aggression | postflop bet + raise actions                 | postflop bet + raise + call actions |
| WTSD       | hands that reached showdown                  | hands that saw the flop             |
| W$SD       | hands that won chips at showdown             | hands that reached showdown         |

## Counting rules

- **Dealt in**: the seat appears in `hand.seats`. A seat that wasn't dealt in adds nothing.
- **Blinds**: posting a blind (`small-blind`, `big-blind`) is never voluntary. A blind that folds is not VPIP.
- **Big-blind check**: a big blind checking its option (a preflop `check`) is not VPIP.
- **Small-blind completion**: the completion is recorded as a preflop `call`, so it is VPIP.
- **Aggression is postflop only**: each `bet` or `raise` on the flop, turn or river adds 1 aggressive; each
  `call` adds 1 passive. Checks and folds don't count. Every action counts, not every hand, and short all-in
  raises and calls count as raises and calls. Preflop raises count toward PFR only.
- **Saw the flop**: the board has at least 3 cards and the seat did not fold preflop. A seat all-in preflop
  that gets a runout saw the flop, even with no flop action.
- **Reached showdown**: the hand ended by showdown and the seat never folded. This includes seats that mucked,
  which are missing from `result.showdown`.
- **Won at showdown**: the seat reached showdown and is a winner with a positive amount in any
  `result.awards` entry: main pot, side pot or a split share. An uncalled bet given back (`result.returned`)
  is not winnings.

## API

```ts
handStyleCounts(hand: StatHand, seat: SeatNumber): StyleCounts // one hand
addStyleCounts(a: StyleCounts, b: StyleCounts): StyleCounts // field-by-field sum
styleCounts(hands: Iterable<StatHand>, seat: SeatNumber): StyleCounts // sum over hands
EMPTY_STYLE_COUNTS // all zeros
styleStats(counts: StyleCounts): StyleStats // { vpip, pfr, aggression, wtsd, wsd }
formatStat(value: number | null): string // '—' for null, else e.g. '33%'
NO_STAT // '—' (U+2014)
```

`StatHand` needs `seats` (each with `.seat`), `actions` (`ActionRecord[]`), `board` and a non-null `result`.
Counts can be summed as hands arrive, so a caller can keep a running total per seat or per style.

### With a session `CompletedHand`

A `CompletedHand` is already a `StatHand`:

```ts
const stats = styleStats(styleCounts(completedHands, seat));
formatStat(stats.vpip); // '23%' or '—'
```

### With playtest `PlayedHand`s

Adapt each hand and skip hands with no result:

```ts
let total = EMPTY_STYLE_COUNTS;
runPlaytest(options, (h) => {
  const { result } = h.final;
  if (result === null) return;
  const hand = { seats: h.record.seats, actions: h.final.actions, board: h.final.board, result };
  total = addStyleCounts(total, handStyleCounts(hand, seat));
});
```

## Display

`formatStat` shows `—` when the denominator is 0 (for example W$SD before any showdown) and otherwise the
whole-number percent (`Math.round`). Callers that compare against limits (such as the bot style bands, which
round to 0.1) use the unrounded `styleStats` values. Minimum-sample labels such as "not enough data" belong to
the screens that show the stats.
