# TASK-7.9 — Questions and answers (overnight autopilot, 2026-11-23; user's unattended rule)

## Q-1 — Public interface: rule id `implied-odds-call`; PostflopRecommendation gains `impliedRequiredEquityPct: number | null` and `outs: readonly Card[]`; `requiredEquityPct` keeps its pot-odds meaning
**Answer: auto-accepted (recommended)**

## Q-2 — Draws counted: flush draw (9), open-ended straight draw (8), combo (union, 15); no gutshots/backdoors; outs not discounted
**Answer: auto-accepted (recommended)**

## Q-3 — Locked re-pins: TASK-7.3 postflop.acceptance (AC#1 new keys; AC#2 hero Ad5c so it stays a pot-odds fold), TASK-7.8 value-bet.acceptance (AC#9 new keys + implied-odds branch); any further locked failure needing only a re-pin. Counts kept.
**Answer: auto-accepted (recommended)**

## Q-4 — Story error in AC#1: Ah5h vs {KsQd} is 27.3% (12/44, aces win too). Change the opponent range to {AsKd} → exactly 9/44 = 20.5%, implied-odds call
**Answer: auto-accepted (recommended)** — verified by the orchestrator (pair of aces beats kings; with AsKd a river ace gives two pair). AC#1/#3 text updated via backlog CLI.
