# TASK-7.32 — Questions and answers (user, 2026-11-24)

## Q-1 — Fix approach (D-1): bots on action ranges + turn required equity counts one river big bet (amends REQ-033.1) + value raise facing a bet needs >65% (amends REQ-033.2; betting stays >50%)
**Answer: Full fix (recommended)** — user choice.

## Q-2 — Mixed line-up drift out of REQ-027 bands
**Answer: Follow-up story (recommended)** — created TASK-6.25. Until it lands, the opt-in slow tests/bots/style-bands.acceptance.test.ts and manual style-bands.yml are expected to fail (do NOT edit that locked test; record in build notes).

## Q-3 — Explanation wording
**Answer: Inline clause (recommended)** — "Pot odds, {def:pot-odds}, counting the big bet you will likely face on the river, ask for {required}"; value-raise sentence shows 65.0%.

## Cross-story locked edits (re-baselining expected advice/bot results; replace values one-for-one, keep check counts)
Unlocked under their owners with reason "TASK-7.32 Q-1".
- tests/advice/grade.acceptance.test.ts (owner TASK-7.4)
- tests/advice/implied-odds.acceptance.test.ts (owner TASK-7.9)
- tests/advice/postflop.acceptance.test.ts (owner TASK-7.3)
- tests/advice/postflop.acceptance.test.ts (owner TASK-7.9)
- tests/advice/postflop-coverage.acceptance.test.ts (owner TASK-7.22)
- tests/advice/value-bet.acceptance.test.ts (owner TASK-7.8)
- tests/golden/postflop-spots.json (owner TASK-7.14)
- tests/golden/graded-examples.json (owner TASK-7.14)
- tests/bots/tag.acceptance.test.ts (owner TASK-6.1)
- tests/bots/tag-mixing.acceptance.test.ts (owner TASK-6.2)
- tests/bots/calling-station.acceptance.test.ts (owner TASK-6.3)
- tests/bots/maniac.acceptance.test.ts (owner TASK-6.4)
- tests/playtest/style-bots.acceptance.test.ts (owner TASK-6.9)
- tests/playtest/games.acceptance.test.ts (owner TASK-1.16)
- tests/table/next-hand.acceptance.test.ts (owner TASK-3.4)
- tests/table/short-stack.acceptance.test.ts (owner TASK-3.21)
- e2e/short-stack.spec.ts (owner TASK-3.21)
- tests/playtest/check-styles.acceptance.test.ts (owner TASK-6.11)
**Answer: approved by user via Q-1** — re-baselines listed for review.
