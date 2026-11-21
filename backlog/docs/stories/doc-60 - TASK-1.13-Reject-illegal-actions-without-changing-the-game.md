---
id: doc-60
title: 'TASK-1.13: Reject illegal actions without changing the game'
type: other
created_date: '2026-11-21T06:54:00Z'
updated_date: '2026-11-21T06:54:00Z'
---
# TASK-1.13: Reject illegal actions without changing the game

Status: Done · Completed: 2026-11-20 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-1 · Requirements: REQ-017.4 · Branch: doit/TASK-1.13

## What was asked
`applyAction` must reject an action from the wrong seat, a wrong-size preflop bet or raise, a raise on a capped street, and a fold when no bet is faced. The game state must stay byte-identical after each rejection. The proof includes 100,000 random states. Spec: doit/TASK-1.13/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | AC#2's "$4" means a $4 raise increment. In engine terms the only legal preflop raise is "to currentBet + 4". A `bet` of any amount is illegal preflop because the big blind is already a live bet. | yes | Matches engine Action semantics and fixed-limit rules. | Re-read "$4" as a raise-to total (contradicts the engine's own convention). |
| A-2 | "Byte-identical" is proven by deep-freezing the input state and action, comparing `JSON.stringify` before and after, and requiring the result to be exactly `{ok:false,error:{code,message}}` with no `state` key. The scripted cases also use `structuredClone` with `toStrictEqual`. | yes | JSON is a byte-level comparison, and freezing catches mutations that are later undone. | Use `structuredClone` on all 100k (slower, no stronger). |
| A-3 | The 100k run reaches states by seeded uniform legal play (2–10 seats, stacks 5..200, $4/$8). One illegal action is injected per state, and one more per finished hand (counted separately). | yes | Every state is a real reachable one. | Use fast-check generated scripts. |
| A-4 | Message text is checked only as a non-empty string in the new locked tests. | yes | Keeps wording free to change. `hand.test.ts` still asserts the exact text. | Lock the exact messages. |
| A-5 | The seed is fixed, with per-kind minimums: out-of-turn, wrong-amount and unoffered-type ≥ 20,000 each; capped-raise, fold-unfaced and hand-complete ≥ 1,000 each. | yes | Deterministic CI, and the run can't pass vacuously. | Use a random seed per run. |

Recorded deviation from A-5: the spec said `new Xoshiro128(1313, 2026, 17, 4)`, but the constructor takes one seed. The build uses `Xoshiro128.fromState(...mixState128([1313, 2026, 17, 4]))`, which uses the same four seed words and existing helpers. The reviewer judged this sound.

## Clarifications and decisions
No questions were asked (autopilot). Decisions:
- D-1: the error interface is unchanged. `out-of-turn` for AC#1, `illegal-action` for AC#2–AC#4 and `hand-complete` for a finished hand. No new codes.
- D-2: precedence stays `hand-complete` > `out-of-turn` > `illegal-action`.
- D-3: all five ACs live in one locked file with its own helpers, so they can't be weakened from outside it.

## What was built
- `tests/engine/illegal-actions.acceptance.test.ts` (new, locked): 5 tests.
  - AC#1–AC#4 are scripted cases with controls (a legal action is accepted in each state).
  - AC#2 also has a 500-run fast-check property.
  - AC#5 is a seeded 100,000-state injection run that asserts the per-kind minimums.
  - Helpers: `deepFreeze`, `expectRejected` and `expectUnchanged`.
- `src/engine/hand.ts`: doc comments only on `ApplyErrorCode` and `applyAction`. They state the three codes, their precedence and the no-mutation guarantee (REQ-017.4). No logic change.
- The rejection contract:
  - `applyAction` never throws for a well-typed action.
  - It never mutates `state` or `action`.
  - Checks run in order: hand over → `hand-complete`; `action.seat !== state.toAct` → `out-of-turn`; type and amount not exactly matching a `legalActions` entry → `illegal-action`.
- No new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..05 | AC#1–AC#5 | 5 acceptance tests in the new file | Pass | gates/build-1.json, gates/fix-2.json |
| SPEC-06 | lint, typecheck, `npm test`, playtest | Gate runs | Pass | `npm test`: 119 files, 423 passed / 6 skipped, 96.84% statements. Playtest matched the baseline: fold 5470, showdown 4530, actions 88831, capped 244, largest pot $70, 0 violations (build-log.md). |
| SPEC-07 | Docs and N/A DoD items | This doc; no change to package files or `src/ui` | See note | Doc published through the backlog CLI. |

- The gate reported a warn for the scope budget: 365 changed lines against a budget of 300, with the fail limit at 600. The reviewer accepted this because the lines are spec-dictated scenarios and the generator.
- DoD#3 (no golden-spot suite yet), DoD#7 and DoD#12 (no screen) and DoD#9 (no strategy content) are N/A. DoD#8 holds because no dependency or network code was added.
- CI on `doit/TASK-1.13` was in progress when this doc was written (pushed at 5a6b062).
- Judge: see doit/TASK-1.13/judge/.

## Review
Round 1: 0 blocking findings. The code reviewer passed every SPEC item. It checked that the tests would fail if the engine mutated its input, accepted an illegal action, or returned a state on error. The security reviewer had no findings. No current caller (UI, bots, playtest or replay) can pass a malformed action. Even a `null` action would throw before any state is built, so it fails closed.

### Non-blocking review notes (deliberately not fixed)
- NIT: the assertion that the per-kind counts sum to the target (line ~337) can't fail, since `injected === TARGET` is already asserted.
- NIT: `if (!result.ok) return;` (line ~326) is unreachable at runtime and would silently end the test if the preceding `expect` were ever softened. `throw new Error(...)` would be safer.

## How to try it
- `npx vitest run tests/engine/illegal-actions.acceptance.test.ts`
- `npm run lint && npm run typecheck && npm test`
- `npm run playtest -- --hands 10000 --seed 42 --size 6`

## Run metrics
Questions 0 · assumptions logged 5 · review rounds 1 · judge rounds: see judge/ · gate runs 2 · escalations 0 · changed lines 365 (2 files).

## Known limitations and follow-ups
- [trainer] Validate the shape of any restored action at the save/restore boundary. Added as AC#11 on TASK-3.10.
- Malformed (non-object) actions are out of scope here, because the TypeScript type excludes them.
- Short all-in bets and raises are covered by TASK-1.14.

## Lessons for the factory (proposals — not applied)
- The spec's A-5 gave a constructor call that doesn't exist (`new Xoshiro128(a, b, c, d)`). The spec author should check constructor signatures against the code before writing a literal.
- The 300-line budget was too small for a spec that dictates this many scripted scenarios plus a generator. Estimate test-file size when setting the budget.
