# TASK-7.29 Q&A

## Q-1 How a scaled observed range is built
Options: (A) keep the top-N% prefix of the hand order; (B) resize the authored default range (add from the order when wider, drop weakest default hands when narrower).
**Answer: B — resize the authored default range (Recommended).**

## Q-2 Which hand order
Options: (A) keep equity vs 1 random hand; (B) equity vs 3 random hands; (C) equity vs the 6-max BTN open range; (D) hand-authored order.
**Answer: B — equity vs 3 random hands (Recommended).**

## Q-3 How re-raise (3-bet / 4-bet) lines scale
Options: (A) keep converging on PFR; (B) leave at default width; (C) scale relative to typical PFR, o = min(100, d × PFR ÷ typical PFR); (D) add a tracked 3-bet stat.
**Answer: C — scale relative to typical PFR (Recommended).**

## Q-4 Open-raise and calling lines
Options: (a) follow-up spike; (b) apply the Q-3 rule to open-raise lines in FU-B; (c) record as a known limit only.
**Answer: a — follow-up spike (Recommended).**
