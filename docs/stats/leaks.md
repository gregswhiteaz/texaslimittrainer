# Leaks (REQ-047, REQ-044.5)

The Session Report's "Biggest leaks this session" section names the kinds of decision the user got wrong most
often, each with evidence from the session and a one-sentence fix: 15 postflop categories (TASK-10.5) and 16
preflop categories by position group (TASK-10.6). The category titles, evidence names, fixes and
justifications were written for this project (REQ-061.2). The section shows at most three leaks, most costly
first (TASK-10.8).

- `src/stats/leak-categories.json`: the 15 postflop categories, then the 16 preflop ones, format
  `{"format": "tlh-leak-categories", "version": 1, "categories": [...]}`.
- `src/stats/leaks.ts` (headless): `parseLeakCategories`, `LEAK_CATEGORIES` (the file, validated at import),
  `positionGroup`, `preflopAction`, `decisionCategory`, `handCategoryDecisions`, `categoryCounts`, `isLeak`,
  `leakEvidence`, `MAX_SHOWN_LEAKS` and `sessionLeaks`.
- `src/table/session-report.ts`: `sessionReport` stores the counts as `leakCounts` (see
  [Session reports](../storage/reports.md#leakcounts)).
- `src/ui/report/ReportScreen.tsx`: the leaks section.

## Postflop categories

Each of the user's postflop decisions falls in one category: street (flop, turn, river) × facing a bet (fold,
call, raise) or not facing a bet (check, bet). The category id is
`<street>-facing-a-bet-<action>` or `<street>-not-facing-a-bet-<action>`.

**Facing a bet** is read from the user's action type (A-1): fold, call and raise face a bet; check and bet do
not. Postflop the engine offers fold, call and raise only when the seat owes chips, and check and bet only when
nothing has been bet. A call on a street capped at four bets is still type `call`, so it is a facing-a-bet call.
The one mismatch is the rare spot where nothing is owed but a short all-in left a bet on the street; there a
check counts as not facing a bet and a raise as facing one. A forced fold after Leave table mid-hand has no
decision record, so it is never counted.

## Preflop categories

Each of the user's preflop decisions falls in one category: position group (early, middle, late, blinds) ×
action (fold, open, call, raise). The category id is `<group>-<action>`, e.g. `early-fold` or `late-open`.

**Position group** (REQ-047.6) is counted over the seats dealt into the hand (empty sit-and-go seats are
skipped), clockwise from the first seat after the button, the same order the engine and the preflop charts
use. With 3 or more seats the first two seats after the button are **blinds**, the button and the seat before
it are **late**, the next two seats back are **middle** and every other seat is **early**. Heads-up the button
is **late** and the other seat is **blinds**.

| Seats dealt in | Blinds | Early   | Middle     | Late           |
| -------------- | ------ | ------- | ---------- | -------------- |
| 10             | SB, BB | 4 seats | 2 (LJ, HJ) | CO, BTN        |
| 9              | SB, BB | 3 seats | 2 (LJ, HJ) | CO, BTN        |
| 8              | SB, BB | 2 seats | 2 (LJ, HJ) | CO, BTN        |
| 7              | SB, BB | 1 seat  | 2 seats    | CO, BTN        |
| 6              | SB, BB | none    | 2 seats    | CO, BTN        |
| 5              | SB, BB | none    | 1 seat     | CO, BTN        |
| 4              | SB, BB | none    | none       | CO, BTN        |
| 3              | SB, BB | none    | none       | BTN            |
| 2              | BB     | none    | none       | BTN (posts SB) |

For example, dealt-in seats 2, 5, 7 and 9 with the button on 7: 9 and 2 are blinds, 5 and 7 are late.

**Action** (REQ-047.9):

- fold → `fold`; any call → `call`, including a limp (calling the big blind in an unopened pot) and the small
  blind completing.
- A raise is `raise` when a preflop record of type `raise` comes before it in the hand, from any seat and
  including the user's own earlier raise or a short all-in raise; otherwise it is `open` (the first raise into
  an unopened or limped pot). The blinds are not raises. This is the same test the advice engine uses to tell
  unopened and limped pots from raised ones.
- A big blind checking its option is in no category. It still counts in the report's `errors` (REQ-044.2).
  Preflop never offers a bet.

**Pairing.** A decision record does not say whether someone raised earlier, so each preflop decision is paired
with its action record: the j-th decision of a hand is the user's j-th non-blind action record. A trailing
forced fold has no decision and is ignored. A preflop decision gets a category only when the hand has a
`button` and its paired record is preflop with the same action type; hand-built test data without a `button`
or with misaligned records is skipped. Stored hand records are validated to have this alignment.

## Rule

