# Hand Review panel (TASK-9.1, TASK-9.3, TASK-9.4)

After a hand in which the user made a decision (other than a lone preflop fold), the Hand Review panel opens beside
the table with one entry per user decision, in order (REQ-043). Each entry shows the numbers and the reason behind
the advice, in the hint card's own words (`docs/ui/hint.md`), so the review matches the hint the user could have
seen at that decision (REQ-036.2).

## Header

The panel opens with the heading "Hand #N review". Under it a one-line subtitle (`data-part="summary"`, 14 px)
sums up the hand, then a small replay line (12 px):

| Part                    | Shows                                                                      | Example                                                    |
| ----------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `result`                | the user's net result for the hand                                         | "You lost $48", "You won $56", "You broke even"            |
| "Your hole cards" group | the user's two hole cards, drawn as small cards (24 × 34 px)               | A♥ 9♠                                                      |
| `position`              | the user's position name, the same name the table shows on the user's seat | "Cutoff"                                                   |
| `replay`                | the hand number and the hand's replay code (`replay-code`, monospace)      | "Hand #133 · Replay code 9e3779b9000000010000000200000003" |

- **Net result.** The user's share of every pot award, plus any uncalled amount returned to the user, minus every
  chip the user put in (blinds included). It always equals the user's final stack minus the starting stack.
  Amounts use `$` in cash and sit-and-go alike.
- **Replay code.** The same code the hand record stores as `replayCode` (REQ-013.5), so it can be quoted in a bug
  report. It is shown only after the hand ends, inside the review panel; never during the hand (REQ-013.4).
- **Source.** `reviewSummary(hand, handNumber)` in `src/table/review.ts`, built by `TableView` from the finished
  hand in memory (`completedHand(table)`) and the table's hand number. Nothing is stored or graded again. If the
  hand has no result yet, the panel shows no subtitle and no replay line.

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
