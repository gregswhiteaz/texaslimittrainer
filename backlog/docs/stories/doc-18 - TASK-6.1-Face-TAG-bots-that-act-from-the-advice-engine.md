---
id: doc-18
title: 'TASK-6.1: Face TAG bots that act from the advice engine'
type: other
created_date: '2026-11-18T19:35:00Z'
updated_date: '2026-11-18T19:35:00Z'
---
# TASK-6.1: Face TAG bots that act from the advice engine

Status: Done (pending Judge and CI) · Completed: 2026-11-18 · Epic: TASK-6 — Face distinct opponents · Milestone: m-0 · Requirements: REQ-025.1, REQ-026.1, REQ-056.1 · Branch: doit/TASK-6.1

## What was asked
Add the first bot, TAG. It receives only a `PlayerView`, asks the advice engine (`recommend`) and plays the recommended move, which is always legal. The headless playtest seats TAG in every seat of a 6-player table by default, so `npm run playtest -- --hands 10000 --seed 42` is a TAG-vs-TAG run with zero invariant violations. No mixing, style files or randomness in this slice (TASK-6.2, TASK-6.18). Spec: doit/TASK-6.1/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Bot is `decideTag(view, options?)` plus `tagPolicy: SeatPolicy` in `src/bots/tag.ts`; tests in `tests/bots/` | yes | `SeatPolicy` is the type the runner already consumes; `options` is `recommend`'s own test seam | Change signature to `decide(view, style, rng)` |
| A-2 | No `style` or `rng` parameter yet | yes | Story says TAG plays the main recommendation; unused params fail `noUnusedParameters` | Add when TASK-6.2 / TASK-6.18 land |
| A-3 | Runner exports `defaultPolicyFactory(size)`; `playHand` uses it when `seams.makePolicy` is absent; the seam still overrides at every size | yes | Keeps the existing seam and makes the default testable | Decide inside each policy call |
| A-4 | Two Node type-stripping blockers fixed in source: `equity.ts` parameter property became an explicit `readonly c` field; `preflop.ts` chart import gets `with { type: 'json' }` | yes | Smallest standard change; behaviour-neutral | Extend `tools/playtest/resolve-ts.js` with a hook instead |
| A-5 | `tagPolicy` is stateless and shared by all seats and hands | yes | Advice reads nothing beyond the view | One policy object per seat |
| A-6 | "Every seat is TAG" is proven by tests (applied action equals `decideTag` of the view; CLI output byte-identical to an in-process TAG-seam run), not by new report text | yes | Report format is pinned by locked TASK-1.6/1.8 tests | Add a "Bots:" report line and unlock those tests |
| A-7 | Runner doc comments saying the default is `randomMovePolicy` were updated | yes | Comments must match behaviour | — |

## Clarifications and decisions
- Q-1 (user: TAG at 6, random elsewhere, recommended) — default size 6 seats TAG everywhere; sizes 3–5 and 7–10 keep today's seeded random-move seats with unchanged output until TASK-7.6 gives TAG a chart for them (D-3).
- Q-2 (user: skip equity on free checks, recommended) — on a postflop decision with nothing owed, TAG calls `recommend` with `FREE_CHECK_EQUITY`, a stand-in returning zero equity without dealing. The `check-free` rule fires before equity is read, so the move is identical. Measured: 10,000 all-TAG hands about 94 s without it, about 0.6 s with it (D-2). Without it the locked TASK-1.6/1.8 tests (60 s and 120 s timeouts) would fail.
- D-1 TAG returns `recommend(view).move` unchanged; D-4 no new CLI option (per-seat bots are TASK-6.6/6.9); D-5 `src/bots/tag.ts` imports only types from the engine, matching TASK-6.21's planned lint rule.
- Scope concern: postflop advice never bets or raises, so in an all-TAG 6-max playtest nobody bets after the flop. Postflop betting and the postflop cap are not exercised at 6 players until TASK-7.8; other sizes (random-move seats) still exercise them.

