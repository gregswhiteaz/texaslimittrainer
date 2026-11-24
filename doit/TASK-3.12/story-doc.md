# TASK-3.12: Record the advice and grade for each of my decisions with the hand

Status: Done (judge round 1 PASS 12/12) · Completed: 2026-11-24 · Epic: TASK-3 · Milestone: m-1 · Requirements: REQ-052 · Branch: doit/TASK-3.12

## What was asked
As a learner, I want each of my decisions stored with the advice I was given at that moment, so review and statistics show exactly what a hint would have shown. The hand record now carries one entry per user decision: recommendation (action, rule id), numbers (equity %, required equity %, per-opponent basis), explanation, grade and a `hinted` flag (false unless a hint was shown; E08 will set it). Advice uses the decision-time observed-stats snapshot. AC#6 also requires bad snapshot entries to throw RangeError. Spec: doit/TASK-3.12/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Advice is computed when the record is built at hand end, from each decision's stored `view` and `observed`, not inside `applyUserAction`. | yes | Advice is deterministic in (view, options), so it equals the hint; the action path stays fast. | Compute in `applyUserAction` and carry it on `UserDecision`. |
| A-2 | Preflop entries: `ruleId`, `equityPct`, `requiredEquityPct` null, `opponentBasis: []`, `basis: 'chart'`. | yes | `PreflopRecommendation` has no rule id or equity numbers. | Synthesize a `'chart'` rule id or store the chart cell. |
| A-3 | `parseHandRecord` cross-checks decisions against `actions`: count equals the user's non-blind actions; street, type, amount of entry i match the i-th such action; `action.seat` is `userSeat`. | yes | All user actions go through `applyUserAction`. | Shape-only validation. |
| A-4 | Snapshot checks run in `estimateOpponentRanges`. A preflop view or `'unseen'` ranges never read the snapshot, so a bad one there still yields advice. | yes | AC#6 names that function; nothing supplies snapshots until TASK-8.1. | Validate in `recommend` for every street. |
| A-5 | A whole-number in-range seat that is not a live opponent stays ignored. | yes | Valid data for a folded or absent seat. | Reject seats not at the table. |
| A-6 | Parse bounds: decisions 0..400, `opponentBasis` 0..9, `explanation` 1..2000 chars, `basis.text` 1..200 chars. | yes | Matches the existing bounds style; explanations are at most 3 sentences. | Other limits. |
| A-7 | `alternative` (`ActionType \| null`) is stored. | yes | The E09 review needs to know an alternative was accepted. | Leave it out. |

## Clarifications and decisions
Autopilot ran unattended and auto-accepted the recommended option for each item below (qa.md). **All are listed for your review.**
- Q-1 / D-1: stored entry shape is the compact `HandRecordDecision` (street, action, recommended, alternative, ruleId, basis, equity %, required equity %, per-opponent basis, explanation, `grade {grade, ruleId, marginPts}`, `hinted`), not the full `GradeResult`. This is a persisted format.
- Q-2 / D-2: AC#6 seat bound is 1..10 (the table/hand-record bound), not 1..6. The AC#6 text in Backlog was reworded to "from 1 to 10 (the table seat bound)".
- Q-3 / D-3: cross-story locked edit of `tests/storage/hand-records.acceptance.test.ts` (owner TASK-3.9): `decisions` is destructured out of `rest` and its length (6) is asserted. The TASK-3.9 assertion is intact.
- Q-4 / D-4: older stored records without `decisions` are rejected on read (`Invalid hand record: decisions`). Nothing is deleted. No UI reads stored records yet; migration belongs to REQ-054.
- Block 1 (spec correction): SPEC-01/SPEC-05 expected values were copied from `review.acceptance.test.ts`, which grades with default unseen options. The hint, app review and stored record use `ACTION_RANGE_ADVICE`. Stored = hint was kept: SPEC-01 expects recommended [raise, bet, bet, call] and grades [correct, correct, minor, correct]; the SPEC-05 margin check moved to entry 2 (turn, `aggression-margin`).
- Build note (cross-story locked edit, owners TASK-3.9 and TASK-1.55): `e2e/hand-records.spec.ts` `oldRecord()` fixture gained one `decisions` entry. This was needed after Q-4 made `decisions` mandatory. No assertion changed.
- D-5: `userAdviceOptions(observed?)` moved to `src/advice/recommend.ts` (exported) so hint and record share one definition.

