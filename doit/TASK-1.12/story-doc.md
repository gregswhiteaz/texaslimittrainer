# TASK-1.12: Cap each street at one bet plus three raises

Status: Done (pending judge) · Completed: 2026-11-20 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-1 · Requirements: REQ-016.2, REQ-016.3, REQ-016.4 · Branch: doit/TASK-1.12

## What was asked
The engine must stop offering a raise once a street has 4 bets (a bet plus three raises; preflop the big blind is the first bet), at every table size including heads-up, so a fifth bet is rejected. The playtest's random policy should stop carrying its own "no fifth bet" filter, preflop advice should agree with the engine cap, and the invariant checker must keep its own independent bet-cap check. Proof: 100,000 random seeded hands with 2-10 players never exceed 4 bets on a street. Spec: doit/TASK-1.12/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Engine constant is `STREET_BET_CAP` in `src/engine/hand.ts`; the checker keeps its own `MAX_BETS_PER_STREET = 4` and does not import it. | yes | One shared constant would let a single wrong edit break both the engine and its checker. | Import one constant everywhere. |
| A-2 | The `bet` branch of `legalActions` needs no cap guard: bet is offered only when `currentBet === 0`, i.e. `betCount === 0`. | yes | No reachable state offers a bet at 4 bets. | Add a guard (dead code). |
| A-3 | The 100,000-hand run is split over sizes 2-10 (11,112 at size 2, 11,111 at each of 3-10), seeds `1200 + size`, through `runPlaytest`. | yes | ~2.7 s locally with full invariant checks; random play hits the cap often (72,650 capped streets), so not vacuous. | Pick one size per hand (needs a new runner seam). |
| A-4 | The `fifthBet` fault fixture now reports `betCount: 3` after the fourth bet so the real engine offers and accepts a fifth raise, which the checker must catch from the action records. | yes | The old fixture could not make a fifth bet without also raising a `legal-action` violation; locked TASK-1.8 test requires a `bet-cap`-only fault. | Force the raise outside the legal set (fails the locked TASK-1.8 test). |

## Clarifications and decisions
- Q-1 (auto-accepted, recommended option a): change one fixture line in the locked chip-safety test (owner TASK-1.31). With the cap, the old worst-case hand at stakes 2^45 puts in only ~62% of MAX_SAFE_INTEGER, below its >0.9 check. Decision D-3: only the stake changed, to `boundStakes(56_294_995_342_130)` (largest the A-4 bound allows); every assertion is kept. Unlock recorded under TASK-1.31.
- D-1: the cap lives in `legalActions` (single source for `applyAction`, views, advice, UI); `applyAction` gains no separate check.
- D-2: `recommendPreflop` keeps its `betCount < cap` clause, now reading `STREET_BET_CAP`, so advice and engine cannot drift.
- Recorded deviation: SPEC-02's literal call amounts (12 flop / 24 turn-river) were a spec error. The builder asserted 8 / 16 (what the seat to act owes, matching the spec's own section 5 turn example). The code reviewer worked the script by hand and confirmed 8/16. The raise-one-unit-higher amounts (20, 40) are as specced.

