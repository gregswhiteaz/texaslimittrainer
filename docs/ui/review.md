# Hand Review entries (TASK-9.1, TASK-9.3)

After a hand in which the user made a decision (other than a lone preflop fold), the Hand Review panel opens beside
the table with one entry per user decision, in order (REQ-043). Each entry shows the numbers and the reason behind
the advice, in the hint card's own words (`docs/ui/hint.md`), so the review matches the hint the user could have
seen at that decision (REQ-036.2).

## What an entry shows

| Part (`data-part`)        | Preflop                                                                 | Flop, turn, river                                                                                         |
| ------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `street`, board, `grade`  | "Preflop", no cards, the grade badge                                    | street name, the board at that decision, the badge                                                        |
| `moves` (`you`, `advice`) | "You: Raise to $8 · Advice: Raise to $8"                                | same                                                                                                      |
| `chart`                   | the chart basis, e.g. "From the 6-max chart: raise A9o from the cutoff" | absent                                                                                                    |
| `equity`, `required`      | absent                                                                  | "Equity 37.1%" and "Required equity 11.8%"                                                                |
| `explanation`             | the stored explanation, exactly as stored                               | same                                                                                                      |
| "Opponent ranges" list    | one line per live opponent: "Ava: typical player"                       | one line per opponent the advice read: "Ben: based on 40 hands of this opponent" or "Eli: typical player" |

Opponent lines are `<li data-opponent="<seat>">` items (not `data-seat`, which the table's own seat and winner
lists use). Long explanations and many opponent lines wrap inside the 400 px panel; at 1280 × 720 the page scrolls
vertically, never horizontally, even at a ten-seat table.

## Where it comes from

- **Stored decision.** Every part comes from the hand's stored decision entries (`HandRecordDecision`,
  `docs/storage/hand-records.md`): `storedReviewEntries(hand, decisions)` in `src/table/review.ts`. The grade, the
  advised move, the equity numbers, the explanation and the opponent basis are read, never recomputed.
- **Decision time, in the worker.** Each entry was graded when the user acted, by the advice worker's `grade`
  request with that decision's observed-stats snapshot. The hand's record and the review use the same entries.
  So stats that change later (for example an opponent reaching 30 observed hands at the end of the hand) do not
  change what the review shows.
- **Chart line.** The record has no chart cell, so the preflop line is formatted at display time with
  `chartBasisText` from the decision's chart size, chart position and hand class (the inputs the preflop advice
  uses) and the stored advised action (TASK-9.3 A-4). It equals the hint's line.
- **Names and boards** come from the hand just played (`CompletedHand`), which is in memory when the review opens.

## Timing

The result and the held next hand (Deal next hand) appear as soon as the hand ends. The panel appears once every
grade of the hand has come back from the worker, which is normally already the case. There is no loading text. If
a grade request fails, the hand record cannot be saved: the failure is logged, the panel does not open and no
further hand is dealt (the hand-record write-failure rule).

## Security

Stored strings (the explanation and opponent basis text) are untrusted once read back from storage, so the panel
renders them as React text nodes only, never as HTML.
