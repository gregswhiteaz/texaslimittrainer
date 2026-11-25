# Golden spots

The golden-spot suite is a set of clear-cut decisions with agreed answers. Every test run checks the advice engine
against each one, so the advice can never change silently (REQ-039). Part 1 (TASK-7.11) holds the preflop spots
in `tests/golden/preflop-spots.json`. Part 2 (TASK-7.14) adds the postflop spots in
`tests/golden/postflop-spots.json`, which extend the same format, and the graded examples in
`tests/golden/graded-examples.json`.

The validator and runner check live in `src/advice/golden.ts`. Tests and data live in `tests/golden/`.

## File format (`tlh-golden-spots`, version 1)

```json
{
  "format": "tlh-golden-spots",
  "version": 1,
  "spots": [
    {
      "id": "6max-btn-raise-qq",
      "seats": 6,
      "position": "BTN",
      "situation": "raise",
      "holeCards": "Qh Qd",
      "before": ["raise", "fold", "fold"],
      "action": "raise",
      "alternative": null,
      "justification": "..."
    }
  ]
}
```

A spot records the facts of the decision, not a full `PlayerView`. The validator rebuilds the view with the real
engine (`createHand`, `applyAction`, `playerView`), so a spot can never describe a view the engine could not reach.

Every v1 spot uses the same table (format constants, not per-spot fields):

| Constant | Value                                                |
| -------- | ---------------------------------------------------- |
| Stakes   | 2/4 blinds, small bet 4, big bet 8 (`GOLDEN_STAKES`) |
| Seats    | numbered 1 to `seats`, all dealt in                  |
| Button   | seat 1                                               |
| Stacks   | 160 each, 20 big bets (`GOLDEN_STACK`)               |

### Field rules

- `id`: non-empty, at most 60 characters, unique in the file. Convention:
  `<hu|6max|fr>-<position, lower case, + dropped>-<situation>-<hand class, lower case>`.
- `seats`: whole number 2 to 10. Two seats is heads-up, 3 to 7 use the 6-max chart, 8 to 10 the full-ring chart.
- `holeCards`: two different cards, such as `"As Ah"`.
- `before`: the preflop actions taken before the decision, each `"fold"`, `"check"`, `"call"` or `"raise"`. They
  are applied in order to whichever seat is to act after the blinds, with that seat's legal amount. The hero is the
  seat to act once they are all applied. The list may be empty.
- `position` and `situation`: must equal what the built view gives (`positionOf`, `situationOf`). They make each
  spot readable on its own.
- `action`: the recommended action, which must be legal in the view.
- `alternative`: optional; absent or `null` for none, or one other legal action. A list counts as more than one.
- `justification`: at least 15 words, at most three sentences, naming at least one listed concept (see
  `explanations.md`). It says why this hand takes this action in this spot, and names the hand.
- `opponentStats`: optional; seat number to an object of stat name to number. No preflop spot uses it.

## Postflop spots

Postflop spots use the same format and table, with these differences:

```json
{
  "id": "6max-flop-btn-bet-aqo",
  "seats": 6,
  "position": "BTN",
  "street": "flop",
  "holeCards": "Ac Qh",
  "board": "8h Qc 7d",
  "before": ["fold", "fold", "raise", "call", "fold", "fold", "check"],
  "action": "bet",
  "justification": "..."
}
```

- `board`: 3, 4 or 5 different cards, none equal to a hole card. The validator deals them at the engine's flop, turn
  and river deck positions, so the hand really runs out this board.
- `street`: `flop`, `turn` or `river`; it must match the board's length.
- `before`: every action from the first preflop decision up to the hero's decision, across all streets. Each is
  `fold`, `check`, `call`, `bet` or `raise`, applied to whichever seat is to act. The hand must reach a decision on
  the board's street.
- `position`: must equal `positionOf(view)`. There is no `situation`; a spot that has one is rejected.
- `action`: any of the five types, legal in the view. Postflop spots record no `alternative`, because the engine
  gives none after the flop; the field is still accepted and validated as for preflop.
- `opponentStats`: optional; seat number to `{ "hands", "vpip", "pfr" }` only. `hands` is a whole number from 0 and
  `vpip`/`pfr` are percents from 0 to 100. Anything else is `invalid opponent stats`. The stats are passed to the
  advice as observed opponents (they matter at 6-max with 30 or more hands).
- `justification`: the preflop rules (at least 15 words, at most three sentences, a listed concept). It describes the
  made hand or draw rather than naming a hand class.