## What was built
- `src/engine/hand.ts` — exports `STREET_BET_CAP = 4`; `legalActions` offers `raise` only while `state.betCount < STREET_BET_CAP`. At the cap, the seat to act gets exactly `[fold, call]`; a raise is rejected with the existing `illegal-action`.
- `src/playtest/policy.ts` — `randomMovePolicy` draws uniformly over `view.legalActions`, no betCount filter (same RNG stream, so playtest output is byte-identical).
- `src/advice/preflop.ts` — imports `STREET_BET_CAP` in place of local `CAP`.
- `src/engine/invariants.ts` — unchanged; still independent.
- Tests: new `tests/engine/bet-cap.acceptance.test.ts` (SPEC-01..07); `tests/engine/invariants.test.ts` (checker counts records, not the engine cap); `tests/playtest/policy.test.ts` (SPEC-08); `tests/playtest/runner.test.ts` (over-cap part uses `FAULTS.fifthBet.seams`); `tests/support/faulty-engine.ts` (A-4); `tests/engine/chip-safety.acceptance.test.ts` (D-3, one line).
- No UI change (the action bar already renders `legalActions`); no new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 preflop cap | acceptance `bet-cap.acceptance.test.ts` | pass | gates/build-1.json, fix-2.json |
| SPEC-02 | AC#2 flop/turn/river | acceptance (8/16 call amounts, see deviation) | pass | same |
| SPEC-03 | AC#3 heads-up | acceptance | pass | same |
| SPEC-04 | AC#4 100k hands | acceptance, sizes 2-10, 0 violations | pass | same |
| SPEC-05 | AC#6 fifth bet illegal | acceptance | pass | same |
| SPEC-06 | AC#5 advice agrees | acceptance | pass | same |
| SPEC-07 | AC#6 checker independent | acceptance + unit | pass | same |
| SPEC-08 | AC#6 policy unfiltered | unit | pass | same |
| SPEC-09 | DoD checks | lint, typecheck, test, playtest | pass | build-log.md |
| SPEC-10 | docs / N/A DoD | this doc; manual | see below | |

- `npm test`: 118 files, 418 passed, 6 skipped; coverage thresholds met (96.84% statements, 94.27% branches). Lint and typecheck pass.
- `npm run playtest -- --hands 10000 --seed 42 --size 6`: fold 5470, showdown 4530, actions 88831, capped 244, largest pot $70, violations 0 (identical to baseline).
- `npx playwright test e2e/action-bar.spec.ts e2e/table.spec.ts`: 22 passed (Chromium and WebKit).
- Gates: build-1 and fix-2 both PASS (329 changed lines vs budget 360; 9 files vs 9; test integrity pass).
- Branch CI run 44875055710: in progress at writing.
- Judge: see doit/TASK-1.12/judge/.

### SPEC-10 documentation items
This Backlog doc describes the cap, the policy change and the fixture change. N/A DoD items: DoD#3 (golden-spot suite not yet created), DoD#7 and DoD#12 (no screen added or changed), DoD#8 (no network code touched), DoD#9 (no strategy content). `git diff --stat main` touches no `src/ui` file and no chart JSON.

## Review
Round 1: code and security reviewers, 0 blocking findings. Security confirmed every advancing path goes through `applyAction`, the bet branch cannot exceed the cap, and the D-3 edit still proves the safe-integer guarantee (max commitment 900,719,925,474,088 per seat, within every stack).

### Non-blocking review notes (deliberately not fixed)
- NIT: `const allowed = view.legalActions;` in `src/playtest/policy.ts` is a plain alias left over from the removed filter.
- NIT: AC#5/AC#6 assert on source text (`view.betCount < STREET_BET_CAP`); a reformat could break the substring check (a whitespace-tolerant regex would fix it).

## How to try it
- `npm test`
- `npm run playtest -- --hands 10000 --seed 42 --size 6` (also `--size 2`, `--size 10`)
- `npx playwright test e2e/action-bar.spec.ts e2e/table.spec.ts`

## Run metrics
Questions 1 · assumptions 4 (spec-level) · review rounds 1 · judge rounds: see judge/ · gate runs 2 · escalations 0 · changed lines 329 (9 files).

## Known limitations and follow-ups
- Short all-in bets/raises and the half-bet reopening rule remain with TASK-1.14; rejection messages and state-unchanged guarantees with TASK-1.13; capped-street UX with TASK-3.7.
- [trainer] TASK-1.31: the chip-safety AC#1 case now uses stake 56,294,995,342,130 (Q-1/D-3 unlock); keep this in mind when that task is revisited.

## Lessons for the factory (proposals — not applied)
- The spec's SPEC-02 literal numbers (12/24) contradicted its own section 5 worked example and the engine rule. Propose the spec writer hand-run each scripted scenario (or have the spec-review step do so) before approving amounts.
