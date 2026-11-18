# Q&A — TASK-1.2

## Q-1 — Public interface (D-1)
- Answer: **Recommended (a).** Card = integer 0–51 (rank×4+suit; rank 0–12 = 2..A; suit 0–3 = c,d,h,s); HandRank = integer 1–7462, higher = stronger; evaluate(5–7 cards) throws RangeError on bad input; compareHands → -1/0/1; handCategory(rank); HAND_CATEGORIES, HAND_RANK_COUNT; cards.ts helpers makeCard/cardRank/cardSuit/parseCard/parseCards/formatCard.

## Q-2 — AC#1 reference table (D-2)
- Answer: **Recommended (a).** Independent brute-force oracle in test code (tests/engine/reference-ranking.ts), cross-checked against published class and hand counts; all 2,598,960 five-card hands verified; no fixture, no dependency.

## Q-3 — Evaluator approach and speed (D-3)
- Answer: **Recommended (a).** Table-driven 7-card evaluator (flush table + collision-free rank-count index), tables built at module load (≤512 KiB, ≤50 ms); target ≥10M evals/s on the reference machine; CI floor ≥1M/s and build ≤500 ms.
