# TASK-6.4 — Questions and answers (autopilot run, 2026-11-21)

## Q-1 — Widen the deviation format (D-1; persisted format)
Options: (a) keep v1 and entry shape; advice fold|raise|check|call, instead call|bet|raise; add preflop/fold/raise,
preflop/check/raise, preflop/call/raise, postflop/check/bet, postflop/call/raise to the existing three; (street, advice)
at most once; tag.json and calling-station.json unchanged; unlocked unit case moves preflop/fold/raise → preflop/fold/bet
[Recommended]; (b) v2 "aggressive" keyword; (c) multiple replacements per pair; (d) Maniac-only keys.
**Answer: auto-accepted (recommended)** — (a).

## Q-2 — Maniac values and description (D-2; strategy content)
Options: (a) preflop fold→raise 0.45, call→raise 0.6, check→raise 0.6, postflop check→bet 0.85, call→raise 0.85;
prototype (two Maniacs, 10k hands) VPIP 56.0%, PFR 53.3%, aggression 84.9%, 0 violations [Recommended];
(b) 0.4/0.5/0.5/0.8/0.8; (c) 0.5/0.6/0.6/0.85/0.85; (d) no fold→raise.
**Answer: auto-accepted (recommended)** — (a).

## Q-3 — Route 'Maniac' worker seats to decideManiac (D-3)
Options: (a) yes, like TASK-6.3 Q-3 (unlocked unit assertion updated) [Recommended]; (b) defer to TASK-6.6.
**Answer: auto-accepted (recommended)** — (a).
