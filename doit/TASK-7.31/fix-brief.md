# Fix brief — TASK-7.31 (judge round 1)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. SPEC-08 failed
- Expected: Every changed justification's made-hand wording matches the evaluator category and board (spec §5 step 3, SPEC-08).
- Actual: 6max-turn-utg-check-t9s (Tc 9c on Ks 5s 5h 8d, evaluator one-pair: fives with king high) says 'ten-nine has only ten-high'. 6max-turn-utg-fold-k9s (Kc 9c on As 8d 6d Qh, plays ace-high off the board) says 'King-high with no draw'. fr-river-utg-fold-jts (Jc Tc on Ks 4c 5s 8d 2d, plays king-high off the board) says 'Jack-high almost never beats'.
- Observed via: evaluator category of hole cards + board at the decision street, compared with the JSON justification text


Note (orchestrator): fix J-1-02 too (6max-flop-utg-fold-a9o also has a backdoor heart flush draw). Before finishing, run an exhaustive pass over ALL 120 justifications (not just changed ones) for the "X-high" pattern: any sentence naming the hero's high card or "only X-high" where the evaluator says one pair (board pair) or a higher board card plays. Fix every hit.
