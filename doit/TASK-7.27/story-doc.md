# TASK-7.27: Print the heads-up and full-ring charts for review

Status: Done · Completed: 2026-11-26 · Epic: TASK-7 — Get trustworthy advice · Milestone: m-1 · Requirements: n/a (follow-up of TASK-7.6) · Branch: doit/TASK-7.27

## What was asked
`npm run chart:print` printed only the 6-max chart, as grids without justifications. The heads-up and full-ring charts written in TASK-7.6 still needed the user's review. The task adds a size argument so each chart can be printed with its justifications. Spec: doit/TASK-7.27/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | With no argument the output is unchanged (6-max, grids only, no justifications). | yes | The locked TASK-7.19 test pins it byte for byte. | Change the default, with an approved edit to the locked test. |
| A-2 | With an explicit size (including `6-max`) the output is the review format: a header, the chart justification, then each spot's grid and a `Why:` line. | yes | The AC asks for a grid with its justification when a size is given. | Print justifications always, or add a `--why` flag. |
| A-3 | An unknown size or more than one argument writes two lines to stderr, nothing to stdout, and exits 2. | yes | Matches the playtest CLI's usage-error convention. | Exit 1, or ignore extra arguments. |
| A-4 | Size names are exact and case-sensitive: `heads-up`, `6-max`, `full-ring`. The lookup uses `Object.hasOwn`, so `toString` counts as unknown. | yes | One spelling, as in the code. | Accept aliases or ignore case. |
| A-5 | Justifications print on one line each, without wrapping. | yes | Every stored justification is a single line. | Wrap at 100 columns. |

## Clarifications and decisions
No questions were asked.

## What was built
- `src/advice/chart-print.ts`: new `formatChartForReview(chart)` and `chartPrintMain(argv, io)`, which handles the argument, the error text and the exit code.
- `tools/chart-print/main.ts`: now a thin entry that calls `chartPrintMain`, like `tools/playtest/main.ts`.
- Tests: `tests/advice/chart-print-sizes.acceptance.test.ts` (spawns the real npm script) and `tests/advice/chart-print-review.test.ts` (in-process unit tests).
- No `package.json` change. No chart JSON change. The locked TASK-7.19 test is untouched.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..07 | size argument, review format, unchanged default, error handling | the acceptance test spawns the real script; the unit test calls the functions in-process | PASS (7/7) | judge/verdict, gates/build-1.json |

- Gate: `npm test` passed (build run 1). Judge round 1 passed with no item failures. Review ran 1 round with no blocking findings.

## Review
No blocking findings.

### Non-blocking review notes (deliberately not fixed)
- NIT: some type casts in the code or tests.
- NIT: the change is 236 lines against a budget of 230.

## How to try it
```
npm run chart:print -- heads-up
npm run chart:print -- 6-max
npm run chart:print -- full-ring
npm run chart:print            # unchanged, 6-max grids only
```

## Run metrics
Questions 0 · assumptions 5 · review rounds 1 · judge rounds 1 · gate runs 1 · escalations 0 · changed lines 236 (4 files).

## Known limitations and follow-ups
- Out of scope: `--help`, a spot filter, Markdown output, text wrapping and size aliases.
- Follow-up: [trainer] the user reviews the heads-up and full-ring chart content with the new command. Any changes would go to TASK-7.6's charts (owner: TASK-7).

## Lessons for the factory (proposals — not applied)
None. The run was clean.
