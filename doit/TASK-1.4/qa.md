# Q&A — TASK-1.4

## Q-1 — Engine public interface (D-1)
- Answer: **Approve** the recommended createHand / legalActions / applyAction design with HandConfig, HandState (players[], pots[], betCount, toAct, actions[], result), Action shapes, and automatic street advance (spec §5).

## Q-2 — Illegal-action behaviour (D-2)
- Answer: **Typed result.** applyAction returns {ok:true,state} | {ok:false,error:{code,message}} with codes hand-complete, out-of-turn, illegal-action; state unchanged on error.

## Q-3 — Burn cards (raised by the orchestrator / Spec Detective; replaces assumption A-3)
- Answer: **Burn like a casino.** One card is burned (face-down, never shown) before the flop, before the turn and before the river. Hole cards remain deck positions 1..2n in the AC#2 order; then burn = 2n+1, flop = 2n+2..2n+4, burn = 2n+5, turn = 2n+6, burn = 2n+7, river = 2n+8 (1-based). Burned cards are recorded in state (e.g. `burned[]`) but never revealed to players or in results.
