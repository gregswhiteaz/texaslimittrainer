# TASK-6.18: Draw bot randomness only from the replay code and seat

Status: Done (pending judge) · Completed: 2026-11-21 · Epic: TASK-6 · Milestone: m-1 · Requirements: REQ-028, REQ-029 (REQ-025 respected) · Branch: doit/TASK-6.18

## What was asked
Every bot decision gets a random generator derived only from the hand's replay code, the bot's seat and the decision number, so replaying a hand reproduces bot choices (REQ-028.1). Bot requests carry no observed opponent statistics, so a bot cannot react to how the user plays (REQ-029.2). TAG is still pure, so this slice is the plumbing for TASK-6.2's mixing, plus proof and a lint guard. Spec: doit/TASK-6.18/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| Q-1 (auto-accepted) | Seed derivation is option (a), the formula in "What was built". Rejected: (b) `fnv1a32(code/seat/k)`; (c) 128-bit `mixState128` salt, which could collide with another hand's deck state. | Yes (no hands persisted yet) | Reuses a tested generator, independent of the deck stream | Change `botDecisionSeed` |
| Q-2 (auto-accepted) | New lint guard `botDeterminismConfig` on `src/bots/**` and `src/advice/**` bans `Math.random`, `Date`, `crypto`, `performance` (also via `globalThis.`, and `new Date()`) | Yes | Statically backs "only source of randomness" | Drop config from `eslint.config.js` |
| A-1 | AC#3 is proven with what exists: the bot request keys are exactly `id, kind, seed, style, view`; tables differing only in `userDecisions` give identical requests and actions. No statistics/basis field exists in `src/`. | Yes | REQ-035.2 not built yet | Add a basis field when it exists |
| A-2 | TAG stays pure; `random` reaches `decideTag` and is not read. Playtest TAG path unchanged. | Yes | TASK-6.2 owns mixing | n/a |
| A-3 | `AdviceClient.decideBot(view, style, seed = 0)`: client default 0, wire field always present. | Yes | Locked TASK-3.6 test calls it with 2 args | Make required and update that test |
| A-4 | A bot request seed that is not an integer in 0..4294967295 gets `ok:false` / `TypeError('Malformed bot request seed')`. | Yes | Matches existing shape checks | Default missing seed to 0 |
| A-5 | Decision index k = count of the seat's earlier non-blind actions in `view.actions`. | Yes | Stateless, derivable from the bot's own view | Keep stateful generator |

## Clarifications and decisions
- Q-1, Q-2: auto-accepted recommended options (above).
- D-1 seed derivation (documented hash): see below. D-2 lint guard: above. D-3: `seed` is required on the wire `bot` request; `BotTurn` gains `seed`. D-4: worker dependency is `decideBot(view, style, random)`; bots get a generator, never a seed or code.
- Recorded deviation: the spec placed the derivation in `src/bots/random.ts`. TASK-6.1's bot boundary test (`tests/bots/tag.test.ts`) forbids engine runtime imports in `src/bots`, so it lives in `src/engine/bot-random.ts` and TAG types its generator structurally (`{ nextUint32(): number }`). Resolved by a fix brief (option b); no test was loosened.

## What was built
**Seed derivation (D-1).** `G(code, seat) = new Xoshiro128(fnv1a32(code + "/" + seat))` (the existing `seatGenerator`). The seed for the seat's decision number k (0-based) is the (k+1)-th `nextUint32()` of a fresh `G(code, seat)`, an unsigned 32-bit number. k = number of `view.actions` with `seat === view.seat` and type not `small-blind`/`big-blind`. The worker builds the bot generator as `new Xoshiro128(seed)`.

Worked example, code `9e3779b9000000010000000200000003` (`replayCodeFromWords([0x9e3779b9,1,2,3])`):
- seat 3, k=0 -> 1927253632; seat 3, k=1 -> 3219888363
- seat 1, k=0 -> 1024787557; seat 2, k=0 -> 2122845982

Flow: `botTurn` (main thread) computes `seed = botDecisionSeed(replayCode, view)`; `AdviceClient.decideBot` posts `{id, kind:'bot', view, style, seed}`; the worker validates the seed, builds `botRandom(seed)`, calls `decideTag(view, { random })`. The replay code never crosses to the worker (TASK-3.6 D-6).

