# TASK-7.13 — Questions and answers (overnight autopilot, 2026-11-23; user's unattended rule)

## Q-1 — Hand order: 169 classes ranked by preflop all-in equity vs one random hand (project's own seeded computeEquity), stored in src/advice/ranges/hand-order.json with a ≥50-word justification, validated on load; ties by grid order
**Answer: auto-accepted (recommended)**

## Q-2 — Public interface: optional observedOpponents snapshot (seat, hands, vpip %, pfr %) used only for action ranges; estimateOpponentRanges(view, observed?) with basis + widthPct; PostflopRecommendation.opponentBasis; adviceOptions unchanged (bots never receive it); UI/session wiring left to TASK-8.1/9.3/3.12
**Answer: auto-accepted (recommended)**

## Q-3 — Explanation wording: lead clause on the first sentence ("Ranges here follow the opponent type, {def:opponent-type}, of each player you have watched for 30 or more hands; …"), only when at least one range is scaled; stays within 3 sentences
**Answer: auto-accepted (recommended)** — user-visible copy listed for review.

## Q-4 — Locked re-pin tests/advice/postflop.acceptance.test.ts AC#1: add opponentBasis (typical player for seats 1, 2, 6); count unchanged
**Answer: auto-accepted (recommended)**
