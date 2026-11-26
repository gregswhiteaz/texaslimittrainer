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
  "before": ["fold", "fold", "raise", "raise", "fold", "fold", "call", "check"],
  "action": "bet",
  "justification": "..."
}
```

- `board`: 3, 4 or 5 different cards, none equal to a hole card. The validator deals them at the engine's flop, turn
  and river deck positions, so the hand really runs out this board.
- `street`: `flop`, `turn` or `river`; it must match the board's length.
- `before`: every action from the first preflop decision up to the hero's decision, across all streets. Each is
  `fold`, `check`, `call`, `bet` or `raise`, applied to whichever seat is to act. The hand must reach a decision on
  the board's street. Every preflop action the hero takes must not be a Major error on the chart: the validator
  grades each one with `gradeDecision(recommend(view), step)` at that decision, as the learner would be graded in
  play. A Minor error (a borderline cell) is allowed. The hero's earlier flop or turn actions and the opponents'
  preflop actions are not graded. A Major step is reported, before any equity is computed, as:

  ```
  Golden spot <id>: hero preflop step <k> "<action>" is a Major error on the chart (<size> <position> <situation> <hand class>: <chart action>)
  ```

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

If grading itself throws (for example, the advice returns a non-finite number that the deciding margin reads), the
spot is rejected with the error's message and the other spots keep validating:

```
Golden spot <id>: clear-cut check failed (equityPct must be a finite number, got NaN)
```

### Preflop

A spot must sit on a chart cell that is not marked borderline (`*` in the chart). The validator reads the same cell
the advice engine reads (`chartSpotOf`, which moves a limpers spot from the earliest position one seat later) and
rejects the spot if it is borderline.

When choosing spots, also stay well away from the chart's action boundaries: premium pairs and big aces that raise,
offsuit trash that folds, free checks in a limped big blind, and calls with hands whose neighbouring cells also call.

## Adding a spot

1. Pick a decision that follows from the chart's documented strategy and is not near a boundary.
2. Write the `before` list that reaches it at the chosen table size, then `position` and `situation`. For a postflop
   spot, choose a hero line the chart plays: no hero preflop action may be a Major error on the chart for that hand
   (raise the hands it raises, fold or check the ones it folds). A borderline step the grader marks Minor is
   allowed; a Major step makes the validator reject the spot.
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

## Changes from TASK-7.26 (heads-up and full-ring ranges)

Opponents at heads-up and full-ring tables now start from the authored default ranges for their size, position and
preflop line instead of every unseen hand (see `range-model.md`). Six heads-up and full-ring postflop spots stopped
matching or being clear-cut. Each is replaced by a spot on the same street, table size and action, so the coverage
counts above are unchanged; the line and board are kept and only the hole cards change.

| Old id                  | New id                  | Reason                                                                                                                       |
| ----------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `fr-flop-hj-fold-aqs`   | `fr-flop-hj-fold-a2s`   | Against the narrower ranges ace-queen sits 8.4 points under the price; ace-deuce is 14.6 points under it (5.4% vs 20.0%).    |
| `hu-river-bb-check-aqo` | `hu-river-bb-check-t8o` | Ace-queen high now has 74.3% against the button's turn-betting range, so the advice bets; ten-high has 18.4%, a clear check. |
| `hu-river-btn-call-93s` | `hu-river-btn-call-q9s` | Bottom pair of threes now sits 10.2 points under the price; third pair of queens is 24.6 points above it (41.3% vs 16.7%).   |
| `hu-river-btn-call-t5s` | `hu-river-btn-call-77`  | A pair of fives sits 8.6 points above the price; pocket sevens are 30.5 points above it (44.8% vs 14.3%).                    |
| `fr-river-utg-bet-kjo`  | `fr-river-utg-bet-ajs`  | Second pair of kings is only 11.3 points above 50% against the calling range; top pair of aces has 98.2%, a clear value bet. |
| `fr-river-utg-fold-ato` | `fr-river-utg-fold-jto` | Ace-ten high sits 5.9 points under the price; jack-ten high is 11.5 points under it (4.5% vs 16.0%).                         |

## Changes from TASK-7.31 (chart-consistent hero lines)

A postflop spot teaches the whole hand, so the hero's preflop line must be one the chart plays. 72 spots reached
their decision through a hero preflop action the chart grades as a Major error. Each is replaced like-for-like on the
same street, table size, recorded action, multiway status and observed-stats status, so the coverage counts above are
unchanged. In order of preference: the hero takes the chart's action where the chart raises a hand the hero only
called or checked (the id is kept and the opponents' responses follow the new raise); otherwise the line and board are
kept and only the hole cards change; otherwise the line changes. Where the only hand found plays a borderline cell
(five spots, all limps or small-blind opens), the step is a Minor error, which the rule allows. `6max-turn-bb-raise-92o`
keeps its id and hand on a limped line where the big blind checks its option, and its justification now says kings
full. Graded examples are not checked by this rule.

Four spots outside the table below kept their cards and line and only had their justification corrected, so it names
the board card or board pair that plays rather than the hero's high card: `6max-turn-bb-check-a3o`,
`6max-turn-bb-check-q8o`, `hu-river-bb-check-t8o` and `hu-river-btn-fold-t7s`.

| Old id                     | New id                     | Reason                                                                                                                                                                                                        |
| -------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `6max-flop-co-bet-76o`     | `6max-flop-co-bet-76s`     | Major hero preflop step 3 `raise` (6-max CO unopened 76o: fold); step 7 `call` (6-max CO re-raise 76o: fold). Fix: same line and board, hole cards now 6c 7c.                                                 |
| `6max-flop-btn-bet-aqo`    | `6max-flop-btn-bet-aqo`    | Major hero preflop step 4 `call` (6-max BTN raise AQo: raise). Fix: the button now re-raises the cutoff's open and the cutoff calls.                                                                          |
| `6max-flop-bb-bet-aa`      | `6max-flop-bb-bet-aa`      | Major hero preflop step 6 `call` (6-max BB blind-defence AA: raise). Fix: the big blind now re-raises the small blind's open and the small blind calls.                                                       |
| `6max-flop-btn-bet-97o`    | `6max-flop-btn-bet-99`     | Major hero preflop step 4 `raise` (6-max BTN raise 97o: fold). Fix: same line and board, hole cards now 9c 9h.                                                                                                |
| `6max-flop-btn-bet-q8o`    | `6max-flop-btn-bet-q8s`    | Major hero preflop step 4 `raise` (6-max BTN unopened Q8o: fold). Fix: same line and board, hole cards now Qd 8d.                                                                                             |
| `6max-flop-utg-check-a5o`  | `6max-flop-utg-check-a9o`  | Major hero preflop step 1 `call` (6-max UTG unopened A5o: fold). Fix: same line and board, hole cards now Ah 9c.                                                                                              |
| `6max-flop-co-check-83o`   | `6max-flop-co-check-22`    | Major hero preflop step 3 `raise` (6-max CO unopened 83o: fold). Fix: same line and board, hole cards now 2c 2d.                                                                                              |
| `6max-flop-co-call-a7o`    | `6max-flop-co-call-a7s`    | Major hero preflop step 3 `call` (6-max CO limpers A7o: fold). Fix: same line and board, hole cards now Ac 7c.                                                                                                |
| `6max-flop-co-call-a6o`    | `6max-flop-co-call-a6s`    | Major hero preflop step 7 `call` (6-max CO re-raise A6o: fold). Fix: same line and board, hole cards now Ad 6d.                                                                                               |
| `6max-flop-co-call-j7o`    | `6max-flop-co-call-44`     | Major hero preflop step 3 `raise` (6-max CO unopened J7o: fold). Fix: same line and board, hole cards now 4c 4s.                                                                                              |
| `6max-flop-utg-fold-k9o`   | `6max-flop-utg-fold-k9s`   | Major hero preflop step 1 `call` (6-max UTG unopened K9o: fold). Fix: same line and board, hole cards now Kc 9c.                                                                                              |
| `6max-flop-utg-fold-a3o`   | `6max-flop-utg-fold-a9o`   | Major hero preflop step 1 `call` (6-max UTG unopened A3o: fold). Fix: same line and board, hole cards now Ah 9c.                                                                                              |
| `6max-flop-sb-fold-93o`    | `6max-flop-sb-fold-64s`    | Major hero preflop step 5 `raise` (6-max SB unopened 93o: fold). Fix: same line and board, hole cards now 6c 4c.                                                                                              |
| `6max-flop-bb-fold-95o`    | `6max-flop-bb-fold-95o`    | Major hero preflop step 6 `call` (6-max BB blind-defence 95o: fold). Fix: no hole-card swap is clear-cut; the small blind now limps, the big blind checks its option and folds to the small blind's flop bet. |
| `6max-flop-co-raise-jj`    | `6max-flop-co-raise-jj`    | Major hero preflop step 3 `call` (6-max CO limpers JJ: raise). Fix: the cutoff now raises the limper, and the big blind and the limper call.                                                                  |
| `6max-flop-bb-raise-aa`    | `6max-flop-bb-raise-aa`    | Major hero preflop step 6 `call` (6-max BB blind-defence AA: raise). Fix: the big blind now re-raises the small blind's open and the small blind calls.                                                       |
| `6max-flop-bb-raise-65o`   | `6max-flop-bb-raise-65s`   | Major hero preflop step 6 `call` (6-max BB blind-defence 65o: fold). Fix: same line and board, hole cards now 6c 5c.                                                                                          |
| `6max-flop-btn-raise-97o`  | `6max-flop-btn-raise-97s`  | Major hero preflop step 4 `raise` (6-max BTN unopened 97o: fold). Fix: same line and board, hole cards now 9c 7c.                                                                                             |
| `6max-flop-co-fold-j3o`    | `6max-flop-co-fold-j9s`    | Major hero preflop step 3 `call` (6-max CO limpers J3o: fold). Fix: same line and board, hole cards now Jd 9d.                                                                                                |
| `6max-flop-hj-fold-t5o`    | `6max-flop-hj-fold-88`     | Major hero preflop step 2 `call` (6-max HJ raise T5o: fold). Fix: same line and board, hole cards now 8c 8h.                                                                                                  |
| `6max-flop-hj-call-t5s`    | `6max-flop-hj-call-t9s`    | Major hero preflop step 2 `call` (6-max HJ raise T5s: fold). Fix: no hole-card swap is clear-cut; the hijack now opens Ts 9s, the button and big blind call, and the big blind leads.                         |
| `6max-flop-btn-call-97o`   | `6max-flop-btn-call-76s`   | Major hero preflop step 4 `call` (6-max BTN raise-and-calls 97o: fold). Fix: same line and board, hole cards now 7c 6c.                                                                                       |
| `hu-flop-bb-call-33`       | `hu-flop-bb-call-33`       | Major hero preflop step 2 `check` (heads-up BB limpers 33: raise). Fix: the big blind now raises the button's limp, the button calls, and the big blind leads the flop.                                       |
| `hu-flop-btn-fold-73o`     | `hu-flop-btn-fold-73s`     | Major hero preflop step 1 `raise` (heads-up BTN unopened 73o: fold). Fix: same line and board, hole cards now 7c 3c.                                                                                          |
| `fr-flop-utg-bet-kto`      | `fr-flop-utg-bet-kts`      | Major hero preflop step 1 `raise` (full-ring UTG unopened KTo: fold). Fix: same line and board, hole cards now Kc Tc.                                                                                         |
| `fr-flop-mp-check-83o`     | `fr-flop-mp-check-44`      | Major hero preflop step 3 `call` (full-ring MP unopened 83o: fold). Fix: same line and board, hole cards now 4c 4d.                                                                                           |
| `fr-flop-btn-check-j3s`    | `fr-flop-btn-check-kjs`    | Major hero preflop step 7 `call` (full-ring BTN raise J3s: fold). Fix: same line and board, hole cards now Kc Jc.                                                                                             |
| `fr-flop-hj-call-j2o`      | `fr-flop-hj-call-qjs`      | Major hero preflop step 5 `call` (full-ring HJ limpers J2o: fold). Fix: same line and board, hole cards now Qc Jc.                                                                                            |
| `fr-flop-bb-raise-a3o`     | `fr-flop-bb-raise-a3s`     | Major hero preflop step 9 `call` (full-ring BB blind-defence A3o: fold). Fix: same line and board, hole cards now Ac 3c.                                                                                      |
| `fr-flop-btn-fold-87o`     | `fr-flop-btn-fold-66`      | Major hero preflop step 7 `call` (full-ring BTN raise 87o: fold). Fix: same line and board, hole cards now 6c 6d.                                                                                             |
| `6max-turn-bb-bet-63s`     | `6max-turn-bb-bet-a3s`     | Major hero preflop step 6 `call` (6-max BB blind-defence 63s: fold). Fix: same line and board, hole cards now Ad 3d.                                                                                          |
| `6max-turn-btn-bet-94o`    | `6max-turn-btn-bet-a4s`    | Major hero preflop step 4 `raise` (6-max BTN unopened 94o: fold). Fix: same line and board, hole cards now Ac 4c.                                                                                             |
| `6max-turn-utg-bet-k3o`    | `6max-turn-utg-bet-a3s`    | Major hero preflop step 1 `raise` (6-max UTG unopened K3o: fold). Fix: same line and board, hole cards now Ad 3d.                                                                                             |
| `6max-turn-btn-bet-86o`    | `6max-turn-btn-bet-ats`    | Major hero preflop step 4 `raise` (6-max BTN raise 86o: fold). Fix: same line and board, hole cards now Ac Tc.                                                                                                |
| `6max-turn-utg-bet-a6o`    | `6max-turn-utg-bet-a6s`    | Major hero preflop step 1 `raise` (6-max UTG unopened A6o: fold). Fix: same line and board, hole cards now Ad 6d.                                                                                             |
| `6max-turn-utg-check-92o`  | `6max-turn-utg-check-t9s`  | Major hero preflop step 1 `raise` (6-max UTG unopened 92o: fold). Fix: same line and board, hole cards now Tc 9c.                                                                                             |
| `6max-turn-co-check-t7o`   | `6max-turn-co-check-a2s`   | Major hero preflop step 3 `raise` (6-max CO unopened T7o: fold); step 7 `call` (6-max CO re-raise T7o: fold). Fix: same line and board, hole cards now Ac 2c.                                                 |
| `6max-turn-bb-check-85o`   | `6max-turn-bb-check-85s`   | Major hero preflop step 6 `call` (6-max BB blind-defence 85o: fold). Fix: same line and board, hole cards now 8c 5c.                                                                                          |
| `6max-turn-co-fold-98o`    | `6max-turn-co-fold-a2s`    | Major hero preflop step 3 `raise` (6-max CO unopened 98o: fold). Fix: same line and board, hole cards now Ad 2d.                                                                                              |
| `6max-turn-btn-fold-64o`   | `6max-turn-btn-fold-55`    | Major hero preflop step 4 `call` (6-max BTN raise 64o: fold). Fix: same line and board, hole cards now 5c 5d.                                                                                                 |
| `6max-turn-bb-fold-93o`    | `6max-turn-bb-fold-k3s`    | Major hero preflop step 6 `call` (6-max BB blind-defence 93o: fold). Fix: same line and board, hole cards now Kc 3c.                                                                                          |
| `6max-turn-utg-fold-82o`   | `6max-turn-utg-fold-a7s`   | Major hero preflop step 1 `raise` (6-max UTG unopened 82o: fold). Fix: same line and board, hole cards now Ac 7c.                                                                                             |
| `6max-turn-utg-fold-k2o`   | `6max-turn-utg-fold-k9s`   | Major hero preflop step 1 `raise` (6-max UTG unopened K2o: fold). Fix: same line and board, hole cards now Kc 9c.                                                                                             |
| `6max-turn-co-fold-j3s`    | `6max-turn-co-fold-22`     | Major hero preflop step 3 `raise` (6-max CO unopened J3s: fold); step 7 `call` (6-max CO re-raise J3s: fold). Fix: same line and board, hole cards now 2c 2d.                                                 |
| `6max-turn-co-raise-a6o`   | `6max-turn-co-raise-a6s`   | Major hero preflop step 7 `call` (6-max CO re-raise A6o: fold). Fix: same line and board, hole cards now Ac 6c.                                                                                               |
| `6max-turn-co-raise-t9o`   | `6max-turn-co-raise-t9s`   | Major hero preflop step 3 `raise` (6-max CO unopened T9o: fold); step 7 `call` (6-max CO re-raise T9o: fold). Fix: same line and board, hole cards now Tc 9c.                                                 |
| `6max-turn-bb-raise-kk`    | `6max-turn-bb-raise-kk`    | Major hero preflop step 6 `call` (6-max BB blind-defence KK: raise). Fix: the big blind now re-raises the small blind's open and the small blind calls.                                                       |
| `6max-turn-bb-raise-92o`   | `6max-turn-bb-raise-92o`   | Major hero preflop step 6 `call` (6-max BB blind-defence 92o: fold). Fix: the under-the-gun player now limps and the big blind checks its option (A-7); the justification says kings full.                    |
| `6max-turn-bb-check-72o`   | `6max-turn-bb-check-k2s`   | Major hero preflop step 6 `call` (6-max BB blind-defence 72o: fold). Fix: same line and board, hole cards now Kc 2c.                                                                                          |
| `hu-turn-btn-bet-k2o`      | `hu-turn-btn-bet-k2o`      | Major hero preflop step 1 `call` (heads-up BTN unopened K2o: raise). Fix: the button now raises and the big blind calls.                                                                                      |
| `hu-turn-btn-check-73o`    | `hu-turn-btn-check-73s`    | Major hero preflop step 1 `raise` (heads-up BTN unopened 73o: fold). Fix: same line and board, hole cards now 7c 3c.                                                                                          |
| `fr-turn-utg-bet-94o`      | `fr-turn-utg-bet-99`       | Major hero preflop step 1 `raise` (full-ring UTG unopened 94o: fold). Fix: same line and board, hole cards now 9c 9d.                                                                                         |
| `fr-turn-hj-raise-86s`     | `fr-turn-hj-raise-a2s`     | Major hero preflop step 5 `raise` (full-ring HJ unopened 86s: fold). Fix: same line and board, hole cards now Ad 2d.                                                                                          |
| `6max-river-bb-bet-aks`    | `6max-river-bb-bet-aks`    | Major hero preflop step 6 `call` (6-max BB blind-defence AKs: raise). Fix: the big blind now re-raises and the under-the-gun raiser calls.                                                                    |
| `6max-river-sb-bet-j4o`    | `6max-river-sb-bet-j8s`    | Major hero preflop step 5 `raise` (6-max SB unopened J4o: fold). Fix: same line and board, hole cards now Jd 8d.                                                                                              |
| `6max-river-sb-check-52o`  | `6max-river-sb-check-qjo`  | Major hero preflop step 5 `raise` (6-max SB unopened 52o: fold). Fix: same line and board, hole cards now Qd Jc.                                                                                              |
| `6max-river-bb-check-93o`  | `6max-river-bb-check-43s`  | Major hero preflop step 6 `call` (6-max BB blind-defence 93o: fold). Fix: same line and board, hole cards now 4c 3c.                                                                                          |
| `6max-river-co-check-72o`  | `6max-river-co-check-76s`  | Major hero preflop step 3 `raise` (6-max CO unopened 72o: fold). Fix: same line and board, hole cards now 7c 6c.                                                                                              |
| `6max-river-bb-check-j5o`  | `6max-river-bb-check-53s`  | Major hero preflop step 6 `call` (6-max BB blind-defence J5o: fold). Fix: same line and board, hole cards now 5d 3d.                                                                                          |
| `6max-river-btn-call-k6o`  | `6max-river-btn-call-88`   | Major hero preflop step 4 `call` (6-max BTN raise K6o: fold). Fix: same line and board, hole cards now 8d 8h.                                                                                                 |
| `6max-river-utg-fold-92o`  | `6max-river-utg-fold-t9s`  | Major hero preflop step 1 `raise` (6-max UTG unopened 92o: fold). Fix: same line and board, hole cards now Ts 9s.                                                                                             |
| `6max-river-btn-fold-t7o`  | `6max-river-btn-fold-76s`  | Major hero preflop step 4 `raise` (6-max BTN unopened T7o: fold). Fix: same line and board, hole cards now 7h 6h.                                                                                             |
| `6max-river-utg-fold-t4o`  | `6max-river-utg-fold-jts`  | Major hero preflop step 1 `raise` (6-max UTG unopened T4o: fold). Fix: same line and board, hole cards now Jc Tc.                                                                                             |
| `6max-river-btn-raise-q3s` | `6max-river-btn-raise-a3s` | Major hero preflop step 4 `raise` (6-max BTN unopened Q3s: fold). Fix: same line and board, hole cards now Ad 3d.                                                                                             |
| `6max-river-sb-raise-53o`  | `6max-river-sb-raise-55`   | Major hero preflop step 5 `raise` (6-max SB unopened 53o: fold). Fix: same line and board, hole cards now 5c 5d.                                                                                              |
| `6max-river-bb-raise-aks`  | `6max-river-bb-raise-aks`  | Major hero preflop step 6 `call` (6-max BB blind-defence AKs: raise). Fix: the big blind now re-raises the small blind's open and the small blind calls.                                                      |
| `6max-river-bb-fold-63s`   | `6max-river-bb-fold-k6s`   | Major hero preflop step 6 `call` (6-max BB blind-defence 63s: fold). Fix: same line and board, hole cards now Kh 6h.                                                                                          |
| `hu-river-bb-call-tt`      | `hu-river-bb-call-tt`      | Major hero preflop step 2 `check` (heads-up BB limpers TT: raise). Fix: the big blind now raises the button's limp, the button calls, and the big blind leads the flop.                                       |
| `fr-river-bb-check-52o`    | `fr-river-bb-check-65s`    | Major hero preflop step 9 `call` (full-ring BB blind-defence 52o: fold). Fix: same line and board, hole cards now 6c 5c.                                                                                      |
| `fr-river-bb-fold-t3o`     | `fr-river-bb-fold-43s`     | Major hero preflop step 9 `call` (full-ring BB blind-defence T3o: fold). Fix: same line and board, hole cards now 4h 3h.                                                                                      |
| `fr-river-utg-call-t5o`    | `fr-river-utg-call-aks`    | Major hero preflop step 1 `raise` (full-ring UTG unopened T5o: fold). Fix: same line and board, hole cards now Ac Kc.                                                                                         |
| `fr-river-utg-fold-jto`    | `fr-river-utg-fold-jts`    | Major hero preflop step 1 `raise` (full-ring UTG unopened JTo: fold). Fix: same line and board, hole cards now Jc Tc.                                                                                         |

## Changes from TASK-7.33

One spot id is corrected so it describes its current spot.

| Old id                  | New id                       | Reason                                                                                                                                                                                                    |
| ----------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `6max-flop-co-raise-jj` | `6max-flop-co-raise-jj-3way` | TASK-7.31 changed the line (the cutoff raises the limper, and the big blind and the limper call), and TASK-7.32 kept the id for this three-way pot. Cards, board, action and justification are unchanged. |

## Originality

All spots, graded examples and justifications were written for this project from the project's own charts and
advice rules (REQ-061.2). No text is copied from books, training sites or solver output.
