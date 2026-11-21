# TASK-3.8 — Questions and answers (autopilot run, 2026-11-21)

## Q-1 — Table pot display while side pots exist (REQ-021.5)
Options: (a) replace "Pot $N" with a "Pots" list — "Main pot $60", "Side pot $80" ("Side pot 1/2" when several), same
place and 16px/600 font; this street's bets added to the last pot so lines sum to the old total; single pot stays
"Pot $N" exactly [Recommended]; (b) keep "Pot $140" plus "(main $60 · side $80)" beneath; (c) collected pots only.
**Answer: auto-accepted (recommended)** — (a).

## Q-2 — Hand result for side pots (REQ-024.1, AC#2/#4)
Options: (a) a "Pot winners" list before Winners, one line per award: "Main pot $60 · You win $60", "Side pot $80 ·
Ben wins $80"; split "Side pot $81 · Ben wins $41, Ava wins $40"; Winners and Shown hands unchanged [Recommended];
(b) per-pot lines replacing Winners; (c) "You win the main pot ($60)".
**Answer: auto-accepted (recommended)** — (a).