- Only decisions with `hinted` false count, for both thresholds and for the evidence (REQ-047.2, REQ-047.8).
- An error is a decision graded Minor or Major.
- A category is a **leak** when it has at least 8 unhinted decisions and at least 40% of them are errors:
  `decisions ≥ 8 and 5 × errors ≥ 2 × decisions` (integers only). 4 of 10 is a leak; 7 of 7 is not (too few);
  3 of 10 is not; 3 of 8 (37.5%) is not; 8 of 20 is.
- **Evidence:** `<errors> of <decisions> <evidence name> graded as errors`, e.g.
  `4 of 10 turn calls graded as errors` (REQ-047.4).
- **Ranking (REQ-047.3):** leaks are listed most costly first, by, in turn: unhinted Major errors (more
  first); error rate `errors / decisions` (higher first, compared in integers as
  `a.errors × b.decisions > b.errors × a.decisions`); errors (more first); then the category order below (the
  postflop categories — flop, turn, river; fold, call, raise, check, bet — then the preflop ones — early,
  middle, late, blinds; fold, open, call, raise). Preflop and postflop leaks rank on the same rule. Example:
  turn calls 5 of 8 with 4 Major rank above flop calls 4 of 8 with 4 Major (62.5% > 50%), and river calls
  6 of 10 with 5 Major rank above both.
- **Cap (REQ-044.5):** at most `MAX_SHOWN_LEAKS` = 3 leaks are shown; with fewer, all are shown. No note
  names the leaks left out.
- The ranking is computed when the report is shown, from the stored `leakCounts` (which stay in category
  order), so reports saved before TASK-10.8 are ranked too.
- No leak → the section shows
  `No leaks found this session (a leak needs 8+ spots with 40%+ errors).` A report stored before TASK-10.5 has
  no `leakCounts` and shows no leaks section.

Each leak shows its title (bold), the evidence and the fix, each on its own line. The justifications are not
shown on the report.

## Validation

`parseLeakCategories` requires the format and version above. Each entry is an object whose `street` is preflop,
flop, turn or river. A preflop entry has exactly the keys `id`, `street`, `group`, `action`, `title`,
`evidenceName`, `fix` and `justification`: `group` is early, middle, late or blinds; `action` is fold, open,
call or raise; `id` is `<group>-<action>` and unique. A postflop entry has exactly the keys `id`, `street`,
`facingBet`, `action`, `title`, `evidenceName`, `fix` and `justification`: `facingBet` is a boolean; `action` is fold, call or raise when facing a bet, else check or bet; `id`
matches street, facingBet and action and is unique. The title is trimmed, non-empty and has no final `.`; the
evidence name is trimmed, non-empty and lower case; the fix is exactly one sentence (starts with an upper-case
letter, ends with `.`, no other `.`, `!` or `?`); the justification is trimmed, starts with an upper-case
letter and ends with `.`. A bad file throws `RangeError('Invalid leak categories: <path>')`, e.g.
`categories[3].fix`, when the app loads.

## Content

### Postflop

