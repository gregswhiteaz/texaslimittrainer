# TASK-7.11: Check advice against preflop golden spots on every test run

Status: Done · Completed: 2026-11-23 · Epic: TASK-7 — Get trustworthy advice · Milestone: m-1 · Requirements: REQ-039, REQ-037, REQ-061, REQ-063 · Branch: doit/TASK-7.11

## What was asked
A learner wants preflop advice checked on every test run against curated spots with agreed answers, so that it never silently changes. Part 1 of the golden-spot suite: a spot format, a validator, a runner wired into `npm test`, and at least 100 preflop spots across heads-up, 6-max and full ring. Each spot records the player view, optional opponent stats, the recommended action, an optional acceptable alternative and a written justification. Only clear-cut spots (chart cells not flagged borderline); all text written for this project. Spec: doit/TASK-7.11/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Every spot uses fixed stakes 2/4, seats 1..n, button seat 1, stacks 160. Format constants, not per-spot fields. | yes | Same table as the table-size tests; preflop chart advice ignores stakes and stacks. | Add per-spot `stakes`/`stacks` fields in v2. |
| A-2 | Justifications follow the advice-explanation rules: at least 15 words, at most 3 sentences, naming a listed concept. | yes | Consistent with REQ-037; helpers already exist. | Words-only minimum. |
| A-3 | 110 spots: heads-up 20, 6-max 42, full ring 48. Tests enforce only the floor (100 total, at least one per applicable size/situation pair). | yes | Covers every chart situation at every size. | Exactly 100, or an even split. |
| A-4 | "Clear-cut" beyond the borderline flag: authors pick hands far from the chart's action boundary. Validator enforces only "not a borderline cell". | yes | REQ-039.3; borderline flag is the only machine-checkable signal. | Also reject cells next to a borderline cell. |
| A-5 | `opponentStats` is optional, shape-validated, contents unused; no preflop spot sets it. | yes | Stat set arrives with TASK-7.12. | Drop it from v1. |
| A-6 | Runner calls `recommend(view)` with no options. | yes | This is the user-facing preflop path. | Pass `ACTION_RANGE_ADVICE` (no effect preflop). |

## Clarifications and decisions
- Q-1 (auto-accepted, recommended): compact `tlh-golden-spots` v1 format. Each spot stores seat count, hole cards and the preflop actions before the decision, plus position and situation as cross-checks; the validator rebuilds the full `PlayerView` with the engine (D-1). Full per-spot PlayerView JSON would be about 16k lines and easy to make inconsistent.
- Q-2 (auto-accepted, recommended): spots are literal authored JSON with individually written justifications, no generator (D-3). A generator reading the chart would re-derive answers from the code under test.

## What was built
- `src/advice/golden.ts` (new): format constants, `parseGoldenSpots` validator (collects every problem into a `GoldenSpotValidationError`, rejects borderline cells), `checkGoldenSpot` runner check, `sentencesOf` and `namedConcepts` helpers. `echo()` shows only strings and numbers, other values as `<array>`/`<null>`/`<object>`/`<boolean>`, truncated.
- `tests/golden/preflop-spots.json` (new): 110 authored spots.
- `tests/golden/preflop.acceptance.test.ts` (new, locked): SPEC-01..08, one agreement test per spot.
- `tests/golden/golden-spots.test.ts` (new): validator, helper and view-construction unit tests.
- `docs/advice/golden-spots.md` (new): format, constants, field rules, clear-cut rule, how to add a spot, how the suite runs, failure message, originality statement (SPEC-13).
- No new dependencies. Runs as part of `npm test`.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..08 | completeness, incomplete-spot failures, npm test inclusion, per-spot agreement, mismatch message, count/coverage, borderline rejection, justification rules | locked acceptance file | Pass | tests/golden/preflop.acceptance.test.ts |
| SPEC-09, 10 | every validator problem text, stats, helpers, view construction at 3 sizes, echo hardening | unit tests | Pass | tests/golden/golden-spots.test.ts |
| SPEC-13 | documentation | manual read of docs/advice/golden-spots.md; story doc published | Pass | this doc |
| Gate | test, lint, typecheck | gates/build-1, fix-2..4 | PASS (scope warn: 2044 vs 1900 lines) | doit/TASK-7.11/gates/ |

- `npx vitest run tests/golden/`: 2 files, 136 passed. Playtest data SHA unchanged (14d746f7…2e48).
- Judge: see doit/TASK-7.11/judge/.

