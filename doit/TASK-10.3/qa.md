# TASK-10.3 — Questions and answers (autopilot, 2026-11-24; user's unattended rule)

## Q-1 — Persisted format: optional `style: StyleCounts` (the user's 8 counts) on the stored Session Report, written once in endSession from the session's hand records; ranges/labels computed at display time; no DB version change. Locked edits (owner TASK-10.1): tests/storage/session-end.acceptance.test.ts:68 and e2e/session-report.spec.ts:113 pass the stored hand records as sessionReport's third argument
**Answer: auto-accepted (recommended)** — persisted-format change and cross-story locked edits listed for review.

## Q-2 — AC#2 contradiction: bots measure WTSD ~94% (advice folds ~3% after the flop), so no realistic healthy WTSD range can contain them. Author realistic WTSD ranges (heads-up 40–55, 6-max 30–42, full ring 28–40); AC#2 is narrowed to VPIP, PFR, Aggression and W$SD; follow-up TASK-7.32 (high) investigates the postflop folding and re-checks WTSD
**Answer: auto-accepted (recommended)** — AC#2 reworded in Backlog; TASK-7.32 created. FLAGGED FOR USER REVIEW: until TASK-7.32 lands, a user who follows the advice will see WTSD "too high".

## Spec Detective notes
- A-1..A-11 accepted. User-visible copy listed for review (A-3). The 100,000-hand check goes in the opt-in slow group (A-9).
