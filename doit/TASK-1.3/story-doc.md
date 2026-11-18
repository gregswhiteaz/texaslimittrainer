# TASK-1.3: Deal every hand from a seeded shuffle with a replay code

Status: Done (judge result pending at time of writing) · Completed: 2026-11-17 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-0 · Requirements: REQ-013.1, REQ-013.2, REQ-013.3 (deck part only) · Branch: doit/TASK-1.3

## What was asked
As a learner, every hand is dealt from a fairly shuffled 52-card deck identified by a replay code, so any hand can be reproduced. Four acceptance criteria: (1) every deck holds each card exactly once, (2) first-card position is uniform over 100,000 shuffles (chi-square), (3) the per-hand seed comes from `crypto.getRandomValues` in the browser and the Node crypto module headlessly, (4) the same replay code gives the same deck. Full-hand replay, hiding the code and showing it in Hand Review are other tasks. Spec: doit/TASK-1.3/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | One new module `src/engine/deck.ts`; tests in `tests/engine/deck*.test.ts`; browser check in `e2e/replay-seed.spec.ts` | yes | Follows the TASK-1.2 / TASK-7.1 layout | Move helpers to a separate `replay-code.ts` |
| A-2 | "Node crypto module" is met by `globalThis.crypto.getRandomValues`; in Node 22 it is the same object as `node:crypto`'s `webcrypto` (the Node test asserts the identity). No `node:crypto` import in `src/engine` | yes | One code path for Node and browser; a Node import would break the browser bundle; lint allows the `crypto` global | Import `randomFillSync` behind an environment check |
| A-3 | Browser path verified by a Playwright test that bundles `deck.ts` in memory with Vite `build()` (`write: false`, IIFE), injects it into the preview page and records `getRandomValues` calls. No production or build change | yes | Real Chromium and WebKit, no new dependency, no test switch in production code | Vitest browser mode (new dependency), or ship the deck in the app entry |
| A-4 | `newReplayCode()` reads `globalThis.crypto` on every call, not at module load | yes | Lets test spies installed after import take effect | Cache at load (breaks spying) |
| A-5 | `shuffledDeck(code)[0]` is dealt first; the unshuffled deck is `[0..51]` in `Card` order | yes | Matches TASK-1.4 wording | Deal from the end |
| A-6 | Invalid input throws `RangeError` with fixed messages (`Invalid replay code words`, `Invalid replay code: "<code>"`) | yes | Same style as `cards.ts` | Return `null` |
| A-7 | AC#2 uses a fixed set of 100,000 codes (from `new Xoshiro128(2026)`), so the test is deterministic; statistic checked against the df=51, p=0.01 critical value 77.386; both "where card 0 lands" and "which card is on top" tabulated | yes | A random set would fail 1 run in 100 by design | Random seeds with retries |
| A-8 | AC#1 uses fast-check, 10,000 runs over arbitrary 4-word seeds, plus fixed edge codes | yes | Same practice as TASK-1.2 | Fixed list of codes |

## Clarifications and decisions
- **Q-1 (user: recommended option) — format and API (D-1).** 128-bit seed from one `crypto.getRandomValues(new Uint32Array(4))`. The code is the four words as 32 lowercase hex characters, word 0 first, no separators or checksum. Parsing is strict (`/^[0-9a-f]{32}$/`) and the all-zero code is invalid. API in `src/engine/deck.ts`: `ReplayCode`, `newReplayCode()`, `replayCodeFromWords(words)`, `isReplayCode(text)`, `shuffledDeck(code)`.
- **Q-2 (user answer: mix the code first, exactly unbiased) — seed to generator (D-2).** This was the orchestrator's recommendation and it differs from the spec writer's (direct state: code words used as the xoshiro state). Reason: TASK-1.6 playtests derive codes from small `--seed` values, and low-entropy codes would give poorly scrambled early shuffles. Implemented as `mixState128` (two passes of invertible SplitMix32-finaliser xor steps, a bijection on 128 bits where only the all-zero code maps to the all-zero state) before `Xoshiro128.fromState`, and Durstenfeld Fisher–Yates using a new Lemire multiply-shift-with-rejection `nextIntUnbiased`. Golden vectors were recomputed for this design.
- D-3 (one crypto path), D-4 (in-memory Vite bundle for the browser check), D-5 (redraw on an all-zero seed) are spec decisions needing no approval.
- Note: 2^128 seeds cannot reach all 52! orders; this is unobservable in play.