Postflop advice is checked exactly as the learner sees it:
`recommendPostflop(view, { opponentRanges: 'actions', observedOpponents })` (`goldenPostflopAdvice`), with ranges
estimated from each opponent's actions. The result is memoised per spot view, so validation, the runner and the
explanation check share one equity computation.

## Clear-cut rule

### Postflop

Every legal action other than the recorded action must be a Major error under the grader (REQ-038), using the engine's
own numbers. In practice a call/fold decision must sit at least 10 points from the required equity, and a bet/check
(or raise/call) decision at least 15 points from the value threshold that applied against the calling range: 50% for a
bet, 65% for a raise facing a bet (TASK-7.32). The validator grades each other legal action against the recorded one,
with the engine's threshold, and rejects the spot if any is not Major:

| Recorded | Numbers                                           | Result                                                                                                               |
| -------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `call`   | equity 41.0, required 31.0, calling range 30.0    | fold → 10.0 points, raise → 20.0 points: clear-cut                                                                   |
| `call`   | equity 40.9, required 31.0, calling range 30.0    | `not clear-cut, fold would be a Minor error (call-fold-margin 9.9 points; clear-cut needs 10)`                       |
| `bet`    | 64.9 against the calling range                    | `not clear-cut, check would be a Minor error (aggression-margin 14.9 points; clear-cut needs 15)`; 65.0 is clear-cut |
| `call`   | equity 22.0, required 25.0 (an implied-odds call) | fold → −3 points, Minor: rejected                                                                                    |

Implied-odds calls can never be golden spots, since folding them is never a Major error. Equity is deterministic
(seeded from the input), and the 10- and 15-point margins are far wider than the engine's accuracy bound, so a
recorded answer cannot flip between runs.

### Preflop

A spot must sit on a chart cell that is not marked borderline (`*` in the chart). The validator reads the same cell
the advice engine reads (`chartSpotOf`, which moves a limpers spot from the earliest position one seat later) and
rejects the spot if it is borderline.

When choosing spots, also stay well away from the chart's action boundaries: premium pairs and big aces that raise,
offsuit trash that folds, free checks in a limped big blind, and calls with hands whose neighbouring cells also call.

## Adding a spot

1. Pick a decision that follows from the chart's documented strategy and is not near a boundary.
2. Write the `before` list that reaches it at the chosen table size, then `position` and `situation`.
3. Decide the action from the chart's reasoning, then write the justification in your own words.
4. Run `npx vitest run tests/golden/`. The validator reports any malformed or borderline spot, and the runner
   reports any disagreement with the advice engine. If the engine disagrees, choose a clearer spot; never edit the
   answer just to match the engine.

## Graded examples

