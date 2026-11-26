# Fix brief — TASK-7.31 (review round 1)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. [MAJOR] tests/golden/postflop-spots.json:92o-omits-nines-full-of-fours (code review)
- Where: tests/golden/postflop-spots.json:987
- Problem: The 6max-turn-bb-raise-92o justification lists every hand ahead of the hero and leaves one out. It says 'only kings full, nines full of kings, fours full or a nine with a kicker above the four is ahead', but 9-4 (nines full of fours) also beats the hero's trip nines. This is the AC#2 spot, whose whole point was fixing a made-hand misstatement, and SPEC-08 requires the made-hand wording to be accurate.
- Evidence: Hero 2c 9d, board 9h 4h Ks 9c. Enumerating every opponent holding with evaluate()/compareHands() against the hero's 9-9-9-K-4 gives the full houses 44, 49, 9K and KK, plus trips 9x with x in 5..A. 49 = 9-9-9-4-4 (nines full of fours) is not in the sentence: it is not 'fours full' (that is 44 = 4-4-4-9-9), and its kicker is not above the four.
- Expected fix: Rewrite the closing clause so the list is complete, for example 'since only kings full, nines full, fours full or a nine with a kicker above the four is ahead'. Alternatively name 'nines full of kings or fours'. Keep 'kings full', keep the text clear of /set of kings/i, and keep it distinct for DoD#1.


## Also fix in this round (orchestrator, review r1 MINOR/NIT — wording only, no decision/value change)
- No-pair hands named "X-high" after the hero's top hole card when a higher board card plays: `6max-river-sb-check-qjo`, `6max-river-utg-fold-t9s`, `6max-river-utg-fold-jts`, `6max-river-btn-fold-76s` — reword accurately (e.g. "no pair, queen-jack with no draw").
- `6max-river-bb-check-53s`, `6max-turn-bb-check-85s` name a kicker that doesn't play — drop or correct it.
- `docs/advice/golden-spots.md:150` "Adding a spot" step 2: say no hero preflop step may be a Major error (a borderline Minor step is allowed), matching the rule.
- `changes.md`: note that `fr-flop-bb-raise-a3s` kept its justification (still accurate).
Re-check every edited justification with the evaluator. tests/golden/postflop-spots.json is unlocked under TASK-7.14 for this fix.
