# TASK-3.10 — Questions and answers (overnight autopilot, 2026-11-23; user's unattended rule)

## Q-1 — Persisted session format: store `sessions` in tlh-trainer v2 (additive upgrade), keyed by sessionId, put after each hand; fields per spec D-1
**Answer: auto-accepted (recommended)**

## Q-2 — Stored state is the next-hand state (nextHand(table): post-replacement/top-up stacks, next button; handsPlayed = hand just completed)
**Answer: auto-accepted (recommended)**

## Q-3 — AC#10/#11: the session format never holds a hand; parseSessionRecord rejects any `hand`/`actions` property; restoreSession returns hand: null and never calls applyAction; tested with real/corrupt HandState and well-/malformed action lists; docs say a future live-hand story must add HandState/action validation
**Answer: auto-accepted (recommended)** — judge on substance: no untrusted HandState or action can reach the engine.
