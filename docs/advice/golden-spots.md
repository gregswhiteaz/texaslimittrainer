# Golden spots

The golden-spot suite is a set of clear-cut decisions with agreed answers. Every test run checks the advice engine
against each one, so preflop advice can never change silently (REQ-039). Part 1 (this story) holds the preflop
spots in `tests/golden/preflop-spots.json`; the postflop half (TASK-7.14) extends the same format.

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

## Clear-cut rule

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

## How the suite runs

`tests/golden/preflop.acceptance.test.ts` runs in `npm test` and in the CI `test:sweeps` job on every push. It has
one test per spot, titled with the spot id. Each test calls `recommend(view)` and passes when the advice equals the
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

## Originality

All spots and justifications were written for this project from the project's own preflop charts (REQ-061.2). No
text is copied from books, training sites or solver output.
