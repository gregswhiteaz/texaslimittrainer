# TASK-1.15 — Questions and answers (autopilot run, 2026-11-21)

## Q-1 — The user's own hand at showdown
Options: (a) same rule as bots — auto-show if it beats or ties the best hand shown so far, otherwise auto-muck; the user's
own cards always stay face up at their seat; a shown user hand reads "You show · <hand>" [Recommended]; (b) always show
the user's hand; (c) a Show/Muck prompt (new control, own story).
**Answer: auto-accepted (recommended)** — (a).

## Q-2 — Table every hand when a player is all-in (TDA Rule 16)?
Options: (a) no — all-in hands follow the same pot-by-pot show/muck rule (REQ-019.5/.8, AC#6, Q-33) [Recommended];
(b) table every live hand once an all-in runout begins.
**Answer: auto-accepted (recommended)** — (a).

## Q-3 — Display of shown losing hands (AC#8)
Options: (a) a second list "Shown hands" after Winners in the "Hand over" block; lines "Dee shows · Pair of fours" /
"You show · Pair of eights" with two 30x42 cards ("Dee's cards" / "Your shown cards"), muted #A7AEB8 regular weight,
`<li data-shown-seat>` [Recommended]; (b) winner-style bold; (c) hand name only; (d) view model only.
**Answer: auto-accepted (recommended)** — (a).

## Q-4 — Edits to four locked tests that assume every hand is shown
E1 TASK-1.4 tests/engine/hand.acceptance.test.ts:454 `[2,5]`→`[2]`; E2 TASK-1.4 tests/engine/hand.property.test.ts:73-74
"all active seats shown" → exact computed show list (still exact equality); E3 TASK-1.10
tests/engine/side-pots.acceptance.test.ts:151 `[1,3,4]`→`[3]`; E4 TASK-3.22 tests/ui/user-shown-cards.acceptance.test.tsx:45
`[1,2,3,5]`→`[1,2,3]` + comment. None removes or loosens an assertion; E2/E3 become stricter.
**Answer: auto-accepted (recommended)** — approve. Unlocks recorded under each owning task.
