# Fix brief — TASK-7.11 (review round 1)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. [MAJOR] tests/golden/preflop-spots.json:hero-raised-then-folds-reraise-at-5-to-1 (code review)
- Where: tests/golden/preflop-spots.json:171
- Problem: Three 're-raise' fold spots have the hero raise a trash hand from the big blind over a limp, then fold to the limper's re-raise for one more small bet. They are not clear-cut folds, and their justifications get the poker wrong. hu-bb-re-raise-92o (line 171): the pot is 20 and the call is 4 (5:1, so it needs about 17%). 6max-bb-re-raise-98o (line 600) and fr-bb-re-raise-87s (line 1117): the pot is 22 and the call is 4 (5.5:1, so it needs about 15%). 98o and 87s have roughly 30-35% equity even against a strong limp-reraise range, and 92o has roughly 30% heads-up. Calling is clearly right in each case. The texts say 'its equity is too low for the price' (98o) and 'equity against that strong range is too low' (87s), which is false at these odds. '98o is an offsuit hand that the re-raiser dominates' misuses 'dominates' (98o shares no card with the premium hands that re-raise). The story also contradicts itself: the hero raised 92o/98o/87s over a limp one action earlier.
- Evidence: before: hu ['call','raise','raise'] -> hero BB has 8 in, SB 12 in, call 4. 6max ['call','fold','fold','fold','fold','raise','raise'] and fr ['call',7x'fold','raise','raise'] -> pot 12+8+2=22, call 4. The chart's BB re-raise cells (93o/T2o/82o; T8o/97o/98s; 97s/86s/87o) all fold, so the spots match the engine but freeze advice a poker player would call.
- Expected fix: Replace these three fold spots with BB re-raise spots where the hero did not choose to raise trash, or pick hands where the call or raise is clear, for example a premium hand that caps. If a BB re-raise fold is still needed for coverage, take it from a situation where the hero has not already put 2 bets in, and correct the justification to argue from the real price. Drop 'dominates' for 98o.

## 2. [MAJOR] tests/golden/preflop-spots.json:heads-up-folds-near-boundary (code review)
- Where: tests/golden/preflop-spots.json:116
- Problem: Several heads-up fold spots sit close to the real heads-up limit hold'em defend boundary and are not clear-cut (REQ-039.3, A-4). hu-btn-raise-93o (line 127) and hu-btn-raise-72o (line 116): the button completed and faces a big blind raise, getting 3:1 (pot 12, call 4) in position. 93o has roughly 33% equity against a wide heads-up raising range and 72o roughly 30%, against the 25% needed. Calling is at least close, and probably right for 93o. hu-bb-blind-defence-93o (line 215): the chart itself defends T3o and 93s next to it, so the cell is on the boundary that A-4 says to avoid. hu-bb-blind-defence-82o (line 204): 82s calls next to it, and heads-up big blinds defend very wide at 3:1. The justification for 93o ('its hand strength is below what the price requires') is not true at 3:1 against a button that raises most hands.
- Evidence: Chart neighbours (heads-up BB blind-defence): 93o fold | T3o call, 93s call. 82o fold | 82s call. BTN raise: 93o, 72o fold, getting 3:1 in position.
- Expected fix: Keep heads-up folds only for the very bottom hands (for example 32o or 42o in blind-defence) whose neighbours also fold, or replace these spots with heads-up calls or raises. The A-3 action mix needs only one fold overall, and many other sizes provide folds. Make sure no chart neighbour takes a different action (A-4).

## 3. [MAJOR] tests/golden/preflop-spots.json:sb-k9s-fold-vs-button-steal (code review)
- Where: tests/golden/preflop-spots.json:1150
- Problem: fr-sb-blind-defence-k9s folds K9s in the small blind against a button open, saying it 'is dominated by the stronger kings and aces a raiser holds'. A button steal range is wide, and K9s is ahead of much of it. Against a button open, a small-blind re-raise with K9s is standard, so the fold is not clear-cut and the reasoning is wrong for this raiser. The chart cell does not depend on who raised, so the author chose the least clear raiser position.
- Evidence: before: 6 folds (seats 4-9), then 'raise' by the button (seat 1); hero is SB.
- Expected fix: Make the raiser an early seat (for example before ['raise', 'fold', 'fold', 'fold', 'fold', 'fold', 'fold'] so UTG opens), so 'dominated by the stronger kings and aces' is true. Otherwise pick a weaker hand against the button.

## 4. [MAJOR] tests/golden/preflop-spots.json:6max-btn-kts-call-on-boundary (code review)
- Where: tests/golden/preflop-spots.json:435
- Problem: 6max-btn-raise-kts (call) sits between two different chart actions: KJs and ATs raise, while K9s and KTo fold. A-4 asks for 'calls with hands whose neighbouring cells in the chart also call', and this one has none. It is a near-boundary hand by the spec's own selection rule.
- Evidence: Chart 6-max BTN raise: KTs call | KJs raise, ATs raise, K9s fold, KTo fold, QTs call.
- Expected fix: Replace it with a button call whose neighbours also call (for example a medium pair, if the pairs around it call), or move the spot to a different raiser or situation where KTs and its neighbours all call.

## 5. [MAJOR] tests/golden/preflop-spots.json:72o-weakest-hand-heads-up (code review)
- Where: tests/golden/preflop-spots.json:28
- Problem: hu-btn-unopened-72o says '72o is the weakest starting hand'. That holds roughly multiway, but heads-up (the spot's context) 32o is the weakest hand by equity, and 72o beats several hands. The teaching text states something that is wrong in this spot.
- Evidence: Justification: '72o is the weakest starting hand, with no pair, no flush help and almost no straight help. Even heads-up ...'
- Expected fix: Say 'one of the weakest starting hands', or keep the claim and change the spot to 32o.


## Orchestrator additions (same round)
- Replace every spot named in the 5 MAJORs with a clearly clear-cut spot of the same (size, situation, action) where possible, so coverage, the 110 total and each action's presence stay intact. Pick hands deep inside a uniform region of the chart (all neighbours share the action). For the re-raise situation, choose hands that were plausibly raised (premium/strong) where the chart answer is obviously right (e.g. AA/KK re-raise or a strong hand calling) — never record a fold that a 5:1 price makes wrong. Fix the wording issues (72o "one of the weakest"; "dominates" only where true).
- Also fix the MINOR spots (AKo "well ahead" wording; replace the 33 and A7s cold-calls vs UTG + caller with clearer spots).
- Security MINOR (golden.ts echo): convert only strings and numbers with String(); show <array> / <object> / <null> / <boolean> otherwise; then truncate. Add a unit test with {"toString":0} in a before step expecting a GoldenSpotValidationError (not a TypeError).
- Do not derive answers by copying engine output; reason first, then confirm the engine agrees. Report every replaced spot id (old → new) in build-log.md.
