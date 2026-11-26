# TASK-7.30: Tidy observed-range helpers: exact zero width and one template filler

Status: Done · Completed: 2026-11-26 · Epic: TASK-7 — Get trustworthy advice · Milestone: m-1 · Requirements: n/a (follow-up from TASK-7.13, doc-104) · Branch: doit/TASK-7.30

## What was asked
Two clean-ups left by TASK-7.13. (1) `scaledWidthPct` gave about 3.55e-15 instead of exactly 0 for a 6-max CO open-raiser seen for 100 hands with PFR 0 (floating-point rounding). (2) `basisText` filled its `{hands}` placeholder with `String.replace`, so the advice code had two template fillers. Spec: doit/TASK-7.30/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Exact zero comes from an early return `if (n >= OBSERVED_FULL_HANDS) return o;`. Below 100 hands the arithmetic is unchanged. | yes | Smallest change; fixes all 18 default ranges that drifted (-7.1e-15 to 1.4e-14) and moves no width below 100 hands. | Use `d*(1-t)+o*t` (moves widths by a few ulps) or round |
| A-2 | "Template filler" means placeholder filling only. The `POT_ODDS_LEAD` to `POT_ODDS_RIVER_BET_LEAD` swap in `explain.ts` fills nothing, so it stays. | yes | Matches the TASK-7.13 review finding. | Make it a `{potOddsLead}` placeholder |
| A-3 | Playtest SHAs live in build-log.md, not in a test or doc (as TASK-7.28). | yes | Existing convention. | Docs table of SHAs |

## Clarifications and decisions
No questions asked. `fillTemplate` moved into `explanations.ts` (not `basisText` into `explain.ts`) so the range model does not depend on the explanation layer again (TASK-7.13 D-1).

## What was built
- `src/advice/ranges.ts`: `scaledWidthPct` returns `o` exactly from 100 hands; `Math.min` dropped as redundant.
- `src/advice/explanations.ts`: now holds `fillTemplate` (moved unchanged); `basisText` uses it.
- `src/advice/explain.ts`: drops its own `fillTemplate` and the unused `CONCEPTS` import; imports and re-exports `fillTemplate`, so importers are unchanged.
- Tests: new `tests/advice/observed-range-tidy.acceptance.test.ts`; additions to `observed-ranges.test.ts` and `explain.test.ts`.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01, 02 | AC#1, AC#2 | New acceptance file (2 tests) | Pass | build-log.md |
| SPEC-03 | exact stat from 100 hands, all default ranges | unit sweep, pinned at 3 sizes / 102 ranges after review | Pass | observed-ranges.test.ts |
| SPEC-04 | one filler in src/advice | unit test in explain.test.ts | Pass | explain.test.ts |
| SPEC-05 | no behaviour change | playtest and `--check-advice` SHAs before/after | Identical | build-log.md |

- `npm test`: 329 files passed, 1466 tests passed (52 skipped); typecheck, lint and format clean. Gates: build-1 and fix-2 PASS.
- Playtest (10000 hands, seed 42) SHA `f6c8d172...7cbc` unchanged, 0 invariant violations. Advice check (3000 hands): 26503 decision points, 0 mismatches, SHA `1b057087...f40b` unchanged.
- Judge round 1: PASS, 5/5, no findings.

## Review
No blocking findings.

### Non-blocking review notes
- MINOR (fixed by the orchestrator): the SPEC-03 sweep did not pin its size; it now asserts 3 sizes and 102 ranges.

## How to try it
`npx vitest run tests/advice/observed-range-tidy.acceptance.test.ts`; `npm run -s playtest -- --check-advice --hands 3000 --seed 42`.

## Run metrics
Questions 0 · assumptions 3 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · changed lines about 210 (budget 140; warn band).

## Known limitations and follow-ups
- Spec said 90 default ranges; `DEFAULT_RANGES` holds 102 (spec wording only; the sweep now pins 102).
- No follow-ups.

## Lessons for the factory (proposals — not applied)
- Scope estimates for acceptance files should count the helper copies a locked-file pattern requires (114 lines vs 60 estimated caused the budget overrun). Spec authors should also check counts such as "90 ranges" against the code.