## What was built
- `src/bots/tag.ts` (new): `FREE_CHECK_EQUITY`, `decideTag(view, options = {})`, `tagPolicy`. Rule: on flop/turn/river with `currentBet - streetContribution === 0`, call `recommend` with the stand-in; otherwise `recommend(view, options)`. Errors from `recommend` propagate. No state, clock or randomness.
- `src/playtest/runner.ts`: exported `defaultPolicyFactory(size)` (TAG at 6, `randomMovePolicy(seatGenerator(code, seat))` elsewhere); `playHand` defaults to it; comments updated.
- `src/advice/equity.ts`, `src/advice/preflop.ts`: the A-4 fixes. Before them, `npm run playtest` could not load the advice engine at all (`ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` for the parameter property; Node ESM requires the JSON import attribute).
- Tests: `tests/bots/tag.acceptance.test.ts`, `tests/bots/tag-playtest.acceptance.test.ts` (both locked), `tests/bots/tag.test.ts`, and a SPEC-10 case in `tests/playtest/runner.test.ts`.
- No new dependencies, options or report changes.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 preflop chart move | acceptance, 200-hand property plus scripted spots | pass | tag.acceptance.test.ts |
| SPEC-02 | AC#2 call/fold facing a bet | acceptance | pass | same |
| SPEC-03 | AC#3 check with nothing owed; stand-in equals real-equity advice | acceptance | pass | same |
| SPEC-04 | AC#4 hidden cards never change action | acceptance, permutation property, `@ts-expect-error` | pass | same |
| SPEC-05 | AC#5 all-TAG 10,000-hand run, legal and clean | acceptance (spawned CLI, byte-identical to in-process) | pass | tag-playtest.acceptance.test.ts |
| SPEC-06 | AC#6 one `recommend` call per action on every street | acceptance with `vi.mock` spy | pass | same |
| SPEC-07..09 | stand-in and options, error propagation, import boundary | unit | pass | tag.test.ts |
| SPEC-10 | default seats by size | unit | pass | runner.test.ts |
| SPEC-11 | lint, typecheck, tests, coverage, headless | commands | pass | gates/build-1.json |
| SPEC-12 | CI green on branch | command | pending | CI runs after this doc |
| SPEC-13 | N/A DoD items, story doc | manual | doc published | this doc |

- Gate build-1: `npm test` 50 files, 161 passed, 1 skipped; coverage lines 100%; lint and typecheck clean; tests locked. Scope lines warn (see metrics).
- Playtest: `--hands 10000 --seed 42` exit 0, 0 violations, 0.6 s; `--hands 500 --seed 9 --size 7` 0 violations.
- Judge: pending. CI: pending.

## Review
Round 1, code and security reviewers: no BLOCKER or MAJOR findings. The code reviewer ran four mutants in a scratch copy and all were killed: `decideTag` ignoring options (SPEC-07), shortcut bypassing the recommend module (SPEC-06), seat 1 random with the rest TAG (SPEC-05 byte comparison), `playHand` ignoring `makePolicy` at size 6 (SPEC-10). It could not construct a view where the free-check shortcut changes the move.

### Non-blocking review notes (deliberately not fixed)
- MINOR (code and security): the SPEC-09 import scan in `tests/bots/tag.test.ts:65` misses `export ... from`, side-effect imports and dynamic `import()`. Not reachable today; TASK-6.21's lint rule should replace the test.
- NIT: `src/bots/tag.ts:14` has a redundant `PublicPlayer | undefined` annotation on `hero`; it only keeps a type import in use (D-5 lists that import).

## How to try it
- `npm run playtest -- --hands 10000 --seed 42` (all TAG, finishes in about 1 s; run twice and diff for identical output)
- `npm run playtest -- --hands 500 --seed 9 --size 7` (random-move seats)
- `npx vitest run tests/bots tests/playtest`; full: `npm test && npm run lint && npm run typecheck`

## Run metrics
Questions 2 · assumptions 7 · review rounds 1 · judge rounds pending · gate runs 1 · escalations 0 · sendbacks 0 · changed lines 647 vs budget 600 (warn, mostly tests), 8 of 8 files.

## Known limitations and follow-ups
- All-TAG 6-max never bets postflop (advice never bets/raises) until TASK-7.8.
- Add an invariant playtest with betting policies (random-move or mixed line-up) at 6 players so postflop betting and the cap stay covered (owner: TASK-6.9 or TASK-1.17).
- Remove `FREE_CHECK_EQUITY` once TASK-7.18 restores equity headroom or TASK-7.8 makes free checks depend on equity (owner: TASK-7.8/7.18).
- Seat TAG at all table sizes in the playtest, replacing the random-move fallback (owner: TASK-7.6).
- Add a test that every module reachable from `tools/playtest/main.ts` loads under Node type stripping (owner: small toolchain chore, no existing task).
- Replace the SPEC-09 source-scanning test, including its export-from, side-effect and dynamic-import gaps, with the TASK-6.21 lint rule (owner: TASK-6.21).

## Lessons for the factory (proposals — not applied)
- The playtest could not load the advice engine under Node type stripping, and nothing caught it when TASK-7.x landed. Proposal: the gate should run the CLI (`npm run playtest -- --hands 50`) whenever `src/` changes, or the toolchain chore above should land early.
- The 10,000-hand locked timeouts only held thanks to a measured shortcut; specs that change the default policy should measure the locked spawned tests during the spec stage (done here, worked well).
