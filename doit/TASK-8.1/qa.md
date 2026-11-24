# TASK-8.1 — Questions and answers (autopilot, 2026-11-24; user's unattended rule)

## Q-1 — Hint card copy: heading "Hint"; "Recommended: Raise to $8" (action-button label); postflop "Equity 58.0%" / "Required equity 12.5%"; "Opponent ranges" list ("Ben: based on 45 hands of this opponent"); loading "Working out the hint…"; error "The hint could not be worked out. Select Hint to try again."; preflop "From the {heads-up|6-max|full-ring} chart: {action} {A9o} from {position}" with the listed position names
**Answer: auto-accepted (recommended)** — user-visible copy listed for review.

## Q-2 — AC#12 wording: "Your equity against the hands that would call is (not) above {threshold}" in the value-bet, check-free and value-raise templates; re-pin tests/advice/explain.test.ts strings one-for-one
**Answer: auto-accepted (recommended)** — advice-text change listed for review (stored explanations from now on use it).

## Q-3 — Observed stats after Resume: restart at 0 after a resume; follow-up task to persist them (no AC covers resume; persisting changes the session-record format)
**Answer: auto-accepted (recommended)** — interim behaviour listed for review; follow-up created in Step 6a.

## Spec Detective notes
- A-1..A-10 accepted. Wiring the snapshot into act means stored decisions are graded with observed ranges after 30 hands — expected by TASK-3.12/doc-113.
- AC#8's 50 live decisions are proven on the state machine + rendering; the browser test does 3 decisions and 10 toggles (A-9).
