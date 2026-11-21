# TASK-1.9 — Questions and answers (autopilot run, 2026-11-20)

## Q-1 — New stack floor in createHand
Options: (a) bigBlind + 1 ($5 at $4/$8), message keeps its template ("at least 5") [Recommended]; (b) $1 (pulls all-in blinds into this task); (c) keep $96 (ACs only testable on hand-built states).
**Answer: auto-accepted (recommended)** — (a). minimumStack itself is unchanged (session top-up and the A-4 stakes bound use it); only its doc comment changes.

## Q-2 — Blinds count as bets for the uncalled-bet return
Options: (a) yes — in a walk the big blind gets back its unmatched $2, so "You win $4" instead of $6 [Recommended, REQ-018.4 "any bet"]; (b) blinds are dead money.
**Answer: auto-accepted (recommended)** — (a).

## Q-3 — New optional engine field HandResult.returned?: {seat, amount}
Options: (a) optional field, present only when chips are returned; totalContribution keeps its meaning; awards exclude returned chips [Recommended]; (b) lower the bettor's contributions; (c) a "return" action record.
**Answer: auto-accepted (recommended)** — (a).

## Q-4 — Amount/message updates in earlier stories' locked tests (E1–E8)
Changes only expected amounts/messages or add the `returned` key toEqual needs; nothing removed or loosened. AC#5, AC#7 and Q-1 require them.
**Answer: auto-accepted (recommended)** — yes. Unlocks recorded under each owning task. If any other locked assertion fails, the builder stops and escalates.