## What was built
Data flow: at hand end `handRecord()` calls `decisionRecord()` for each stored `UserDecision`. It grades the stored `view` and `observed` snapshot with the same options as the hint worker and writes fresh copies (no shared references). `parseHandRecord()` validates the stored form.
- `src/table/hand-record.ts` — `HandRecordGrade`, `HandRecordDecision`, `decisionRecord`, `HandRecord.decisions`, and decision validation with the cross-check against actions.
- `src/advice/recommend.ts` — exported `userAdviceOptions`. `src/table/advice-service.ts` — uses it.
- `src/advice/ranges.ts` — `observedBySeat` throws RangeError for non-object entries and seats that are not whole numbers 1..10 (closes TASK-7.13's `non-object-snapshot-entry-typeerror`).
- `docs/storage/hand-records.md` — new field, entry table, `hinted` default, snapshot rule, validation rules.
- Tests: `tests/table/decision-record.acceptance.test.ts` (new, SPEC-01..06), `tests/table/decision-record.test.ts` (new, SPEC-07/08), `tests/support/table-scenarios.ts` (user moves now go through `applyUserAction`; optional `observed`), `tests/storage/hand-store.test.ts` (grades once and reuses the decisions across 1,000 records; it took 11.5 s otherwise and risked CI's 30 s timeout), `tests/storage/hand-records.acceptance.test.ts` (D-3), `e2e/hand-records.spec.ts` (fixture).
- No new dependencies. Changed lines: 760 (gate fix-5).

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | 4 decisions in order with full advice | acceptance test deep-compares each entry with the worker `grade` response; holdout via fake-indexeddb | PASS | judge round-1 |
| SPEC-02 | snapshot at decision time (29 vs 30 hands) | acceptance test | PASS | judge round-1 |
| SPEC-03 | `hinted` false by default | acceptance test | PASS | judge round-1 |
| SPEC-04 | preflop fold gives exactly one entry | acceptance test | PASS | judge round-1 |
| SPEC-05 | grade data survives JSON round-trip | acceptance test | PASS | judge round-1 |
| SPEC-06 | bad snapshot entries throw RangeError | acceptance test | PASS | judge round-1 |
| SPEC-07 | `parseHandRecord` validation with field paths | unit tests, including amount-only, long text, bad alternative, bad seat | PASS | judge round-1 |
| SPEC-08 | builder copies and shares nothing | unit test mutating the cloned input | PASS | judge round-1 |
| SPEC-09 | lint, typecheck, coverage, golden, boundaries | `npm test` | PASS | gate fix-5 |
| SPEC-10 | playtest unchanged | 10,000 hands, seed 42 | PASS | 0 violations, identical to main |
| SPEC-11 | documentation | docs update | PASS | judge round-1 |
| SPEC-12 | N/A items and CI | CI green after fix | PASS | judge round-1 |

- Suite: `npm test` 1179 passed, 43 skipped (opt-in slow), 0 failed; golden 282/282. `npx playwright test`: 214 passed, 16 skipped.
- Real-app end-to-end: 10 hands in the built app. All 44 stored decisions deep-equal the real built advice worker's grade responses. The review panel grades match the stored grades. `check-advice` found 100113 points and 0 mismatches.
- Locked acceptance test: `tests/table/decision-record.acceptance.test.ts` (sha c6b91eba…, 40 asserts).
- Gates: build-1, fix-2..fix-5 all PASS.
- Judge round 1: PASS, no failures. One LOW finding (see follow-ups).

## Review
No blocking findings in either round. Security: no findings. Stored strings reach no HTML sink, errors expose only field paths, and work per record is bounded. Round 1 code review had 2 MINOR and 2 NIT findings. Both MINORs were fixed in `3a1e98c` (amount-only and text-bound rejection cases added; a vacuous `not.toBe` replaced by a real mutation no-sharing test). Round 2 had no findings. The first branch CI run failed because the e2e `oldRecord()` fixture had no decisions; this was fixed in the same commit.

### Non-blocking review notes
- NIT `src/table/hand-record.ts:179`: `explanation`, `grade` and `hinted: false` repeat in both branches of the ternary in `decisionRecord` even though `common` exists.
- NIT `tests/support/table-scenarios.ts:152`: `defaultTableAfter` is now a one-line wrapper around `userTableAfter`.
- LOW (judge J-1-01): see below.

## How to try it
- `npm test` and `npx vitest run tests/table/decision-record`
- `npm run build && npx playwright test e2e/hand-records.spec.ts`
- `npm run -s playtest -- --hands 10000 --seed 42 --check-advice`

## Run metrics
Questions 4 · assumptions 7 · review rounds 2 · judge rounds 1 · gate runs 5 · escalations 0 · sendbacks 0 · changed lines 760.

## Known limitations and follow-ups
- [trainer] Judge LOW J-1-01: the storyboard SHOWDOWN fixture plays user moves with `play()` instead of `applyUserAction`, so its record has no decisions and `parseHandRecord` rejects it. Test fixtures only; no production path is affected. Build its user moves through `applyUserAction`. Owner: TASK-3.12 fixture, or the story that first stores that fixture.
- [trainer] Code NITs: dedupe the repeated fields in `decisionRecord` (`hand-record.ts:179`); inline or drop the `defaultTableAfter` wrapper (`table-scenarios.ts:152`).
- [trainer] Snapshots are not supplied in the app until TASK-8.1, so stored advice uses unseen/chart-based ranges until then. Owner: TASK-8.1.
- [trainer] The review panel recomputes advice instead of reading stored decisions. Switch it to the stored entries so review matches what the user saw. Owner: E09.
- [trainer] Security: when stored decisions are displayed, render `explanation` and `basis.text` as plain text (text nodes, never HTML). Owner: E09 review UI.
- [trainer] Migration for records written before `decisions` existed (they are rejected on read). Owner: REQ-054 migration task.

## Lessons for the factory (proposals — not applied)
- The spec's SPEC-01/05 expected values came from a test that uses different advice options than the hint path, which blocked the build and cost a round trip (Block 1). Proposal: have the spec author check that copied expected values were produced with the same options as the code path under test.
- The first CI run failed on an e2e fixture that the local gate did not exercise. Proposal: when a spec makes a field mandatory in a parser, require the spec to list every fixture or seed (including e2e) that builds those records, and have the local gate run e2e when a stored-format validator changes.
