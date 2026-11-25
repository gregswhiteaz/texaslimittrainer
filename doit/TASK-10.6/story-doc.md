# TASK-10.6: See my preflop leaks by position group

Status: Done · Completed: 2026-11-24 · Epic: TASK-10 — Read the session report · Milestone: m-1 · Requirements: REQ-044 (044.5), REQ-047 (047.1, .2, .4, .5, .6, .7, .9), REQ-061 (061.2) · Branch: doit/TASK-10.6

## What was asked
TASK-10.5 put 15 postflop leak categories on the Session Report. This story adds the 16 preflop ones: position group (early, middle, late, blinds) x action (fold, open, call, raise). They use the same data file, validation, `leakCounts` record, leak rule (at least 8 unhinted decisions and at least 40% Minor/Major) and "Biggest leaks this session" section. A big blind checking its option falls in no category. Each category has original authored text. Spec: doit/TASK-10.6/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | "Someone has raised" = any earlier preflop `raise` record before the user's action, from any seat, including the user's own raise and short all-in raises. Blinds are not raises. A raise is `raise` if so, else `open`. | yes | Same test the advice engine uses for chart spots (`src/advice/preflop.ts`), so the leak agrees with the grade. | Ignore short all-in raises |
| A-2 | `ReportHand` gains optional `button`. A hand without it has its preflop decisions skipped (hand-built test data only). | yes | Stored records always have `button`. Locked TASK-10.4/10.5 tests build hands without it. | Required `button` and edit 3 locked files |
| A-3 | A preflop decision pairs with the user's j-th non-blind action by order. A trailing forced fold is ignored. A decision whose record has another type is skipped. | yes | Stored records are validated to have this alignment. | Store `raisedBefore` on each decision (changes the hand-record format) |
| A-4 | The 16 entries are appended after the 15 postflop ones (group order early, middle, late, blinds; then fold, open, call, raise). Until TASK-10.8 ranks leaks, preflop leaks list after postflop ones. | partly: stored `leakCounts` must follow data order, so reordering later invalidates stored reports that hold preflop counts | Keeps postflop indices and old stored reports valid. | Preflop first (shifts postflop indices) |
| A-5 | A preflop `check` (big blind option only) and `bet` (cannot occur) fall in no category. Both still count in `errors`. | yes | REQ-047.9. | none |
| A-6 | Grouping follows REQ-047.6 literally for 2–10 players over dealt-in seats: first two after the button are blinds, button and the seat before it late, next two back middle, the rest early. Heads-up: button late, other seat blinds. So 5 players have one middle seat, 7 have one early seat, 10 have four. | yes | Same order and blinds as the engine and `positionOf`. | none |

## Clarifications and decisions
- Q-1 (auto-accepted, recommended): one list. 16 preflop entries appended to the same JSON, ids `<group>-<action>` (e.g. `early-fold`), stored in the existing `leakCounts`. No format, version or DB change. Please confirm the persisted id scheme.
- Q-2 (auto-accepted, recommended): the 16 titles, evidence names and one-sentence fixes in spec §5. Please review the text (see `docs/stats/leaks.md`, "Preflop categories").
- D-3: the locked TASK-10.5 test `tests/stats/leaks.acceptance.test.ts` AC#2 was edited. It still asserts the exact 15 ids and all other checks, now over the postflop subset (`street !== 'preflop'`), plus a new check that the 16 preflop ids are in data order. Nothing else in it changed. Please confirm.
- D-4: `positionGroup` and `handCategoryDecisions` live in the headless `src/stats/leaks.ts`.

