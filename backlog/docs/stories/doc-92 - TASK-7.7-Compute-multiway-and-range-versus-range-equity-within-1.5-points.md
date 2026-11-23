---
id: doc-92
title: 'TASK-7.7: Compute multiway and range-versus-range equity within 1.5 points'
type: other
created_date: '2026-11-23T03:13:00Z'
updated_date: '2026-11-23T03:13:00Z'
---
# TASK-7.7: Compute multiway and range-versus-range equity within 1.5 points

Status: Done (pending judge) · Completed: 2026-11-22 · Epic: TASK-7 · Milestone: m-1 · Requirements: REQ-034 (034.1, 034.2, 034.3) · Branch: doit/TASK-7.7

## What was asked
Prove that `computeEquity` (TASK-7.1) stays within 1.5 points of a reference on multiway and range-versus-range spots, on boards of 0, 3, 4 and 5 cards. Combined with 7.1's reference set there must be at least 200 matchups, and listing opponent ranges in a different order must give an identical result. Spec: doit/TASK-7.7/spec.md.

## Assumptions made without asking — please review
No questions were asked. All of these are reversible.
| ID | Assumption | Why | To reverse |
|---|---|---|---|
| A-1 | "Range-versus-range" = hero's known hand vs 1-4 opponents who each hold a range. No hero-range API added. | Postflop advice always knows hero's hand; avoids a public interface change. | Add `hero: Range` and average over hero combos. |
| A-2 | New, separate generator and fixture; 7.1's fixture and tests untouched. | 7.1's tests assert every stored case is exhaustive with an empty board. | Append to `equity-reference.json` (breaks 7.1 tests). |
| A-3 | Generator expands ranges with `parseHandRange`/`expandRange`/`unseenCombos` from `src/advice/ranges.ts`; never imports `equity.ts`. | Independence is required from the equity code, not the range parser. | Write a second range parser. |
| A-4 | Method rule: exhaustive if live-combo product x C(unseen, 5 - board) x players <= 100,000,000; otherwise 2,000,000 seeded trials (standard error <= ~0.035 pp). | Keeps generation to about a minute. | Raise the limit or trial count. |
| A-5 | Mix per board size (0/3/4/5): 10 multiway known-hand cases (3-6 players) + 20 range cases (1-4 range opponents, fixed palette of 6). 120 total; 241 with 7.1's. | Even coverage, margin over 200. | Change the case list. |
| A-6 | All new tests run on every push (not slow/opt-in). | Measured about 2.4 s for the new files. | Move a subset to opt-in. |
| A-7 | Opponents with identical canonical ranges can be swapped; k-th listed gets k-th canonical result. | Existing `canonicalise` behaviour. | Average equal-range results (changes 7.1 output). |

## Clarifications and decisions
None asked. D-1 (rejection weighting for overlapping opponent ranges) is in the spec.

## What was built
No change to `src/`. Accuracy and determinism come from the existing `src/advice/equity.ts`; this story adds the evidence.
- `tools/equity/generate-multiway-reference.js`: offline generator. Seeded case list (`MULTIWAY_CASES`), `RANGE_PALETTE`, `resolveOpponent`, `estimateEvaluations`, `computeReference` (exhaustive or 2M-trial high-sample). Writes the fixture.
- `tests/advice/fixtures/equity-multiway-reference.json`: 120 committed cases (30 per board size). 84 exhaustive, 36 high-sample. Each records its method, combos and trials.
- `tests/advice/equity-multiway.acceptance.test.ts`: locked every-push tests for AC#1-3 (SPEC-01..04).
- `tests/advice/equity-multiway-reference.test.ts`: fixture consistency and reproducibility, sampler determinism, impossible-deal error (SPEC-05).
- `tools/equity/generate-reference.js`: `cardText` and `mulberry32` now exported; no behaviour change.

### Regenerating the fixture
```
node tools/equity/generate-multiway-reference.js
git diff --exit-code tests/advice/fixtures/equity-multiway-reference.json
```
Takes about 64 s (64.2 s measured). Reproducible: a second run gave an identical fixture (sha1 47dbfd06...), so the diff is empty. No network needed.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | Every player in all 120 cases within 1.5 pp of reference | Pass, largest error 0.870 pp (rr-b5-04) | acceptance test log |
| SPEC-02 | AC#2 | Both sets total >= 200 matchups, method recorded | Pass, 241 matchups | acceptance test |
| SPEC-03/04 | AC#3 | Reordered ranges give identical results; equal-range swap | Pass | acceptance test |
| SPEC-05 | consistency | Fixture sums, rounding, regeneration match | Pass | unit test |
| SPEC-06 | checks | format, lint, typecheck, network grep | Pass, no network matches | gates/build-1.json, fix-2.json |
| SPEC-07 | process | playtest, CI, story doc | Playtest and CI not in the artifacts I read; story doc published here | - |

- `npm test`: 198 files passed / 2 skipped, 707 tests passed / 14 skipped. New tests: 7 passed in 2.42 s. Gates: build #1 and fix #2 PASS (812 changed lines vs 750 budget: warn).
- Judge: see doit/TASK-7.7/judge/.

## Review
Round 1: 0 blocking findings (code and security). Security reviewer: test data and tooling only, no trust boundary.

### Non-blocking review notes (deliberately not fixed)
- MINOR: the consistency test does not check each case's method against the A-4 rule; only `mw-*` are asserted exhaustive. A hand-relabelled method would pass.
- MINOR: change is 812 lines against a 750 budget (generator 371 lines vs ~260 estimated).
- NIT: the acceptance test's `resolve()` duplicates the generator's `resolveOpponent`; intentional, keeps the locked test independent of `tools/`.
- NIT: spec rule 4 says preflop range cases are high-sample, but rr-b0-05 and rr-b0-17 are exhaustive (82.2M and 68.5M evaluations, both <= 100M). Correct under A-4. Split: 18 preflop range cases high-sample.

## How to try it
```
npx vitest run tests/advice/equity-multiway.acceptance.test.ts tests/advice/equity-multiway-reference.test.ts
node tools/equity/generate-multiway-reference.js
```

## Run metrics
Questions 0 · assumptions 7 · review rounds 1 · judge rounds: see judge/ · gate runs 2 · escalations 0 · changed lines 812 (5 files).

## Known limitations and follow-ups
Follow-ups: none. Hero is always a known hand (A-1).

## Lessons for the factory (proposals — not applied)
- The spec's line estimate (750) was exceeded by about 8%; estimates for generators with a case list and helpers could be higher. Minor.
