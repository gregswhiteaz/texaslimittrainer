# Hint on the Table (TASK-8.1)

On the user's turn the action row holds the action buttons and a **Hint** button (REQ-022.2). Selecting it opens
the hint card between the table and the action row and the button then reads **Hide hint** (REQ-042.3). Hints are
unlimited and free: there is no counter, limit or cost anywhere (REQ-042.4).

## Layout and accessibility

- The Hint button sits next to the "Your actions" group inside `div.action-row`, not inside the group, so the
  group still holds only action buttons (D-1). It is disabled whenever the action bar is (a bot to act, the hand
  over) and absent before the first deal.
- The card is in normal document flow inside the Table section, after the seats and before the action row, so it
  can never cover the action bar at any window size (A-10, REQ-042.2).
- The button has `aria-expanded` and `aria-controls="hint-card"`. The card is
  `<section id="hint-card" aria-label="Hint" aria-live="polite">`, `aria-busy` while loading.

## What the card shows

| Line            | Preflop                                                                                                            | Flop, turn, river                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Action          | "Recommended: " + the button label of the move ("Raise to $8"; chips in a sit-and-go; "all-in" for a short all-in) | same                                                                                                      |
| Numbers         | the chart basis, e.g. "From the 6-max chart: raise A9o from the cutoff"                                            | "Equity 58.0%" and "Required equity 12.5%", one decimal                                                   |
| Explanation     | the recommendation's explanation, exactly as returned                                                              | same                                                                                                      |
| Opponent ranges | one line per live opponent: "Eli: typical player"                                                                  | one line per live opponent from the engine: "Ben: based on 45 hands of this opponent" or "typical player" |

While the worker computes, the card reads "Working out the hint…". If the advice request fails it reads "The hint
could not be worked out. Select Hint to try again." and the error is logged; the table keeps working.

## Behaviour

- A hint belongs to one decision. Its token is the hand state at the user's turn, which every action replaces
  (D-3). Any action (fold, check, call, bet, raise) hides the card, and a reply that arrives after the action is
  dropped. The next decision starts with the card closed.
- Hide hint then Hint again in the same decision reopens the card already computed without a new request (A-4). After
  a failure, Hint requests again.
- The request goes to the app-wide advice worker (`AdviceClient.recommend(view, observed)`), so the table stays
  responsive while it computes (REQ-055.6).

## Observed stats snapshot

The table's session hook keeps style counts per bot (keyed by per-session bot id) for every finished hand of this
session: `countObserved(counts, completedHand)` runs once per completed hand, before a busted bot is replaced, so
a replacement bot starts at 0 hands (A-2). The counts are not part of `TableState` and are not stored: they start
empty at every mount, so after Resume they restart at 0 (Q-3).

`userObservedSnapshot(table, counts)` turns them into the user's snapshot: one entry per bot seat whose current
bot has at least one finished hand, ascending seat, `{ seat, hands, vpip, pfr }` with unrounded percentages
(A-1). The same snapshot goes to the hint request and is stored with the user's decision when they act, so the
hint, the hand record and the review agree. The range model uses an opponent's snapshot only from 30 hands on, at
a six-player table, after the flop (see [range-model.md](../advice/range-model.md)).

Code: `src/table/hint.ts` (input, request, state machine, card model), `src/ui/table/HintCard.tsx`,
`src/ui/table/Table.tsx`, `src/ui/table/useTableSession.ts`, `src/table/session.ts`.