`tests/golden/graded-examples.json` (format `tlh-graded-examples`, version 1, list `examples`) pins how the grader
grades a user's action. Each example has `id`, `seats`, `holeCards`, `before`, optional `board` and `street`
(postflop), optional `opponentStats`, the `userAction`, and the expected `grade` (`correct`, `minor` or `major`),
`ruleId` (one of the grader's rule ids) and `marginPts` (a number with at most one decimal, or `null`), plus a
justification of why that grade follows. The check grades `userAction` against `recommend(view)` preflop or
`goldenPostflopAdvice` postflop and compares grade, rule id and margin exactly:

```
Graded example <id>: expected minor by call-fold-margin at 4.6, got major by call-fold-margin at 12
```

The file covers Correct, Minor error and Major error both preflop and postflop: a preflop match, an acceptable
alternative, a borderline (Minor) and a chart (Major) error; a postflop match, and call/fold and bet/check margins at
Minor and Major. Every postflop example uses a spot the engine enumerates exactly, so its margin never depends on
sampling. Graded examples are close calls by design, so they are exempt from the clear-cut rule and do not count
toward the 200 spots.

## How the suite runs

`tests/golden/preflop.acceptance.test.ts`, `tests/golden/postflop.acceptance.test.ts` and
`tests/golden/suite.acceptance.test.ts` run in `npm test` and in the CI `test:sweeps` job on every push. There is
one test per spot, titled with the spot id. Each test asks the advice engine and passes when the advice equals the
recorded action or its alternative. A failure reads:

```
Golden spot 6max-btn-raise-qq: expected raise, got call
Golden spot <id>: expected <action> or <alternative>, got <actual>
```

Validation problems are listed together in a `GoldenSpotValidationError`, each naming the spot (by id, or `#<n>` when
the id is missing).

## Coverage

The preflop file holds 110 spots: 20 heads-up, 42 6-max and 48 full ring. Every chart situation at every table size
has spots, and between them they recommend fold, check, call and raise.

The postflop file holds 120 spots: 45 flop, 40 turn and 35 river; 86 6-max, 18 heads-up and 16 full ring. Each of
bet, check, call, fold and raise is recorded more than 20 times, 20 spots are multiway and 4 use observed opponent
stats. Together the two files hold 230 spots. The whole `tests/golden/` directory runs in about a second.

## Changes from the TASK-7.11 review (TASK-7.14)

- `fr-btn-raise-88`: at full ring the button now re-raises 99 and 88 against a single raise (77 still calls), which
  fits the chart's "facing a single raise we mostly re-raise or fold" policy. The chart cells and the button
  justification in `src/advice/charts/full-ring.json` changed with the spot, which is now `raise`.
- `fr-hj-raise-and-calls-ajs`: the justification now places the domination claim on the caller's range, not the
  opener's.
- `fr-co-limpers-87s` and `fr-sb-unopened-65s` sat on call cells whose suited neighbours fold. They are replaced by
  `fr-co-limpers-44` (call; 55 and 33 also call) and `fr-sb-unopened-kjs` (raise; its neighbours also raise).

## Changes from TASK-7.32 (WTSD fix)

A turn call now counts the river big bet in its price, and a value raise facing a bet needs more than 65% against the
calling range (see `postflop-rules.md`). Thirteen postflop spots stopped being clear-cut. Each is replaced by a spot on
the same street, table size and action, so the coverage counts above are unchanged; the line and board are kept and
only the hole cards change, except where noted.

| Old id                   | New id                    | Reason                                                                                                                                            |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `6max-turn-bb-call-jj`   | `6max-turn-bb-call-k8s`   | With the river bet counted, folding jacks is only 3.9 points from the price; top pair of kings stays well clear of it.                            |
| `6max-turn-co-call-qjo`  | `6max-turn-co-call-kto`   | The draw sits 2.0 points from the new turn price; top pair of kings is a clear call.                                                              |
| `6max-turn-btn-call-84o` | `6max-turn-btn-call-a9s`  | Bottom pair sits 1.4 points from the new turn price; third pair with an ace kicker is a clear call.                                               |
| `6max-turn-utg-call-t7s` | `6max-turn-utg-call-qq`   | Third pair and a gutshot sit 2.4 points from the new turn price; pocket queens are a clear call.                                                  |
| `6max-turn-bb-call-kqs`  | `6max-turn-bb-call-99`    | The flush draw sits 2.0 points from the new turn price; pocket nines are a clear call against the button's stabs.                                 |
| `6max-turn-bb-call-k3s`  | `6max-turn-bb-call-a6s`   | The nut flush draw sits 3.2 points from the new turn price; top pair of aces is a clear call (the observed button stats are kept).                |
| `6max-turn-utg-call-q7o` | `6max-turn-utg-call-a9s`  | Bottom pair and a gutshot sit 6.6 points from the new turn price; second pair with an ace kicker is a clear call.                                 |
| `fr-turn-hj-call-k7o`    | `fr-turn-hj-call-kts`     | Third pair sits 6.3 points from the new turn price; second pair of tens is a clear call.                                                          |
| `6max-flop-co-raise-jj`  | `6max-flop-co-raise-jj`   | Against four opponents top set is no longer 15 points above the 65% raise threshold; the line is now a three-way limped pot, where it is (82.1%). |
| `6max-flop-hj-raise-a2o` | `6max-flop-hj-raise-99`   | Trip deuces sit 7.1 points above the 65% raise threshold, so calling is only a Minor error; nines full is a clear raise.                          |
| `6max-flop-btn-raise-44` | `6max-flop-btn-raise-ajo` | The set of fours on a monotone board sits 10.4 points above the 65% raise threshold; top pair with the nut flush draw is a clear raise (84.2%).   |
| `6max-turn-bb-raise-q5o` | `6max-turn-bb-raise-kqs`  | The queen-high straight sits 8.5 points above the 65% raise threshold; the king-high nut straight is a clear raise.                               |
| `6max-turn-bb-raise-qq`  | `6max-turn-bb-raise-kk`   | Pocket queens sit 11.6 points above the 65% raise threshold; pocket kings are a clear raise (82.4%).                                              |

`graded-postflop-fold-major-6max-turn-second-pair` keeps its grade (Major, `call-fold-margin`) but its margin moves
from 26.9 to 18.3 points, because the turn price now counts the river big bet.

## Originality

All spots, graded examples and justifications were written for this project from the project's own charts and
advice rules (REQ-061.2). No text is copied from books, training sites or solver output.
