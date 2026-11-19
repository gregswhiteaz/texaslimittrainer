# Q&A — TASK-3.4

## Q-1 — Hand names (REQ-019.7)
Asked 2026-11-18. Options: rank detail for high card and pair-type hands, category only for straight/flush/straight flush (Recommended) / full detail everywhere / category only.
**Answer (user):** Detail for pairs and sets (Recommended): "Ace high", "Pair of kings", "Two pair, kings and nines", "Three of a kind, sevens", "Full house, kings over nines", "Four of a kind, sevens"; "Straight", "Flush", "Straight flush".

## Q-2 — Result display and pot after award
Asked 2026-11-18. Options: status block titled "Hand over" with one line per winner, pot shows $0 after award (Recommended) / storyboard two lines / keep pot amount shown.
**Answer (user):** 'Hand over' + winner lines (Recommended): "Ben wins $122 · Pair of kings", "Ava wins $16" (uncontested, no hand name), split pots one line per winner with their share; pot line stays "Pot $0" after the award.

## Q-3 — Hole cards at showdown
Asked 2026-11-18. Options: each showdown winner's two cards only (Recommended) / no cards until TASK-1.15 / every unfolded hand.
**Answer (user):** Winners only (Recommended); a loser's cards are never shown.

## Q-4 — Seat below the engine minimum ($96 at $4/$8) before the next hand
Asked 2026-11-18; the user asked to clarify, was told it is interim until all-ins exist and that its removal will be a Backlog acceptance criterion with a test, then answered. Options: top every seat below the minimum back to $160 (Recommended) / bots topped up and the table stops for the user / bots topped up and the user gets Rebuy/Leave / relax engine so short seat can only fold.
**Answer (user):** Top everyone back to $160 (Recommended), as an interim rule.
Commitments made to the user:
1. The top-up in nextHand carries a code comment naming the task that removes it.
2. In Step 6a, add a testable AC to whichever of TASK-1.16 / TASK-3.11 lands last: "Given a seat below the old $96 minimum, When the next hand is dealt, Then its stack is not topped up — it plays its chips (or goes to Rebuy / bot replacement at $0) — and the interim top-up in nextHand is removed."
It temporarily bends REQ-007.4; nothing is stored or reported yet.

## D-2 — Edits to earlier stories' locked tests (decided by the orchestrator, not asked)
E1–E4 in spec §5. E1 is forced by REQ-024.3 (the auto-deal replaces TASK-3.1's "no new hand after 3 s" behaviour). Precedent: TASK-2.1 Q-3, TASK-3.2 Q-1, TASK-3.3 D-5. No assertion is removed or weakened.