## What was built
- `src/engine/deck.ts` (new): `newReplayCode` (redraws on all-zero), `replayCodeFromWords`, `isReplayCode`, `shuffledDeck` (returns a fresh array each call; throws `RangeError` on bad codes).
- `src/engine/seeded-random.ts` (modified): private `mix32` (the SplitMix32 finaliser, now shared with `splitMix32`, outputs unchanged), `mixState128`, and `Xoshiro128.nextIntUnbiased(n)`.
- `tests/engine/deck.acceptance.test.ts` (new, locked): AC#1–AC#4. `tests/engine/deck.test.ts` (new): redraw, format, round trip, errors. `tests/engine/seeded-random.test.ts` (modified): `nextIntUnbiased` and `mixState128` vectors.
- `e2e/replay-seed.spec.ts` (new, locked): browser seed source and golden deck in Chromium and WebKit.
- No new dependencies, no UI change.

Example: `shuffledDeck('0123456789abcdeffedcba9876543210')` starts `6d Qs 8h Ts Ad …`.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | fast-check 10,000 seeds + edge codes | pass | deck.acceptance.test.ts |
| SPEC-02 | AC#2 | chi-square, 100,000 codes | pass: 55.097 (card 0 position) and 33.790 (top card) vs critical 77.386 | deck.acceptance.test.ts |
| SPEC-03, 05 | AC#3 | Node spy on `webcrypto.getRandomValues`, `Math.random` throws; all-zero redraw | pass | deck.acceptance / deck.test.ts |
| SPEC-04 | AC#3 | Chromium and WebKit e2e | pass | `npm run e2e`: 12 passed |
| SPEC-06, 07, 08 | AC#4 | determinism, 4 golden decks, format, errors | pass | deck tests |
| SPEC-09, 13 | AC#2 | `nextIntUnbiased` rejection path, `mixState128` vectors | pass | seeded-random.test.ts |
| SPEC-10 | DoD | lint, typecheck, test, banned-string greps | pass: 21 files, 59 tests, `src/engine` 100% lines, greps empty | build-log.md, gates/build-2.json |
| SPEC-11 | DoD#10 | CI green on branch | not evidenced in the artifacts | — |
| SPEC-12 | DoD | N/A items; this doc | published via `backlog doc` | — |

- Gate: two runs, both PASS (tests locked, spec unchanged, no files outside the spec). One warning: 488 changed lines against a budget of 450 (fails above 900).
- Judge: **result pending.** The judge runs after this document; the orchestrator will append the outcome to the task notes.

## Review
Round 1 (code and security reviewers): no BLOCKER or MAJOR findings. One MINOR and two NITs, below.

### Non-blocking review notes (deliberately not fixed)
- MINOR (code and security): `nextIntUnbiased` documents exact uniformity for n in 1..2^31, but the double product `nextUint32() * n` is exact only while below 2^53 (n <= 2^21, or n a power of two). No current caller is affected (deck uses n <= 52).
- NIT (security): `shuffledDeck` echoes the raw rejected input in its `RangeError` message (the spec requires that text). A later CLI or UI should validate first and print a fixed message.
- NIT (code): the AC#3 "cache crypto at load" mutation probe is only caught if the bound `getRandomValues` is cached, not the crypto object. The judge should run the probe that way.

## How to try it
`npm test`, `npm run e2e`, `npm run lint && npm run typecheck`. For a deck: call `shuffledDeck(newReplayCode())` from `src/engine/deck.ts`.

## Run metrics
Questions asked 2 · assumptions logged 8 · review rounds 1 · judge rounds 0 (pending) · gate runs 2 · escalations 0 · changed lines 488 (6 files, budget 450 / 6).

## Known limitations and follow-ups
Not created, need approval:
- Narrow `nextIntUnbiased`'s documented range to 1..2^21, or make it exact for larger n.
- TASK-1.6 should validate replay codes with `isReplayCode` and print a fixed message rather than the raw error.
- Full-hand replay (TASK-1.6 AC#5), per-seat bot generators (TASK-6.18), storage and display of the code (TASK-3.9, TASK-9.4) remain for their tasks.

## Lessons for the factory (proposals — not applied)
- The gate ran while the builder's stop-hook test run was still active, and both use the coverage folder, so they can collide on its lock. The gate should not overlap the builder's test run (wait for it or use a separate coverage directory).
- Spec rule 3 and the interface comment claimed exactness over a range the arithmetic does not support. Spec writers should check numeric range claims for float exactness.
