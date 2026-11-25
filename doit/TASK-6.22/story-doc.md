# TASK-6.22: Make the headless bot step use the seeded TAG decision

Status: Done · Completed: 2026-11-25 · Epic: TASK-6 — Face distinct opponents · Milestone: m-1 · Requirements: REQ-028.1 · Branch: doit/TASK-6.22

## What was asked
`stepBot` (the headless one-bot-action helper in `src/table/session.ts`) decided with the unseeded `decideTag(view)`, so it never took TAG's mixed preflop choices, unlike the app worker and the playtest, which seed the decision from the replay code and seat. AC#1: the default step uses the seeded `decideTag`. AC#2: the locked TASK-3.1 session test compares to the exact seeded decision. Follow-up from TASK-6.2 (doc-73, A-3). Spec: doit/TASK-6.22/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | The default decides with `decideTag` for every bot seat, ignoring the seat's style. | yes | AC#1 names `decideTag`; the old default was TAG for every style too. Default sessions are all TAG. | Default to `decideStyle(view, style, botRandom(seed))` per seat |
| A-2 | Signature is `stepBot(table, policy?)`; with `policy` undefined it uses the seeded decision. No new export. | yes | The seed needs the table's replay code, which a parameter default cannot see; `botTurn` already computes it. | Export a helper or a `defaultBotPolicy(table)` factory |
| A-3 | The new test pins replay code `replayCodeFromWords([26, 1, 2, 3])`: seat 3 acts first and raises seeded, folds unseeded. | yes | Of 496 bot steps over the TASK-3.1 test's 50 codes, 2 differ (code 26 and code 46). | Pin another code |

## Clarifications and decisions
- Q-1 (locked TASK-3.1 test `tests/table/session.acceptance.test.ts:177`): approve re-pinning to the seeded decision, assertions otherwise unchanged. Auto-accepted (recommended); unlock recorded in TASK-3.1 state.
- D-1: default is `decideTag(turn.view, { random: botRandom(turn.seed) })`, matching the worker and playtest for TAG.

## What was built
- `src/table/session.ts` — `stepBot(table, policy?)`: no policy gives the seeded TAG decision using `turn.seed` from `botTurn`; an explicit policy decides as before. Imports `botRandom` and `decideTag` in place of `tagPolicy`.
- `tests/table/session.acceptance.test.ts` — locked TASK-3.1 test, line 177 now expects `decideTag(view, { random: botRandom(botDecisionSeed(code, view)) })`; one import added.
- `tests/table/bot-step-seeded.acceptance.test.ts` — new.
- `stepBot` has no caller under `src`, `tools` or `e2e`, so live play, replays and stored hand records are unchanged. `tagPolicy` is still exported.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | new acceptance: mixed spot, code 26 seat 3 raise vs unseeded fold | PASS | would fail with the old default |
| SPEC-02 | AC#1 | new acceptance: every default step equals `handleAdviceRequest` (codes 26, 46) | PASS | judge holdout: 200 codes, 1711 bot steps, 0 mismatches, 9 mixed spots |
| SPEC-03 | AC#2 | locked TASK-3.1 test, exact `toBe` seeded expectation | PASS | in `npm test` |
| SPEC-04 | AC#1 | existing `session.test.ts`, `bot-turn.test.ts` (explicit policy) | PASS | holdout: explicit policy unchanged, illegal action throws RangeError |

- `npm test`: 1420 passed, 0 failed (315 files, 46 slow-gated tests skipped). Branch CI green including E2E on Chromium and WebKit.
- Judge round 1: PASS 4/4, no findings; integrity check clean. Gate runs: 2.

## Review
Round 1, code and security: no findings.

### Non-blocking review notes (deliberately not fixed)
None (no MINOR/NIT findings).

## How to try it
`npx vitest run tests/table/bot-step-seeded.acceptance.test.ts tests/table/session.acceptance.test.ts`

## Run metrics
Questions 1 · assumptions 3 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · sendbacks 0 · changed lines about 110 in 3 files (+94 new test file).

## Known limitations and follow-ups
- A style-aware default (`decideStyle` per seat) is outside AC#1; non-TAG seats stepped by default still decide as TAG (A-1). No app caller exists, so nothing tracks this; no follow-up created.
- Stale comment at `src/table/session.ts:67`: "All play tagPolicy until E06". Not touched (out of scope).

## Lessons for the factory (proposals — not applied)
None; the run had no send-backs or failures.
