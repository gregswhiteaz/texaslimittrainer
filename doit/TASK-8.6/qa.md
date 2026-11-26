# TASK-8.6 — Questions and answers (autopilot, 2026-11-26)

## Q-1 — How observed counts survive Resume (persisted format)
Recommended (a): optional `observed: [{ botId, hands, vpipHands, pfrHands }]` on the session record, integer counts, written in the same transaction as each hand record; no DB version bump (stays v5); AC#2's 0-100 check becomes vpipHands/pfrHands within 0..hands. Alternatives: (b) percentages, (c) all 8 StyleCounts fields, (d) rebuild from stored hands on Resume (async, AC#2 would need rewriting).
**Answer: auto-accepted (recommended)** — additive optional field, older records still load (A-1); listed for review.
