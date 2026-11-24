# Fix brief — TASK-7.14 (review round 2)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. [MAJOR] tests/golden/postflop-spots.json:justifications-remaining-factual-errors (code review)
- Where: tests/golden/postflop-spots.json:612
- Problem: Two justifications still state wrong poker facts. They are the same kind of error as round 1's made-hand finding, and the fix brief's 'check every justification' pass missed them. The recorded actions are still correct.
- Evidence: 6max-turn-btn-bet-94o (l.612): hero 9h 4s on Qc 6s 4d Qh holds queens and fours, but the text says 'the sixes and small pairs that call trail our hand'. Any six makes queens and sixes, and pocket fives make queens and fives, so both beat queens and fours. hu-river-bb-call-tt (l.1690): on Kc 9c Ah 5s 6c the river 6c is the third club, so the flop's two-club flush draws completed. The text says the button 'bets missed club draws', which is the opposite of what happened.
- Expected fix: 94o: replace the last clause with e.g. 'since the deuces, threes and weaker fours that call trail our hand', or 'since ace-high and smaller pairs like threes call'. Do not mention sixes or fives as hands that trail. tt: replace 'missed club draws' with e.g. 'missed straight draws, bluffs and weaker pairs', and optionally note that the river club completes some flushes. Keep each text distinct and at least 15 words. Change no action. Use the locked-file unlock path.


Keep each fix to the one clause named. Before finishing, re-run your round-1 programmatic wording check across all 120 spots, extended to: which hands the text says trail/beat us (do they really?), and whether flush/straight draws named as "missed" actually completed on the river. Fix any further hit and list it in the build log. Never change an action, spot or assertion.