## What was built
- `src/stats/leak-categories.json`: 16 preflop entries appended (31 total).
- `src/stats/leaks.ts`: preflop entry shape and validation (street first, then the key set for that street; `id` must equal `<group>-<action>` and be unique), `positionGroup(seats, button, seat)`, `preflopAction(type, raisedBefore)`, `decisionCategory(street, action, spot?)`, `CategoryDecision.preflop`, and `handCategoryDecisions(hand)`, which pairs each preflop decision with its action record.
- `src/table/session-report.ts`: optional `button` on `ReportHand`. `leakCounts` is built through `handCategoryDecisions`. `errors` is counted as before over every decision.
- Tests: `tests/stats/preflop-leaks.acceptance.test.ts` (SPEC-01..07), `tests/stats/preflop-leaks.test.ts` (SPEC-09..12), `tests/ui/report-preflop-leaks.acceptance.test.tsx` (SPEC-08). Modified `tests/stats/leaks.acceptance.test.ts` (D-3) and `tests/stats/leaks.test.ts` (new error path, added `street: 'showdown'` case).
- Docs: `docs/stats/leaks.md` (groups, action mapping, pairing, 16-entry table with justifications), `docs/storage/reports.md` (`leakCounts` holds postflop then preflop ids in data order).
- No UI, engine, bots, advice or storage change. Preflop leaks render through the existing section.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..03 | AC#1–3 | acceptance, exact group arrays for 9, 6 (and wrapped button), 4, 3 and 2 players | PASS | judge holdout compared `positionGroup` with an independent reference over >10,000 seat/button/subset cases |
| SPEC-04..06 | AC#4–6 | acceptance, open/call/raise/fold mapping, limp, SB complete, BB check | PASS | BB check gives no `blinds-*` entry; `errors.major` still counts it |
| SPEC-07 | AC#7 | acceptance, 16 ids and text rules | PASS | 31 entries, postflop first and unchanged |
| SPEC-08 | AC#8 | UI acceptance, 10 UTG folds with 4 errors | PASS | evidence `4 of 10 early-position folds graded as errors` |
| SPEC-09..12 | AC#4, 5, 7 | unit: validation paths, pairing, table sizes, stored round-trip and order check | PASS | |
| SPEC-13 | DoD checks | `npm run lint && npm run typecheck && npm test` | PASS | 1322 passed, 45 slow skipped, 284 files; `leaks.ts` 100% lines; CI run 45561004627 success |
| SPEC-14 | docs | manual | PASS | docs updated; this doc published |
| SPEC-15 | N/A items | `git diff --stat` shows no engine/bots/advice/ui change | PASS | |

- Live check (judge): 9-player app, Chromium 33 hands and WebKit 51 hands, mixed policy with hints. Stored `leakCounts` matched an independent tally from the stored hand records. The report was identical after reload. Existing report e2e specs (16) passed on both browsers.
- Gate runs: 2 (build, fix), both PASS.

## Review
Round 1: no blocking findings from code or security review. Security: the `positionGroup` RangeErrors cannot be reached from validated stored data, and the transaction fails closed anyway. Judge round 1: PASS.

### Non-blocking review notes (deliberately not fixed)
- MINOR `src/stats/leaks.ts:256`: `handCategoryDecisions` rebuilds the seat list and user group for every preflop decision. Compute once per hand.
- NIT `src/stats/leaks.ts:246`: the "user's non-blind action" test duplicates `userMade` in `src/table/hand-record.ts:137-141`.
- MINOR `docs/storage/reports.md:81`: a garbled `leakCounts` sentence. Already fixed by the orchestrator (sentence split, noted in changes.md).

## How to try it
`npm run dev`, New game, 9 players, Start game, play 40–80 hands (fold or limp a lot from early seats), Leave table, read "Biggest leaks this session". Tests: `npx vitest run tests/stats tests/ui/report-preflop-leaks.acceptance.test.tsx`.

## Run metrics
Questions 2 (auto-accepted) · assumptions 6 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · changed lines 1181 (budget 950; about 670 are tests, plus the docs content table).

## Known limitations and follow-ups
- Preflop leaks list after postflop ones, in data order, until TASK-10.8 ranks them (owner: TASK-10.8).
- The big blind check case was only unit-tested, not seen live (a live hand rarely reaches 8 such decisions).
- [trainer] Compute the position group once per hand in `handCategoryDecisions` (MINOR above). No owning task known.
- [trainer] Reuse `userMade` from `src/table/hand-record.ts` instead of the duplicate check (NIT above). No owning task known.
- Scope overshoot: 1181 lines against 950.

## Lessons for the factory (proposals — not applied)
- The 950-line budget was low for a story with a 16-row content table and about 670 lines of tests. Budget estimates for stories that add data tables plus acceptance tests could count tests and docs separately.
