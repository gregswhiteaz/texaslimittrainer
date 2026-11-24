# TASK-3.11 — Questions and answers (autopilot, 2026-11-24; user's unattended rule)

## Q-1 — Persisted format: a cash session record may store the user's seat at stack $0 ("busted, waiting at Rebuy / Leave table"); exactly one exception (user seat, cash only, value 0); Resume reopens the dialog without dealing
**Answer: auto-accepted (recommended)** — persisted-format change listed for review.

## Q-2 — Dialog copy: heading `Out of chips`, body `Your stack is $0. Rebuy for $160 to keep playing, or leave the table.` (amount from buyIn(config.stake)); buttons `Rebuy` and `Leave table` (REQ-007.2)
**Answer: auto-accepted (recommended)** — user-visible copy listed for review.

## Spec Detective notes
- A-1..A-6 accepted as written.
- tests/table/next-hand.test.ts:100-107 (unit, not locked) expects the user on $0 to become $160: re-pin it to the new rule (user stays at $0, no hand dealt) — replace the expected values, keep the number of checks.
- TASK-3.21 (remove the temporary top-up) stays out of scope; the bust is reachable in real play only from exactly $96 until then, so ACs are proven with seeded short stacks.
