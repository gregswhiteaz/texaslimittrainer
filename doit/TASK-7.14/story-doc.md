# TASK-7.14: Check advice against postflop golden spots on every test run

Status: Done · Completed: 2026-11-23 · Epic: TASK-7 — Get trustworthy advice · Milestone: m-1 · Requirements: REQ-037, REQ-038, REQ-039, REQ-061 · Branch: doit/TASK-7.14

## What was asked
As a learner, I want the postflop advice checked on every test run against curated spots with agreed answers. This is part 2 of the golden-spot suite. It adds at least 100 postflop spots (flop, turn, river), which brings the suite to at least 200. It also adds graded examples of each grade level. "Clear-cut" means call/fold spots at least 10 points from the required equity, and bet/check spots at least 15 points from 50%. It also settles three preflop spot follow-ups from TASK-7.11 (AC#7-9). Spec: doit/TASK-7.14/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Postflop spots are advised exactly as the app advises the user: `recommendPostflop(view, { opponentRanges: 'actions', observedOpponents })`. | yes | The suite should protect the advice the learner sees. | Use `recommend(view)` (bot path). |
| A-2 | A postflop spot's optional `opponentStats` maps a seat to `{ hands, vpip, pfr }` (hands an integer >= 0, vpip/pfr 0-100). Other keys are a problem. | yes | The advice really reads these stats. | Accept and ignore unknown keys. |
| A-3 | Target 120 postflop spots (flop 45, turn 40, river 35), mostly 6-max, at least 12 each of heads-up and full ring, at least 10 of each action, at least 15 multiway. Tests enforce only the floors: >= 100 postflop, >= 1 per street, >= 1 per action, >= 200 total. | yes | 6-max is where action-based ranges exist. | An even split by table size. |
| A-4 | Postflop justifications: at least 15 words, at most 3 sentences, name a listed concept, distinct across both files. They need not name the hand class. | yes | Same teaching standard as REQ-037. | Also require a board or hand mention. |
| A-5 | Postflop spots record no `alternative` (the engine returns none). The format still accepts one. | yes | Keeps the format uniform. | Forbid it. |
| A-6 | Graded examples live in `tests/golden/graded-examples.json`, outside the 200 count and exempt from the clear-cut rule. Nine examples. Every postflop one uses a spot with exact equity enumeration so margins are stable. | yes | Minor examples are close calls, so they cannot be golden spots. | A `graded` array in each spot file. |
| A-7 | AC#9 replacements: `fr-co-limpers-87s` becomes `fr-co-limpers-44` (call), and `fr-sb-unopened-65s` becomes `fr-sb-unopened-kjs` (raise). No chart change is needed. | yes | The TASK-7.11 judge's first option. | Keep both spots and add chart justifications for the connector "islands". |
| A-8 | A chart cell's neighbours: adjacent pairs for a pair, otherwise grid-adjacent cells of the same suitedness (excluding pairs). | yes | Matches the TASK-7.11 judge's reading. | Include diagonal connectors. |

## Clarifications and decisions
Questions are auto-accepted under the user's unattended rule. Please review these two.
- **Q-1 (auto-accepted, changes user-facing advice).** In `src/advice/charts/full-ring.json`, the full-ring BTN facing a single raise now re-raises with 99 and 88 (was call). 77 stays a call. This fits the chart's isolate-and-charge-the-blinds policy, and set-mining odds are small in limit. `fr-btn-raise-88` is recorded as raise.
- **Block 1 (auto-accepted, cross-story locked edit).** `tests/golden/preflop-spots.json` is locked under TASK-7.11. It was unlocked with the reason "TASK-7.14 Q-1, AC#7-9". It stays at 110 spots. Only four spots changed: `fr-btn-raise-88` (action and justification), `fr-hj-raise-and-calls-ajs` (justification), `fr-co-limpers-87s` becoming `fr-co-limpers-44`, and `fr-sb-unopened-65s` becoming `fr-sb-unopened-kjs`.

Decisions:
- **D-1:** The format stays `tlh-golden-spots` v1, extended additively. Postflop spots add `board` and `street` and live in their own file. The preflop parser and type are unchanged.
- **D-2:** The clear-cut rule is that every other legal action must grade as a Major error via `gradeDecision`. This reproduces the 10-point and 15-point rules.
- **D-3:** Margins are measured with the same advice the runner checks, memoised per spot view.
- **D-4:** Robustness comes from deterministic seeds plus the margins, which are at least 6 times REQ-034's 1.5-point bound.
- **D-5:** The AC#7 chart change (Q-1).
- **D-6:** Graded examples compare grade, rule id and margin exactly.

## What was built
- `src/advice/golden.ts`: board-aware dealing and street-aware views. It adds `parsePostflopGoldenSpots`, a memoised `goldenPostflopAdvice`, and the clear-cut check. `checkGoldenSpot` now handles both spot kinds. It also adds `parseGradedExamples` and `checkGradedExample`. Shared helpers were extracted, and preflop behaviour is unchanged.
- `src/advice/charts/full-ring.json`: BTN vs single raise, 99 and 88 changed from call to raise, and the spot justification was updated.
- `tests/golden/postflop-spots.json` (new): 120 authored spots. By street: 45 flop, 40 turn, 35 river. By table: 86 6-max, 18 heads-up, 16 full ring. 20 are multiway and 4 use observed opponent stats.
- `tests/golden/graded-examples.json` (new): 9 graded examples.
- `tests/golden/postflop.acceptance.test.ts` and `suite.acceptance.test.ts` (new): locked acceptance tests.
- `tests/golden/postflop-golden.test.ts` (new): unit tests with stubbed advice, plus one heads-up river spot.
- `tests/golden/preflop-spots.json` (modified, see Block 1) and `docs/advice/golden-spots.md` (postflop format, clear-cut rule with worked examples, graded examples).
- No new dependencies, scripts or CI changes.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..05, 10 | At least 100 postflop spots, per-street and per-action floors, at least 200 in total, clear-cut rule, justifications | `postflop.acceptance.test.ts` (126 tests, one per spot) | PASS | The judge counted 120 postflop spots (bet 23, check 23, call 27, fold 23, raise 24) plus 110 preflop. An independent rebuild of all 120 views confirmed every spot is clear-cut (minimum margins 10.0 and 15.2). |
| SPEC-06..09 | Graded examples, AC#7, AC#8, AC#9 | `suite.acceptance.test.ts` | PASS | Graded examples match the app's grade path exactly. `fr-btn-raise-88` is advised raise. |
| SPEC-11..13 | Parser, validator and graded-example behaviour | `postflop-golden.test.ts` | PASS | `golden.ts` has 99.62% line coverage from unit tests alone. |
| SPEC-14..18 | Gates, lint, typecheck, docs, no tampering | Gates and judge | PASS | See below. |

- `npm test` passed 1159 tests with 0 failed (3 files and 41 tests skipped, all pre-existing opt-in slow tests). `npm run lint`, `typecheck` and `test:unit` all exit 0.
- The golden suite (5 files, 282 tests) runs in about 1.4 s.
- Scratch mutations fail with the exact messages: flipping a bet spot to check gives "Golden spot 6max-flop-co-bet-76o: expected check, got bet", and shifting a graded margin gives the exact expected-versus-got message.
- The playtest of 10000 hands (seed 42) reported 0 invariant violations. CI was green on b857384.
- Judge round 1: 18/18 PASS, no failures and no blocking findings. Gate runs: 6 (build and fix-2..fix-6, all passing).

## Review
Three rounds. The security reviewer reported nothing in any round. All blocking findings were about the factual accuracy of authored justification text. The recorded actions were never wrong.
- Round 1 MAJOR: several justifications misnamed the hero's made hand (for example "second pair" or "bottom pair" of sevens when it was bottom or third pair). The fix was applied to 11 spots.
- Round 1 MAJOR: a graded example called a gutshot (4 outs) an open-ender. It was renamed `graded-postflop-fold-minor-6max-flop-gutshot` and the text corrected.
- Round 2 MAJOR: `6max-turn-btn-bet-94o` had a wrong trailing-hands clause, and `hu-river-bb-call-tt` had a wrong missed-draws clause. Both were fixed and round 3 passed.

### Non-blocking review notes (deliberately not fixed)
- MINOR `hero-preflop-lines-contradict-chart`: many spots reach the decision through hero preflop actions that the project's chart grades as Major errors. Examples are UTG opening 92o, 82o, T4o, K3o and K2o, CO opening 72o and 83o, and the BB only calling an SB raise with AA. Some justifications lean on those lines.
- MINOR `minor-imprecise-justifications` (round 1): small inaccuracies. `6max-turn-bb-raise-92o` omits 44 (fours full), `6max-flop-utg-fold-a3o` misses the backdoor flush, and `6max-river-co-bet-ajo` misdescribes the betting line. Whether these were all corrected is not stated in the round 2 and 3 reviews.
- NIT `street-of-board-index-trick` (`src/advice/golden.ts:247`): `STREETS[Math.max(0, length - 2)]` is hard to read. An explicit lookup is clearer.
- NIT `grade-throw-escapes-validation` (`src/advice/golden.ts:510`): a RangeError from `gradeDecision` on non-finite advice escapes `parsePostflopGoldenSpots` instead of being listed as a problem. The real engine never returns NaN.
- Judge phrasing nit: in `6max-turn-bb-raise-92o`, "set of kings" should read "kings full".

## How to try it
- `npm test` runs everything, golden suite included (on CI it runs via `test:unit` and `test:sweeps`).
- `npx vitest run tests/golden/` runs just the golden suite, about 1.4 s.
- `docs/advice/golden-spots.md` describes the spot format.

## Run metrics
Questions: 1 (auto-accepted) · assumptions: 8 · review rounds: 3 · judge rounds: 1 · gate runs: 6 · escalations: 0 · one blocked event (locked preflop file, resolved) · changed lines: 6858 insertions and 92 deletions across 33 files (including doit artifacts).

## Known limitations and follow-ups
- [trainer] Replace hero preflop lines that contradict the chart (UTG 92o/82o/T4o/K3o/K2o opens, CO 72o/83o opens, BB calling an SB raise with only AA) with chart-consistent lines in `tests/golden/postflop-spots.json`. This matters for a trainer because the spots teach the whole line. Alternatively, add a docs note that spots are about the postflop decision only. No owning task known.
- [trainer] Replace the `street-of-board-index-trick` in `src/advice/golden.ts` with an explicit lookup. This is a NIT.
- [trainer] Move the `clearCutProblems` call inside the try block in `parsePostflopGoldenSpots`, so a `gradeDecision` RangeError is reported as a problem. This is a NIT.
- [trainer] Change "set of kings" to "kings full" in the `6max-turn-bb-raise-92o` justification.
- [trainer] Re-record the graded postflop margins and the heads-up and full-ring spots when TASK-7.26 (default ranges for heads-up and full ring), TASK-7.28 (straight-draw outs) and TASK-7.18 land. Their numbers may shift. Heads-up and full-ring spots use every unseen combo until TASK-7.26.
- For user review: Q-1 (full-ring BTN 99/88 vs single raise now raise, changes user-facing advice) and the TASK-7.11 locked-file re-pin.

## Lessons for the factory (proposals — not applied)
- Authored teaching text needed three review rounds, and the round 1 fix brief's "check every justification" pass still missed two errors. Propose a mechanical or independent fact-check of hand-class and draw wording (made-hand name, outs, kickers) before the first review when a story authors many justifications.
- The spec already knew the story must edit a locked TASK-7.11 fixture, yet the build still hit a block (`blocked-1`) and needed a mid-build unlock. Propose that the spec stage pre-lists locked-file edits and requests the unlock before build starts.
- Carried-over MINOR and NIT findings were repeated unchanged in rounds 2 and 3. Propose that the fix brief explicitly state which MINORs are deferred, so reviewers stop re-reporting them.