| Id                             | Title                                              | Evidence name | Fix                                                                                                                                                                        | Justification                                                                                                                                                                |
| ------------------------------ | -------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `flop-facing-a-bet-fold`       | Folding too easily to flop bets                    | flop folds    | Before you fold to a flop bet, count your outs and compare your chance to win with the price of the call, because one small bet often buys a cheap look at the turn.       | A flop bet is a small bet into a pot already holding several bets, so the price is low and pairs and draws often have the equity to call (pot-odds-call, implied-odds-call). |
| `flop-facing-a-bet-call`       | Calling flop bets without the odds                 | flop calls    | Call a flop bet only when your chance to win, counting your outs, beats the price of the call, and raise instead when you are likely ahead.                                | A call is graded against the pot-odds price and against the value-raise rule, so calls go wrong both when the hand is too weak and when it is strong enough to raise.        |
| `flop-facing-a-bet-raise`      | Raising the flop with hands that are not ahead     | flop raises   | Raise a flop bet only when your hand beats most of the hands that will call the raise, and just call with draws and medium hands that need to improve.                     | The value-raise rule asks for better than even equity against the hands that would continue; raising a weaker hand puts more chips in while behind.                          |
| `flop-not-facing-a-bet-check`  | Checking the flop with hands that should bet       | flop checks   | When the flop is checked to you and your hand beats most of the hands that would call, bet so that weaker hands pay you now.                                               | The value-bet rule bets when the hero is ahead of the calling range; checking those hands gives up a bet the opponents would have paid.                                      |
| `flop-not-facing-a-bet-bet`    | Betting the flop into better hands                 | flop bets     | Bet the flop only when most of the hands that would call are worse than yours, and check the rest to see the turn for free.                                                | A bet earns only from worse hands that pay it; when the hands that call are mostly better, the check-free rule is the better play.                                           |
| `turn-facing-a-bet-fold`       | Folding too often on the turn                      | turn folds    | Before you fold to a turn bet, compare your chance to win, including your outs, with the price, since the pot has grown enough that many pairs and draws are worth a call. | By the turn the pot holds several small and big bets, so a single big bet is often a fair price for a pair or a strong draw (pot-odds-call, implied-odds-call).              |
| `turn-facing-a-bet-call`       | Calling too often on the turn                      | turn calls    | The turn bet is twice the size of a flop bet, so call it only with a made hand that is often best or a draw whose outs pay for the price.                                  | The doubled bet size raises the required equity; calls that were fine on the flop become losing calls on the turn without a real hand or draw.                               |
| `turn-facing-a-bet-raise`      | Raising the turn without a strong hand             | turn raises   | Raise a turn bet only with a hand that beats most of the hands that will call, because a raise at the big-bet level costs twice as much when you are behind.               | The value-raise rule needs better than even equity against the continuing range, and the cost of being wrong doubles on the turn.                                            |
| `turn-not-facing-a-bet-check`  | Checking the turn with hands that should bet       | turn checks   | When the turn is checked to you with a hand that beats most of the hands that would call, bet the big bet instead of giving draws a free card.                             | The value-bet rule bets when ahead of the calling range; a check on the turn also lets drawing hands see the river for nothing.                                              |
| `turn-not-facing-a-bet-bet`    | Betting the turn without enough hand               | turn bets     | Bet the turn only when your hand is ahead of most of the hands that would call, since a big bet into better hands loses twice what it did on the flop.                     | A turn bet is a big bet; betting into a calling range that is mostly ahead loses a full big bet each time it is called.                                                      |
| `river-facing-a-bet-fold`      | Folding the river when the pot pays you to call    | river folds   | On the river the pot is usually many times the bet, so call with any hand that wins often enough to cover the price instead of folding it.                                 | With the pot many big bets deep, the required equity for a river call is low, so folding hands that win that often throws away value (pot-odds-call).                        |
| `river-facing-a-bet-call`      | Calling the river with hands that rarely win       | river calls   | Call a river bet only when your hand wins at least as often as the price of the call demands, because no more cards can come to help you.                                  | On the river there are no outs left, so the call is right only when current equity meets the pot-odds price (pot-odds-call, pot-odds-fold).                                  |
| `river-facing-a-bet-raise`     | Raising the river with hands that only beat bluffs | river raises  | Raise the river only when most of the hands that will call your raise are worse than yours.                                                                                | On the river a raise is only for value: worse hands fold to it and better hands call or re-raise unless the hero is ahead of the calling range (value-raise).                |
| `river-not-facing-a-bet-check` | Checking the river with hands worth a bet          | river checks  | When the river is checked to you with a hand that beats most of the hands that would call, bet it, because a check gives up the last chance to be paid.                    | The value-bet rule bets when ahead of the calling range, and the river is the last chance to collect that bet.                                                               |
| `river-not-facing-a-bet-bet`   | Betting the river into better hands                | river bets    | Bet the river only when most of the hands that would call are worse than yours, and check medium hands that nothing worse will pay.                                        | On the river worse hands fold and better hands call, so a bet with a medium hand gains little and loses a big bet against the hands that pay it.                             |

### Preflop

