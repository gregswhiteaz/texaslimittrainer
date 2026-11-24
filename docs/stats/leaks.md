# Postflop leaks (REQ-047, REQ-044.5)

The Session Report's "Biggest leaks this session" section names the kinds of postflop decision the user got
wrong most often, each with evidence from the session and a one-sentence fix (TASK-10.5). The category titles,
evidence names, fixes and justifications were written for this project (REQ-061.2). Preflop categories come in
TASK-10.6; ranking by Major errors and the limit of three leaks come in TASK-10.8.

- `src/stats/leak-categories.json`: the 15 postflop categories, format
  `{"format": "tlh-leak-categories", "version": 1, "categories": [...]}`.
- `src/stats/leaks.ts` (headless): `parseLeakCategories`, `LEAK_CATEGORIES` (the file, validated at import),
  `decisionCategory`, `categoryCounts`, `isLeak`, `leakEvidence` and `sessionLeaks`.
- `src/table/session-report.ts`: `sessionReport` stores the counts as `leakCounts` (see
  [Session reports](../storage/reports.md#leakcounts)).
- `src/ui/report/ReportScreen.tsx`: the leaks section.

## Categories

Each of the user's postflop decisions falls in one category: street (flop, turn, river) × facing a bet (fold,
call, raise) or not facing a bet (check, bet). The category id is
`<street>-facing-a-bet-<action>` or `<street>-not-facing-a-bet-<action>`.

**Facing a bet** is read from the user's action type (A-1): fold, call and raise face a bet; check and bet do
not. Postflop the engine offers fold, call and raise only when the seat owes chips, and check and bet only when
nothing has been bet. A call on a street capped at four bets is still type `call`, so it is a facing-a-bet call.
The one mismatch is the rare spot where nothing is owed but a short all-in left a bet on the street; there a
check counts as not facing a bet and a raise as facing one. Preflop decisions belong to no category yet, and a
forced fold after Leave table mid-hand has no decision record, so it is never counted.

## Rule

- Only decisions with `hinted` false count, for both thresholds and for the evidence (REQ-047.2, REQ-047.8).
- An error is a decision graded Minor or Major.
- A category is a **leak** when it has at least 8 unhinted decisions and at least 40% of them are errors:
  `decisions ≥ 8 and 5 × errors ≥ 2 × decisions` (integers only). 4 of 10 is a leak; 7 of 7 is not (too few);
  3 of 10 is not; 3 of 8 (37.5%) is not; 8 of 20 is.
- **Evidence:** `<errors> of <decisions> <evidence name> graded as errors`, e.g.
  `4 of 10 turn calls graded as errors` (REQ-047.4).
- Every leak is listed, in the category order below (flop, turn, river; fold, call, raise, check, bet).
- No leak → the section shows
  `No leaks found this session (a leak needs 8+ spots with 40%+ errors).` A report stored before TASK-10.5 has
  no `leakCounts` and shows no leaks section.

Each leak shows its title (bold), the evidence and the fix, each on its own line. The justifications are not
shown on the report.

## Validation

`parseLeakCategories` requires the format and version above and, for each entry, exactly the keys `id`,
`street`, `facingBet`, `action`, `title`, `evidenceName`, `fix` and `justification`: `street` is flop, turn or
river; `facingBet` is a boolean; `action` is fold, call or raise when facing a bet, else check or bet; `id`
matches street, facingBet and action and is unique. The title is trimmed, non-empty and has no final `.`; the
evidence name is trimmed, non-empty and lower case; the fix is exactly one sentence (starts with an upper-case
letter, ends with `.`, no other `.`, `!` or `?`); the justification is trimmed, starts with an upper-case
letter and ends with `.`. A bad file throws `RangeError('Invalid leak categories: <path>')`, e.g.
`categories[3].fix`, when the app loads.

## Content

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

## Tests

- `tests/stats/leaks.acceptance.test.ts`: classification, the 15 categories, the thresholds and hinted
  decisions.
- `tests/stats/leaks.test.ts`: data validation, counting, `isLeak`, `leakEvidence` and `sessionLeaks` order.
- `tests/table/session-report-leaks.test.ts`: `leakCounts` presence and validation.
- `tests/ui/report-leaks.acceptance.test.tsx` and `e2e/report-leaks.spec.ts`: the leaks section.
