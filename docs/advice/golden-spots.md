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
(or raise/call) decision at least 15 points from 50% against the calling range. The validator grades each other legal
action against the recorded one and rejects the spot if any is not Major:

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

## Originality

All spots, graded examples and justifications were written for this project from the project's own charts and
advice rules (REQ-061.2). No text is copied from books, training sites or solver output.
