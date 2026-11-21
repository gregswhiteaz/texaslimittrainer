---
id: doc-53
title: 'TASK-7.20: Pin the preflop chart validator''s edge cases'
type: other
created_date: '2026-11-21T03:03:00Z'
updated_date: '2026-11-21T03:03:00Z'
---
# TASK-7.20: Pin the preflop chart validator's edge cases

Status: Done · Completed: 2026-11-20 · Epic: TASK-7 — Get trustworthy advice · Milestone: m-0 · Requirements: n/a (follow-up from TASK-7.2 reviews) · Branch: doit/TASK-7.20

## What was asked
Three loose ends in `src/advice/preflop-chart.ts`: (1) pin that a justification word is a run of letters (kills the `/\S+/` mutant of `wordCount`); (2) document and test `chartCell`'s `RangeError('Unknown hand class <hc>')`; (3) cut tokens and spot names echoed by `parseChart` to 20 characters. Spec: doit/TASK-7.20/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | "Cut to 20" = first 20 characters, plus `...` only when something was cut | yes | Same shape as `echoText` in the engine | Change `echo()` |
| A-2 | Spot name is cut as one string ("position situation"), not per part | yes | The message echoes the key as one value | Cut each part |
| A-3 | Only the "does not apply" message echoes an untrusted spot name; other spot messages use valid keys (at most 19 chars) | yes | Keys come from `APPLICABLE_SPOTS` | Wrap every key |
| A-4 | Length counted in UTF-16 code units | yes | Consistent with `echoText`; bundled data is ASCII | Code-point slicing |
| A-5 | Letter-run test covers both chart-level (50 words) and spot-level (15 words) justification | yes | One `wordCount` guards both | n/a |
| A-6 | Local `echo` helper instead of widening `echoText` | yes | Keeps change in one module | Add a limit parameter to `echoText` |

## Clarifications and decisions
No questions (autopilot). D-1: AC#1 met by tests only; `wordCount` unchanged. D-2: cut format per A-1. D-3: all new tests in one new acceptance file, so locked TASK-7.2 tests stay untouched.

## What was built
- `src/advice/preflop-chart.ts`: `ECHO_CHARS = 20` and private `echo()`, applied to `invalid action`, `invalid alternative` and `spot ... does not apply`; `chartCell` JSDoc now lists both `RangeError`s. Behaviour and messages otherwise unchanged.
- `tests/advice/preflop-chart-edges.acceptance.test.ts` (new): SPEC-01..05.
- Not truncated: `unknown reference size "<value>"` (out of the AC).

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..02 | Numeric/punctuation justification rejected (chart and spot); shipped chart still validates | acceptance tests | PASS | 12 asserts, 0 skips |
| SPEC-03..04 | Unknown hand class RangeError pinned by message and documented | acceptance tests | PASS | judge round 1 |
| SPEC-05 | Token and spot-name echo cut at 20 chars (20 unchanged, 21+ cut with `...`) | acceptance tests | PASS | judge round 1 |
- `npm test`: 107 files passed, 376 tests passed, 6 skipped. Gates build-1 and fix-2 PASS.
- Judge: round 1 PASS, no failed or unproven items.

## Review
No blocking findings. 1 review round, 0 send-backs.

### Non-blocking review notes (deliberately not fixed)
- Code NIT: SPEC-03 test uses a manual try/catch plus two expects where `toThrow(new RangeError(...))` would do. Correct as written.
- Security NIT: `unknown reference size` message still echoes its value uncut. Only the bundled chart reaches `parseChart`, so no untrusted input gets there.
- Security NIT: `echo()` cuts by UTF-16 units (can split a surrogate pair) and passes control characters through. Grid tokens contain no whitespace; bundled data is ASCII.

## How to try it
`npx vitest run tests/advice/preflop-chart-edges.acceptance.test.ts`

## Run metrics
Questions 0 · assumptions 6 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · changed lines 153.

## Known limitations and follow-ups
- The three NITs above only matter if `parseChart` ever accepts user-supplied charts. If that is added, then truncate the reference-size echo, slice by code point, and strip control characters in `echo()`. [trainer] Not tracked now; condition recorded here.

## Lessons for the factory (proposals — not applied)
None; the run was smooth.