| Id             | Title                                       | Evidence name          | Fix                                                                                                                                                        | Justification                                                                                                                                                             |
| -------------- | ------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `early-fold`   | Folding strong hands from early position    | early-position folds   | From early position, open-raise the strong hands the chart plays instead of folding them, because they stay profitable even with many players left to act. | The early-position charts still open premium pairs, big aces and strong broadway hands, so folding those hands gives up a profitable open.                                |
| `early-open`   | Opening too many hands from early position  | early-position opens   | From early position, open-raise only the tight range on the chart, because with many players still to act a strong hand often wakes up behind you.         | With the most players left to act, the early-position chart range is the narrowest; hands outside it are too often dominated by a caller or re-raiser.                    |
| `early-call`   | Calling too often from early position       | early-position calls   | From early position, raise or fold rather than limp, and call a raise only with the few hands the chart calls with.                                        | The charts do not limp from early position and call raises with few hands, because players still to act can raise behind and you will often play the pot out of position. |
| `early-raise`  | Re-raising too loosely from early position  | early-position raises  | Re-raise from early position only with hands that are well ahead of the raiser's range, since the players behind you can still re-raise again.             | The re-raise rows of the charts hold only hands that beat the raiser's range; with players left to act, a weaker re-raise risks a cap from a stronger hand.               |
| `middle-fold`  | Folding playable hands from middle position | middle-position folds  | From middle position, open-raise the hands the chart opens, because fewer players are left to act and a wider range now wins.                              | The middle-position chart range is wider than the early one, so folding hands inside it gives up opens the chart rates as profitable.                                     |
| `middle-open`  | Opening too many hands from middle position | middle-position opens  | From middle position, open-raise only the chart's middle range, which is wider than early position but still leaves out weak aces and small offsuit hands. | Several players are still to act behind a middle-position open, so hands outside the chart range are too often behind the hands that continue.                            |
| `middle-call`  | Calling too often from middle position      | middle-position calls  | From middle position, raise the hands worth playing in an unopened pot and call a raise only with hands that play well against the raiser's range.         | The charts prefer raising to limping when the pot is unopened and call raises only with hands that do well after the flop against the raiser.                             |
| `middle-raise` | Re-raising too loosely from middle position | middle-position raises | Re-raise from middle position only with hands that beat most of the raiser's range, and fold or call with the rest.                                        | The re-raise rows of the charts hold only hands ahead of the raiser's range; weaker re-raises build a pot while behind.                                                   |
| `late-fold`    | Folding too much from late position         | late-position folds    | From the cutoff and button, open-raise the wide range the chart allows, because only the blinds are left to act and you will have position after the flop. | The late-position charts open the widest range since only the blinds remain and the opener acts last after the flop, so folding those hands gives up easy profit.         |
| `late-open`    | Opening too many hands from late position   | late-position opens    | Even on the cutoff and button, open-raise only the chart's late range and fold the weakest hands that rarely win against the blinds.                       | The late range is wide but not every hand; the weakest hands lose more when the blinds defend than they win when the blinds fold.                                         |
| `late-call`    | Calling too often from late position        | late-position calls    | From late position, raise rather than limp when the pot is unopened, and call a raise only with hands that play well after the flop.                       | The charts raise rather than limp from late position to win the blinds or play a heads-up pot in position, and call raises only with hands that do well after the flop.   |
| `late-raise`   | Re-raising too loosely from late position   | late-position raises   | From late position, re-raise only with hands that beat most of the raiser's range, keeping in mind that an early raiser holds stronger hands.              | The charts re-raise against the raiser's range for that seat, and an early-position raiser's range is strong, so a loose re-raise is often behind.                        |
| `blinds-fold`  | Folding too often from the blinds           | blind folds            | In the blinds you already have chips in the pot, so defend the hands the chart defends instead of folding them to a single raise.                          | The blind-defence rows of the charts account for the chips already posted, which lower the price of a call, so folding those hands gives up value.                        |
| `blinds-open`  | Raising too loosely from the blinds         | blind opens            | From the blinds, raise an unopened or limped pot only with hands strong enough to play out of position on every later street.                              | A blind acts first on every street after the flop, so the charts raise from the blinds with fewer hands than from late position.                                          |
| `blinds-call`  | Calling too often from the blinds           | blind calls            | From the blinds, complete or call only with hands that can win enough after the flop to make up for acting first on every street.                          | Calls from the blinds are cheap but are played out of position, so the charts call only with hands that keep enough value after the flop.                                 |
| `blinds-raise` | Re-raising too loosely from the blinds      | blind raises           | From the blinds, re-raise only with hands that are well ahead of the raiser's range, because you will be out of position for the rest of the hand.         | The re-raise rows of the blind-defence charts hold only hands ahead of the raiser's range, since being out of position makes marginal re-raises lose.                     |

## Tests

- `tests/stats/leaks.acceptance.test.ts`: classification, the 15 categories, the thresholds and hinted
  decisions.
- `tests/stats/leaks.test.ts`: data validation, counting, `isLeak`, `leakEvidence`, and `sessionLeaks` ranking
  and cap.
- `tests/table/session-report-leaks.test.ts`: `leakCounts` presence and validation.
- `tests/ui/report-leaks.acceptance.test.tsx` and `e2e/report-leaks.spec.ts`: the leaks section.
- `tests/stats/preflop-leaks.acceptance.test.ts`: position groups at 9, 6, 4, 3 and 2 seats, open, call,
  raise and fold by position, limps, the small-blind complete, the big-blind check and the 16 categories.
- `tests/stats/preflop-leaks.test.ts`: preflop data validation, pairing decisions with action records, every
  table size, and stored preflop `leakCounts`.
- `tests/ui/report-preflop-leaks.acceptance.test.tsx`: an early-position folds leak on the report.
- `tests/ui/report-leak-ranking.acceptance.test.tsx`: leak ranking by Major errors and error rate, and the
  three-leak cap on the report.
