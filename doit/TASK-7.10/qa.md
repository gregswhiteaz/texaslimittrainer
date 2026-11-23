# TASK-7.10 — Questions and answers (overnight autopilot, 2026-11-23; user's unattended rule)

## Q-1 — User-visible wording: approve the authored concept definitions and templates in spec §5 as written (original text, plain names)
**Answer: auto-accepted (recommended)** — listed for the user's review in the final report.

## Q-2 — Public interface: `readonly explanation: string` on PreflopRecommendation and PostflopRecommendation
**Answer: auto-accepted (recommended)**

## Q-3 — Locked re-pins: TASK-7.3 postflop.acceptance AC#1 (`explanation: expect.any(String)`), TASK-7.8 value-bet.acceptance AC#9 (key list adds 'explanation'); counts kept
**Answer: auto-accepted (recommended)**

## Q-4 — Numbers quoted per rule (equity % + required % on every postflop; value rules add equity vs callers and 50%; implied-odds adds outs count and implied price; pot-odds-fold adds implied price when present; preflop no numbers)
**Answer: auto-accepted (recommended)**

## Block 1 — locked TASK-7.2 typecheck sandbox (tests/advice/preflop.acceptance.test.ts AC#6) lacks explain.ts and its imports
Option 1 (recommended): unlock under TASK-7.2 and add the 8 files to the sandbox list; every assertion kept.
**Answer: auto-accepted (recommended)** — applied by the orchestrator; 8/8 tests pass.
