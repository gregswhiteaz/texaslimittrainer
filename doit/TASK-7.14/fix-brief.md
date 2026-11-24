# Fix brief — TASK-7.14 (review round 1)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. [MAJOR] tests/golden/postflop-spots.json:justifications-misname-made-hand (code review)
- Where: tests/golden/postflop-spots.json:160
- Problem: Several authored justifications misdescribe the hero's hand. The recorded actions are still right, but SPEC-10 asks for justifications that are accurate and sound, and these are teaching texts.
- Evidence: 6max-flop-co-call-j7o (l.160): 'Second pair of sevens' on Ad 7d 8h; sevens are the bottom pair. 6max-turn-utg-call-t7s (l.770): 'Bottom pair of sevens' on 6h Kc 8c 7c; the 6 is lowest, so this is third pair. fr-turn-hj-call-k7o (l.1099): 'Bottom pair of sevens' on Td Qs 7c 4d; the 4 is lowest. 6max-turn-bb-call-k3s (l.792): 'The king-high flush draw' with Kc3c on 9c 9s Jd Ac; with the ace on board it is the nut flush draw. 6max-turn-co-fold-98o (l.810): 'that card also makes a club flush for anyone holding one' on Kc Qc 5c Td; three clubs are already on board, so the flush exists now and a jack doesn't create it. 6max-river-btn-call-k6o (l.1387): 'missed clubs' on a 6c Jc 3c flop; the flop was monotone and no club draw is left to miss.
- Expected fix: Rewrite those texts (via the locked-file unlock path): j7o 'Bottom pair of sevens'; t7s and k7o 'Third pair of sevens' or 'A pair of sevens'; k3s 'The nut flush draw'; 98o drop the flush clause or say 'and the board already shows three clubs'; k6o replace 'missed clubs' with e.g. 'bluffs and weaker pairs'. Keep each text distinct and at least 15 words.

## 2. [MAJOR] tests/golden/graded-examples.json:open-ender-is-a-gutshot (code review)
- Where: tests/golden/graded-examples.json:63
- Problem: Graded example 'graded-postflop-fold-minor-6max-flop-open-ender' says 5d 2h on 7s 3c 6h has an open-ended straight draw. Only a 4 completes a straight (3-4-5-6-7 or 2-3-4-5-6), so it's a gutshot with 4 outs. The id and the justification both state the wrong draw.
- Evidence: holeCards '5d 2h', board '7s 3c 6h': 4-5-6-7-8 needs both 4 and 8, so the 4 is the only one-card out. The justification reads 'Five-deuce has an open-ended straight draw'.
- Expected fix: Change the text to a gutshot (e.g. 'Five-deuce has a gutshot to the four plus two small pair outs, and its equity is a few points above what the pot odds ask...') and rename the id (e.g. '...-flop-gutshot'). The pinned margin of 4.6 doesn't change. Alternatively, swap in hole cards that really are open-ended and re-pin the margin.


## Orchestrator additions (same round; text accuracy only, same files)
- MINOR (code review): fix the smaller text inaccuracies the reviewer listed in 6max-turn-bb-raise-92o, 6max-flop-utg-fold-a3o, 6max-river-co-bet-ajo and 6max-river-btn-raise-q3s (see reviews/round-1/code.json for each).
- After editing, re-check EVERY postflop justification's made-hand / draw wording against its board programmatically (pair rank relative to board, flush/straight draw type, nut status) and fix any other misnaming you find; list them in the build log.
- Renaming the graded example id is fine; keep its grade, rule id and pinned margin.
Never change a recorded action, drop a spot or loosen an assertion. npm run format, lint, then the gate.
