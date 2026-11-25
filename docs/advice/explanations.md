# Advice explanations

Every recommendation the advice engine returns carries an `explanation`: a plain-English reason of at most three
sentences (REQ-037). The text is built by filling authored templates (`src/advice/explanations.ts`) with the
numbers the recommendation itself returns (`src/advice/explain.ts`), so the same decision always gets the same
words and the quoted numbers always match the advice. Bots get explanations too; they never read them.

Every explanation names at least one concept from the list below, and the first sentence that names a concept also
gives its one-clause definition.

## Concepts

| Concept        | Definition                                                                      |
| -------------- | ------------------------------------------------------------------------------- |
| pot odds       | the cost of a call as a share of the pot after you call                         |
| equity         | your share of the pot if the hand were played out to the end                    |
| position       | where you sit relative to the button, which sets how many players act after you |
| hand strength  | how well two cards hold up against the hands others play                        |
| outs and draws | the unseen cards that would complete your draw                                  |
| implied odds   | the price of a call once you count the bets you expect to win if you hit        |
| value bet      | a bet that worse hands will call                                                |
| bluff          | a bet meant to make better hands fold                                           |
| opponent type  | the playing style an opponent has shown                                         |
| initiative     | being the last player to bet or raise                                           |

No current rule bluffs (see `postflop-rules.md`, "Not applied yet"), so no template uses "bluff" yet; it is
defined here for later rules.

### Opponent-type lead

When at least one opponent's range was rebuilt from 30 or more observed hands (see `range-model.md`, "Adjusting to
observed play"), the postflop explanation starts with this clause, joined to the rule's first sentence, whose first
letter becomes lower case:

> Ranges here follow the opponent type, the playing style an opponent has shown, of each player you have watched for
> 30 or more hands; your equity, …

The clause keeps the explanation within three sentences and names and defines the concept in the first sentence.
Without a rebuilt range the explanation is unchanged.

## Postflop: numbers quoted per rule

Percentages are written with one decimal place (`16.7%`, `0.0%`), exactly as the recommendation returns them.
Every postflop explanation quotes the equity % and the required equity % (`0.0%` when nothing is owed).

| Rule                | Also quotes                                                                        |
| ------------------- | ---------------------------------------------------------------------------------- |
| `value-bet`         | equity against the hands that would call, and the 50.0% value line                 |
| `check-free`        | equity against the hands that would call, and the 50.0% value line                 |
| `value-raise`       | equity against the hands that would call, and the 65.0% value line                 |
| `pot-odds-call`     | nothing more                                                                       |
| `implied-odds-call` | the number of outs and the implied required equity %                               |
| `pot-odds-fold`     | the implied required equity % when there is one (a drawing hand still short of it) |

In `value-bet`, `check-free` and `value-raise` the second sentence names the equity it compares with the value line
(TASK-8.1, AC#12): "Your equity against the hands that would call is (not) above 50.0%, so …". The line is 50.0% for
a bet and 65.0% for a raise facing a bet (TASK-7.32). Earlier text began that sentence with a bare "That is", which
could be read as the equity against all their hands.

When a turn price counts the river big bet (TASK-7.32), the pot-odds clause says so inline, keeping the three-sentence
limit: "Pot odds, …, counting the big bet you will likely face on the river, ask for 26.7%, …". Flop and river
explanations are unchanged.

## Preflop

Preflop advice comes from the charts, so preflop explanations quote no numbers. The first sentence comes from the
chart situation (unopened, limpers, raise, raise and calls, re-raise, blind defence) and names the seat; the second
gives the action with the hand's name (for example "a pair of aces", "ace-king suited"), noting when a chart raise
becomes a call because no more raises are allowed. A third sentence follows when the cell has an acceptable
alternative or is borderline.

### Chart basis on a preflop hint

A preflop hint card shows where the advice comes from instead of equity numbers (REQ-042.6). `chartBasisText(rec)`
fills `CHART_BASIS` = "From the {chart} chart: {action} {hand} from {position}", for example "From the 6-max
chart: raise A9o from the cutoff". `{chart}` is heads-up, 6-max or full-ring (`CHART_NAMES`), `{action}` the
chart advice made legal, `{hand}` the hand class, and `{position}` comes from `CHART_POSITIONS` (the button, the
small blind, the big blind, the cutoff, the hijack, the lojack, a middle seat (MP), an early seat (UTG), an early
seat (UTG+1)).

## Not in the explanation

Short-stack notes and approximate-advice labels (later stories) are kept out of the explanation; they are separate fields.

## Originality

All explanation text — concept definitions, templates, seat and hand names — was written for this project
(REQ-061.2). None of it is copied from books, websites or other software.
