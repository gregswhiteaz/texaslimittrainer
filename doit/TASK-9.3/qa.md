# TASK-9.3 — Questions and answers (autopilot, 2026-11-24; user's unattended rule)

## Q-1 — Review entry wording/layout: the hint card's exact wording under "You: … · Advice: …" — preflop chart line, postflop "Equity x%" and "Required equity y%" on one line, then the explanation, then an "Opponent ranges" list ("Ben: typical player")
**Answer: auto-accepted (recommended)** — user-visible copy listed for review.

## Locked edit — tests/ui/review-panel.acceptance.test.tsx (owner TASK-9.1), per A-8 with orchestrator conditions
- Entries via storedReviewEntries(hand, hand.userDecisions.map(decisionRecord)); expected advice/grades re-pinned to the hint options (Raise to $8 / Bet $4 / Bet $8 / Call $8; correct / correct / minor / correct), as already proven by decision-record.acceptance.
- The old banned list (%, equity, Equity, Why, explanation, basis, …, TBD) asserted the TASK-9.1 "no numbers yet" panel; this story's ACs now require that content. New list: ['TBD', '…', 'undefined', 'null', '[object'] — keep '…' (no loading state in the review).
- Do NOT simply drop the `$` anchor: keep `/You: .+ · Advice: .+$/` anchored by applying it to the You/Advice line element's own text.
- Split entries on `<li data-entry` so nested opponent items don't truncate entries.
**Answer: auto-accepted (recommended, with the conditions above)** — cross-story locked edit listed for review.

## Spec Detective notes
- A-1..A-10 accepted. Re-run slow-group e2e (rapid-pace, responsive-table) and hand-records / bust-continue / worker-delay specs (SPEC-14), since grade requests now queue in the shared worker and record writes wait for grades.