## Review
Round 1 had 5 MAJOR (non-clear-cut spots or wrong poker reasoning), all fixed by replacing 10 spots and rewording 1 (the 11 below). Round 2: no blocking findings.

| Old spot | New spot | Why |
|---|---|---|
| hu-bb-re-raise-92o (fold) | hu-bb-re-raise-aa (raise) | Folding to a 5:1 price was wrong; hero had raised trash |
| 6max-bb-re-raise-98o (fold) | 6max-bb-re-raise-aa (raise) | Same |
| fr-bb-re-raise-87s (fold) | fr-bb-re-raise-ajs (call) | Same; text argues from the real 22-chip pot |
| hu-btn-raise-72o (fold) | hu-btn-raise-k7o (call) | 3:1 in position is not a clear fold |
| hu-btn-raise-93o (fold) | hu-btn-raise-j9s (call) | Same |
| hu-bb-blind-defence-82o (fold) | hu-bb-blind-defence-j6o (call) | Heads-up BB defends wide at 3:1 |
| hu-bb-blind-defence-93o (fold) | hu-bb-blind-defence-aks (raise) | Same |
| 6max-btn-raise-kts (call) | 6max-bb-blind-defence-kts (call) | KTs sat between differing chart actions |
| fr-hj-raise-and-calls-33 | fr-hj-raise-and-calls-ajs (call) | Clearer neighbours |
| fr-co-raise-and-calls-a7s | fr-co-raise-and-calls-ats (call) | Clearer neighbours |
| fr-sb-blind-defence-k9s (id kept) | raiser changed from button to UTG | "Dominated" is only true against an early opener |

Also reworded: hu-btn-unopened-72o ("one of the weakest starting hands"), fr-lj-raise-ako (no "well ahead"). Security MINOR (echo could throw a TypeError on `{"toString":0}`) fixed, with a unit test. Round 2 security: no findings.

### Non-blocking review notes (deliberately not fixed)
- MINOR: fr-hj-raise-and-calls-ajs and fr-co-raise-and-calls-ats have offsuit twins (AJo, ATo) that fold, so not every neighbour calls. Suited/offsuit is a natural boundary; both calls are sound.
- MINOR: the AJs justification text overstates how often the opener holds weaker aces (wording).
- MINOR: fr-btn-raise-88 flat-calls 88 on the button vs a hijack open, citing implied odds. The chart neighbours (99, 77) agree, but many players re-raise here.
- MINOR: `isRecord` and `wordCount` in golden.ts are still private copies of helpers in preflop-chart.ts and ranges.ts; the other copies still call `String(value)` on untrusted values.
- NIT: 6-max has 6 raise and 8 blind-defence spots against the planned 7 each (A-3). Tests enforce only the floor.

## How to try it
- `npm test` (includes the golden suite); `npx vitest run tests/golden/` for just the golden files.
- To add a spot, see `docs/advice/golden-spots.md`.

## Run metrics
Questions 2 (both auto-accepted) · assumptions 6 · review rounds 2 · judge rounds: see doit/TASK-7.11/judge/ · gate runs 4 · escalations 0 · changed lines 2044.

## Known limitations and follow-ups
- [trainer] Chart question: decide whether 88 on the button vs a hijack open should re-raise rather than call, and if so change the chart and spot fr-btn-raise-88. Owner: TASK-7.2 area (preflop chart), or an AC on TASK-7.14 if the user prefers.
- [trainer] Reword the AJs justification in fr-bb-re-raise-ajs so it does not overstate the opener's weaker aces. Owner: TASK-7.11 spots file.
- [trainer] REQ-039 needs at least 200 spots; the remaining spots are postflop, owned by TASK-7.14.
- Not tracked (infra, below the value bar): the helper copies in golden.ts (`isRecord`, `wordCount`, `echo` divergence). Data is repo-authored and a failing run already fails closed, so it has not caused and would not plausibly cause a real failure.

## Lessons for the factory (proposals — not applied)
- Round 1 found 5 MAJOR in spot content because the spec's clear-cut rule was only machine-checked as "not borderline". Proposal: for golden-data tasks, have the builder list each spot's chart neighbours and price arithmetic in build-log before the first review, and add a poker-domain review item for pot-odds claims in justification text.
- Scope gate warned (2044 vs 1900 lines) for a data-heavy task; consider excluding authored data files from the line count.
