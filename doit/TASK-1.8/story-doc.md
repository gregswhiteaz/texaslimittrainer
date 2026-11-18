# TASK-1.8: Check game invariants after every playtest action

Status: Built, review clean (round 2); judge and CI pending · Date: 2026-11-18 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-0 · Requirements: REQ-056.1, REQ-062.2, REQ-064.2 · Branch: doit/TASK-1.8

## What was asked
After every playtest action, check five game invariants: chip conservation, legal action, the 4-bet cap, pot eligibility and no card dealt twice. When one breaks, the run exits 1 and shows which invariant broke, the hand's replay code and the full action history. CI runs a 10,000-hand playtest and fails if it exits non-zero. A test-only faulty engine proves each invariant can fail. Spec: doit/TASK-1.8/spec.md.

## Assumptions made without asking — please review
All are reversible. A-1..A-12 are not user-approved; only Q-1 (including A-3) was.

| ID | Assumption | Why | To reverse |
|---|---|---|---|
| A-1 | Checker lives in `src/engine/invariants.ts` (90% coverage bar, headless lint boundary) | Task note: keep it in the engine package so unit tests reuse it | Move to `src/playtest/` |
| A-2 | One `Violation` per invariant per action (first failing sub-check's message). `Invariant violations: N` counts (hand, invariant) pairs | A huge run can't be flooded by one corrupt state | Report every failing sub-check |
| A-3 | A violating hand stops; run continues; only the first violating hand is kept for printing (Part of Q-1) | Keeps TASK-1.6 "count and continue", O(1) memory | Stop whole run at first violation |
| A-4 | "Legal" = in the engine's `legalActions(before)`, right seat, bet/raise size checked independently against the street unit, history entry matches. An engine-rejected action is also `legal-action` | Engine-only legality is circular; full re-derivation would duplicate `hand.ts` and break on TASK-1.9/1.12 | Fully independent legal-set derivation |
| A-5 | `Violation.invariant` is a `string`; a custom `onAction` replaces the default, callers compose with `checkStep` | Lets TASK-6.9/E06 add checks | Fixed built-in checker plus extra hook |
| A-6 | CI step `Playtest` = `npm run playtest -- --hands 10000 --seed 42`, right after `Test` | Matches REQ-062 fit criterion; fixed seed is reproducible | Seed from `github.run_number` |
| A-7 | AC#4 proven by workflow test + in-process proof that `main` returns 1 + GitHub's non-zero-fails-job default. No deliberately failing CI branch | A rehearsal would fail at `Test` first | Add `ci-proof/TASK-1.8/playtest` branch |
| A-8 | Checks run after player actions only, not after `createHand` | Every dealt hand has a first action, which covers the deal | Also check after `createHand` |
| A-9 | "Eligible players contributed" = each eligible seat of a non-empty pot put chips in on a completed street; each award winner is eligible and contributed > $0. Exact per-pot levels wait for side pots (TASK-1.10) | One pot today | Exact levels with TASK-1.10 |
| A-10 | `final` = the state the engine returned on the violating action (corruption visible), or the last good state if it rejected | History shows the offending action | Always last good state |
| A-11 | Faults live in `tests/support/faulty-engine.ts` wrapping the real engine; the fifth-bet fault forces the bet through even after TASK-1.12 adds the cap | No test code in production | Flag in `hand.ts` (rejected) |
| A-12 | Checker budget ≤ 2 µs/action (reference Mac, Node 22.18.0); local test floor ≤ 10 µs; CI prints, does not enforce | REQ-062.5 allows 36 ms/hand | Drop speed test |

## Clarifications and decisions
- **Q-1 (user, 2026-11-18): violation output and run behaviour.** Answer: detail block, keep going. Clean-run output stays byte-identical. Only when N > 0, append a per-invariant counts line, `First violation: hand k, player action i (<action>)`, one `Violation: <id>: <message>` per broken invariant, a `Replay: npm run playtest -- --replay-code … --size … --button …` line, then `formatHand` of that hand (replay mode prints lines 1–3 only). The violating hand stops, the run continues, exit 1. This also approved the ids and messages (D-1, D-2).
- D-2: ids `chips`, `legal-action`, `bet-cap`, `pot-eligibility`, `cards` with fixed message templates (user-approved via Q-1).
- D-3: last parameter of `playHand`/`runPlaytest`/`main` is now `seams: PlaytestSeams = {}` (`makePolicy`, `onAction`, `engine`).
- D-4: `checkStep({before, action, result})` runs `legal-action`, then `checkState(result.state)` for the other four; `checkState` is exported for reuse.
- D-5: the TASK-1.7 locked `tests/ci/workflow.test.ts` was unlocked and extended (additions only, see below).
- D-6: the TASK-1.6 interim test `counts rejected actions and over-cap streets as violations` is replaced by SPEC-06 (`stops a hand at its first violation and counts per invariant`), since over-cap hands now stop.

## What was built
- `src/engine/invariants.ts` (new): `checkState`, `checkStep`, `describeAction`, `INVARIANTS`, `MAX_BETS_PER_STREET`, `Violation`/`ActionStep`. Never throws, never mutates.
- `src/playtest/runner.ts`: `PlaytestSeams` with `onAction` (default `checkStep`) and injectable `engine`; per-hand `violation`; `violationCounts` and `firstViolation` in the summary. TASK-1.6 A-4 interim checks removed.
- `src/playtest/cli.ts`: violation block (run and replay variants); `main(argv, io, seams)`.
- `.github/workflows/ci.yml`: `Playtest` step after `Test`.
- Tests: `tests/engine/invariants.test.ts`, `tests/engine/invariants.perf.test.ts`, `tests/playtest/invariants.acceptance.test.ts`, `tests/support/faulty-engine.ts` (new); `tests/ci/workflow.test.ts`, `tests/playtest/runner.test.ts`, `tests/playtest/cli.test.ts` (updated).
- No engine rule changes (`hand.ts` untouched), no new dependencies.

### The five invariants and what each catches
| Id | Catches | Fault engine that proves it |
|---|---|---|
| `chips` | Chips created or destroyed (table total ≠ starting total), street > total contribution, award totals/shares not matching contributions | `chipsCreated` |
| `legal-action` | Action not in `legalActions`, wrong seat, wrong bet/raise size for the street, history entry not matching, engine-rejected action | always-`check` fault (engine accepts an illegal check) |
| `bet-cap` | More than 4 bets/raises on a street | `fifthBet` |
| `pot-eligibility` | Pot lists/pays a seat that is folded, never contributed or not dealt in | `ineligibleWinner` |
| `cards` | Duplicate, out-of-range or wrong-count hole/board/burn cards | `duplicateCard` |

### CI Playtest step
`Playtest` runs `npm run playtest -- --hands 10000 --seed 42` after `Test`. It extends TASK-1.7's workflow test with additions only: the command is added to the ordered command list and a new SPEC-08 test asserts the step (no `continue-on-error`, `|| true` or `set +e`). Verified by review (SPEC-08 correctness and strength pass; the security review found the step a static literal with no expression interpolation). No deliberately failing CI run was made (A-7).

## How it was verified
| SPEC item | Covers | Verification | Result |
|---|---|---|---|
| SPEC-01 | Every action checked; clean run = 0 (n=3..10, plus 10,000 hands seed 42) | acceptance | pass |
| SPEC-02 | Each sub-check flags its corrupt state, clean twin passes | unit | pass (after r1 fix) |
| SPEC-03 | Each injected fault → its invariant only, exit 1; controls exit 0 | acceptance | pass |
| SPEC-04/05 | Replay code, replay command, full history; hook path | acceptance | pass |
| SPEC-06/07 | Hand stops at first violation; CLI block format | unit | pass |
| SPEC-08 | CI step present and can fail the job | workflow test | pass |
| SPEC-09 | Checker speed | perf test | 0.38 µs/action over 162,629 actions (budget 2 µs) |

- `npm test`: 44 files, 138 passed, 1 skipped. `src/engine/invariants.ts`: 100% lines, 97.24% branches. Lint, typecheck, format clean. `npm run playtest -- --hands 10000 --seed 42` → `Invariant violations: 0`, exit 0.
- Gates: build-1 PASS; fix-2 FAIL (TS2322 type error in the new K2 one-card test row); fix-3 PASS after casting via `unknown` with a comment.
- Judge: pending. CI: pending.
- Size: 11 files, 1,385 changed lines vs budget 1,150 (warn band; tests account for most of the overage).

## Review
- Round 1, code reviewer: one MAJOR. Seven sub-check clauses had no test (C1 street > total, C3 award shares, K2 hole-card count, P1 seat not dealt in, P5 winner with $0, L5 street, L5 extra record); removing any left the suite green. Fix: one corrupt-state row per clause with the exact message asserted; no checker change. Verified by re-running the seven mutants, all killed, source restored byte-identical. Security r1: no findings.
- Round 2: code reviewer found no blocking issues (MINOR/NIT below); security clean.

### Non-blocking review notes (deliberately not fixed)
- MINOR `invariants.ts` K2: a wrong hole-card count reuses the board/burn wording (`flop has 3 board and 1 burn cards`), which is misleading.
- MINOR `invariants.ts` C3: the awards message can contradict itself when award totals match but one award's winner shares don't sum to its amount.
- MINOR `invariants.ts` L4: the raise clause (`amount !== before.currentBet + unit`) is unreachable after L3 passes; the mutant removing it survives. Keep as a guard, add a comment.
- NIT `cli.ts`: defensive `hand === null || hand.violation === null` guard cannot be hit (only uncovered branch).
- NIT `cli.ts`: `actionText` duplicates `describeAction` wording; they can drift.
- NIT `invariants.test.ts`: the P1 mutant is caught by a TypeError from P3's cast rather than an assertion mismatch.

## How to try it
- `npm run playtest -- --hands 10000 --seed 42` (expect `Invariant violations: 0`, exit 0)
- `npx vitest run tests/engine/invariants.test.ts tests/playtest tests/ci/workflow.test.ts`
- `npm test`

## Run metrics
Questions 1 · assumptions 12 · review rounds 2 · judge rounds 0 so far (pending) · gate runs 3 (1 failure) · escalations 0 · changed lines 1,385 (budget 1,150).

## Known limitations and follow-ups
Not created yet; the orchestrator turns each into a task or AC.
- TASK-1.9: extend legal-action and chip checks for all-in calls and uncalled bets.
- TASK-1.10: make pot-eligibility check exact per-pot contribution levels and side-pot layers.
- TASK-1.12: add a fifth-raise unit test; keep the bet-cap check independent of the engine cap; drop the policy's `betCount` filter.
- TASK-1.16: add the cross-hand chip conservation check.
- TASK-1.17: combine `violationCounts` across shards.
- TASK-6.9: add style checks via `onAction` composed with `checkStep`.
- New task: add a deal-order invariant (cards come from the right deck positions, D-5), currently only uniqueness/range/counts.
- TASK-1.26 (existing): add `src/playtest` to `HEADLESS_DIRS`.
- New task (needs user approval, since D-2 messages were approved): reword K2 to say hole cards, and fix the C3 awards message so it cannot contradict itself.
- New task: comment the L4 raise clause as a guard against future `legalActions` changes.
- New task: have `cli.ts` `actionText` delegate to `describeAction`; remove the unreachable null guard in the violation block; make the P1 test row assert rather than throw.

## Lessons for the factory (proposals — not applied)
- The build wrote the SPEC-02 rows for the sub-checks but skipped seven clauses; the review caught it via mutants. Proposal: have the builder run a mutation pass over every spec-listed clause before review, since this one MAJOR cost a fix round.
- A gate failed on a type error in a hand-built test row that the build-time typecheck did not catch before the gate. Proposal: run `npm run typecheck` after each test-file edit in the fix step, not only at the end.
- Scope came in 20-25% over budget (spec estimated test files low). Proposal: have the spec template size test files from the sub-check count.
