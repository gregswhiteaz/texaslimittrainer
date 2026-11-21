# TASK-6.18 — Questions and answers (autopilot run, 2026-11-21)

## Q-1 — How the bot seed is derived (randomness/fairness; D-1)
Options: (a) reuse the existing per-seat generator `new Xoshiro128(fnv1a32(`${code}/${seat}`))` (moved to
src/bots/random.ts, re-exported from src/playtest/policy.ts); k = that seat's earlier non-blind actions in view.actions;
seed for decision k = the (k+1)-th nextUint32() of a fresh generator; worker builds `new Xoshiro128(seed)`. Example:
code 9e3779b9000000010000000200000003, seat 3 → 1927253632 (k=0), 3219888363 (k=1) [Recommended]; (b) seed =
fnv1a32(code/seat/k); (c) 128-bit mixState128 variant (rejected: could collide with another hand's deck state).
**Answer: auto-accepted (recommended)** — (a). Reversible: no hands are persisted yet.

## Q-2 — Lint guard against other randomness sources (D-2)
Options: (a) botDeterminismConfig in tools/lint/headless-boundary.js for src/bots/** and src/advice/**, banning
Math.random, Date, crypto, performance (incl. globalThis. and new Date()) via no-restricted-properties /
no-restricted-syntax (not no-restricted-globals, to keep the locked TASK-1.1/1.40 boundary test green) [Recommended];
(b) src/bots only; (c) no guard.
**Answer: auto-accepted (recommended)** — (a).
