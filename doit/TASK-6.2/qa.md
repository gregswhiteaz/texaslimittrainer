# TASK-6.2 — Questions and answers (autopilot run, 2026-11-21)

## Q-1 — Style file format (D-1; persisted/public)
Options: (a) JSON at src/bots/styles/<style>.json — format "tlh-bot-style", version 1, style, description (≥15 words),
mixedSpots [{spot, actions {recommended, alternative} probabilities summing to 1 ±1e-9, justification ≥10 words}];
parseStyle(raw, fileName) throws StyleValidationError listing every problem; validated at import [Recommended];
(b) a TS module per style; (c) integer percents.
**Answer: auto-accepted (recommended)** — (a).

## Q-2 — TAG's mixed spot types and probabilities (D-2; strategy content)
Options: (a) recommended 0.75 / alternative 0.25 in preflop-unopened, -limpers, -raise, -raise-and-calls,
-blind-defence; preflop-re-raise unmixed (77 of 196 alternative cells, mostly loose calls that would push VPIP up);
description and one-line justification per spot, original text [Recommended]; (b) mix all six; (c) 0.8/0.2; (d) 0.5/0.5.
**Answer: auto-accepted (recommended)** — (a).

## Q-3 — Locked-test edits (D-5)
Recommended list approved, with one orchestrator amendment: **no edit may widen what a locked assertion accepts.**
Every changed assertion must compare against the exact seeded decision (equality), not "recommendation or
alternative". So TASK-6.1 tag-playtest AC#6 (:100) compares to the exact seeded decision, like AC#5.
1. TASK-3.6 tests/ui/advice-worker.acceptance.test.ts:107 — pass botDecisionSeed(code, view).
2. TASK-3.6 e2e/responsive-table.spec.ts:2,212-213 — tagPolicy → seededTagPolicy(code).
3. TASK-6.1 tests/bots/tag-playtest.acceptance.test.ts — AC#5 (:57, :65-77) and AC#6 (:100) compare to the seeded
   policy/decision exactly.
4. TASK-6.18 tests/bots/bot-random.acceptance.test.ts — :85 and :174-176, only lines that actually fail, same rule.
**Answer: auto-accepted (recommended, amended to exact-equality)** — unlocks recorded under each owning task.
