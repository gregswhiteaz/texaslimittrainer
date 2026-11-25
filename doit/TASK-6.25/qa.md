# TASK-6.25 — Questions and answers (autopilot, 2026-11-24)

## Q-1 — Replacement rule (REQ-007.5/007.7/007.8; 007.8 came from user Q-113)
Options: (a) a replacement bot keeps the busted bot's style, presets and Custom; amend REQ-007.5, retire 007.7/007.8, delete the random draw [Recommended]; (b) draw from styles the table is short of; (c) playtest-only change, app keeps drifting; (d) make the Maniac lose (measured: unreachable inside its bands).
**Answer: auto-accepted (recommended)** — (a). Flag for user review: this reverses an earlier user decision (Q-113).

## Q-2 — Maniac retune
Options: postflop call→raise 0.6 → 0.2 plus new postflop fold→call 0.8 (passing prototype, 100k all 3 seeds) [Recommended]; drop call→raise entirely + fold→call 0.8 (untested at 100k).
**Answer: auto-accepted (recommended)** — call→raise 0.2 + fold→call 0.8; Rock value bar 75 → 80 and wider ranges after a raise per spec.

## Cross-story locked re-pins (values replaced one-for-one, check counts kept)
Unlocked with reason "TASK-6.25 Q-1/Q-2":
- tests/bots/maniac.acceptance.test.ts (TASK-6.4)
- tests/bots/calling-station-postflop.acceptance.test.ts (TASK-6.17)
- tests/bots/rock.acceptance.test.ts (TASK-6.5)
- tests/bots/rock-postflop.acceptance.test.ts (TASK-6.16, TASK-6.17)
- tests/bots/replacement.acceptance.test.ts (TASK-6.8)
- tests/playtest/replacement.acceptance.test.ts (TASK-6.8, TASK-6.17)
- tests/table/replace-bot.acceptance.test.ts (TASK-6.8)
- tests/storage/session-records.acceptance.test.ts — not hook-locked; editable.
**Answer: auto-accepted (recommended)** — listed for review.