Files:
- `src/engine/bot-random.ts` (new): `seatGenerator` (moved unchanged), `botDecisionIndex`, `botDecisionSeed`, `botRandom`.
- `src/playtest/policy.ts`: re-exports `seatGenerator`, so the playtest random-move stream is unchanged.
- `src/bots/tag.ts`: `TagOptions` with optional `random`; ignored (reserved for TASK-6.2).
- `src/table/advice-service.ts`: `seed` on bot request, validation, `botRandom(seed)`.
- `src/table/session.ts`: `BotTurn.seed`; `botTurn` throws `RangeError('Not a bot turn')` if `replayCode` is null.
- `src/ui/advice/advice-client.ts`, `src/ui/table/useTableSession.ts`: send/pass the seed.
- `tools/lint/headless-boundary.js`, `eslint.config.js`: `botDeterminismConfig`.
- Tests: `tests/bots/bot-random.acceptance.test.ts`, `tests/table/bot-seed.acceptance.test.ts` (locked), `tests/bots/random.test.ts`, `tests/toolchain/bot-determinism.test.ts`; updated `tests/table/advice-service.test.ts`, `tests/table/bot-turn.test.ts`.

Hook for TASK-6.2: mixing reads `random.nextUint32()` from the generator passed to `decideTag`. TASK-6.2 also carries the AC to plumb seeds into the playtest TAG policy when TAG starts mixing.

Security: the seed reveals at most about 32 of the replay code's 128 bits (one shared 32-bit FNV state), so no usable deck information; the replay code never goes to the worker.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..04 | AC#1-3: same action for same code/seat/point; different seat differs; clock/other draws don't matter; user stats ignored | `tests/bots/bot-random.acceptance.test.ts` | Pass | gates/fix-2.json |
| SPEC-05 | AC#4: seed derived on main thread, only the number crosses | `tests/table/bot-seed.acceptance.test.ts` | Pass | gates/fix-2.json |
| SPEC-06 | Index and worked-example seeds | `tests/bots/random.test.ts` | Pass | gates/fix-2.json |
| SPEC-07 | Malformed seeds rejected | `tests/table/advice-service.test.ts` | Pass | gates/fix-2.json |
| SPEC-08 | Lint bans random/time in bot code | `tests/toolchain/bot-determinism.test.ts` | Pass | gates/fix-2.json |
| SPEC-09 | Playtest byte-identical, worker equals headless | playtest SHA command + tests | Pass per gate/review | reviews/round-1/code.json |
| SPEC-10 | lint, typecheck, test, coverage | `npm run lint && npm run typecheck && npm test` | Pass | gates/fix-2.json |

Gate fix-2: lint, typecheck, test pass (152 files passed, 527 tests passed, 7 skipped; coverage all files 96.83% statements). Scope: 640 changed lines (budget 650), 15 files (budget 15); warning: `src/engine/bot-random.ts` is outside the spec's file list (the recorded deviation). Gate runs: 2 (build-1 blocked by the boundary test, then fix-2). Judge: see doit/TASK-6.18/judge/. CI result: not in the artifacts.

## Review
Round 1: 0 blocking findings (code and security).

### Non-blocking review notes (deliberately not fixed)
- MINOR (code): `isSeed()` in `src/table/advice-service.ts:47` repeats `botRandom`'s range check and the 0xffffffff bound; export a shared `MAX_SEED`/guard. Routed to TASK-6.2 (AC added).
- NIT (code): the lint guard misses aliases (`const c = crypto; c.getRandomValues(a)`, `globalThis.Math.random()`). Within D-2; routed to TASK-6.2.
- NIT (security): `decideBot(..., seed = 0)` fails open if a caller forgets the seed. Kept because the locked TASK-3.6 test calls `decideBot(view, 'TAG')` without a seed (A-3).

## How to try it
`npm run lint && npm run typecheck && npm test`; `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256` (must match the base hash in the spec).

## Run metrics
Questions 2 (auto-accepted) · assumptions logged 5 (A-1..A-5; state.json counter shows 0) · review rounds 1 · judge rounds: see judge/ · gate runs 2 · escalations 0 · changed lines 640.

## Known limitations and follow-ups
- [trainer] Share the seed bound between `isSeed` and `botRandom` (review MINOR). Owner: TASK-6.2 (AC added).
- [trainer] Harden the lint guard against aliased globals (review NIT). Owner: TASK-6.2 (AC added).
- [trainer] Plumb seeds into the playtest TAG policy when TAG mixes. Owner: TASK-6.2 (AC added).
- TAG does not use the generator yet; no mixing is exercised end to end.

## Lessons for the factory (proposals — not applied)
- The spec put new bot code in `src/bots/` without checking TASK-6.1's boundary test (no engine runtime imports there); this blocked BUILD 1 and cost a fix brief and a second gate run. Proposal: the spec step should grep boundary tests for the target directory before choosing file locations.
- `state.json` `assumptions` stayed 0 although the spec lists 5; proposal: count spec Assumptions rows into the metric.
