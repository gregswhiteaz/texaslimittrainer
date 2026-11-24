---
id: doc-128
title: 'TASK-10.5: See my postflop leaks with evidence and a one-sentence fix'
type: other
created_date: '2026-11-24T23:58:00Z'
updated_date: '2026-11-24T23:58:00Z'
---
# TASK-10.5: See my postflop leaks with evidence and a one-sentence fix

Status: Done · Completed: 2026-11-24 · Epic: TASK-10 — Read the session report · Milestone: m-1 · Requirements: REQ-044 (044.5, 044.9), REQ-047 (047.1, .2, .4, .5, .8), REQ-061 (061.2) · Branch: doit/TASK-10.5

## What was asked
The Session Report gets a "Biggest leaks this session" section. Every postflop decision of the user falls in one of 15 categories (flop/turn/river × facing a bet: fold/call/raise, not facing a bet: check/bet). A category is a leak when it has at least 8 unhinted decisions and at least 40% of them were graded Minor or Major. Each leak shows a title, evidence ("4 of 10 turn calls graded as errors") and a one-sentence fix. Spec: doit/TASK-10.5/spec.md.

## Assumptions made without asking — please review
Q-1, Q-2 and A-1..A-8 were all auto-accepted under the unattended-approvals rule (qa.md).

| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| Q-1 / D-1 | The report stores optional `leakCounts: { category, decisions, errors, major }[]` (unhinted counts), written once at session end; no DB version change | yes | Same pattern as `style` / `errors` | Drop the field; derive from hand records |
| Q-2 / D-2 | The 15 titles, evidence names and one-sentence fixes (spec §5) are the user-visible copy | yes | Original text per REQ-061.2 | Edit `src/stats/leak-categories.json` |
| A-1 | "Facing a bet" is read from the action type: fold/call/raise yes, check/bet no. A call on a capped street is a facing-a-bet call | yes | Stored decision has no owed amount | Replay `actions` to get the owed amount |
| A-2 | `ReportDecision` gets optional `street?` / `action?`; a decision without them is skipped by the leak count | yes | Avoids editing a locked TASK-10.4 test | Make required and edit the locked test |
| A-3 | All leaks are listed in category data order (no ranking, no cap of 3) | yes | Ranking is TASK-10.8 | Order by error rate |
| A-4 | A report stored before this story has no `leakCounts` and shows no leaks section | yes | Write-once reports cannot be back-filled | Show the "No leaks found" sentence |
| A-5 | `leakCounts` is present iff `errors` is present; `[]` when no postflop decision was unhinted | yes | Keeps locked TASK-10.3 assertion true | Always present |
| A-6 | Section markup: `section.report-leaks`, `ul.report-leak-list` / `li.report-leak[data-category]`, `p.report-leaks-none`; after the style section, before Back to Home | yes | Matches the storyboard and `StyleSection` | `<dl>` per leak |
| A-7 | "One sentence" = trimmed, starts upper case, ends with `.`, no other `.`, `!` or `?` | yes | Strict version of the healthy-range check | Count sentence-ending punctuation only |
| A-8 | Category text lives in validated data `src/stats/leak-categories.json` with a `justification` per entry (not shown on the report) | yes | "Keep the category set as data"; DoD#10 | TypeScript constant |
| Build | Unlocked TASK-10.4 test `tests/table/session-report-errors.test.ts` key-order check widened from the last 2 report keys to the last 3 (`style`, `errors`, `leakCounts`); no assertion dropped | yes | New trailing key | Revert (test then fails) |

## Clarifications and decisions
- Q-1 and Q-2: auto-accepted, recommended options (qa.md).
- D-3: no locked test needed editing (all others compare like with like or render reports without `leakCounts`).
- D-4: category content and rules live in headless `src/stats/`, like `healthy-ranges`.

## What was built
- `src/stats/leak-categories.json` (new): 15 postflop categories (id, street, facingBet, action, title, evidenceName, fix, justification).
- `src/stats/leaks.ts` (new): `parseLeakCategories` (validated at load), `LEAK_CATEGORIES`, `decisionCategory`, `categoryCounts`, `isLeak` (`decisions >= 8 && 5*errors >= 2*decisions`), `leakEvidence`, `sessionLeaks`.
- `src/table/session-report.ts`: optional `street`/`action` on `ReportDecision`; `leakCounts` computed in `sessionReport` inside the existing end transaction (no storage change); `parseLeakCounts` validation (known category, strictly increasing order, whole numbers, 1 ≤ decisions, errors ≤ decisions, major ≤ errors).
- `src/ui/report/ReportScreen.tsx`, `src/ui/styles.css`: `LeaksSection`, shown only when `leakCounts` exists; the leaks list, or "No leaks found this session (a leak needs 8+ spots with 40%+ errors)."
- Docs: `docs/stats/leaks.md` (new), `docs/storage/reports.md` (`leakCounts`).
- Hinted decisions count toward neither threshold nor the evidence. Preflop decisions are not counted.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..06 | AC#1-6 | `tests/stats/leaks.acceptance.test.ts` | PASS | Judge round 1 plus holdout checks |
| SPEC-07, 08 | AC#7, 8 | `tests/ui/report-leaks.acceptance.test.tsx` | PASS | Judge round 1 |
| SPEC-09, 10 | AC#2, 6 | `tests/stats/leaks.test.ts` | PASS | Judge round 1 |
| SPEC-11, 12 | presence and validation | `tests/table/session-report-leaks.test.ts` | PASS | Judge round 1 |
| SPEC-13 | browser flow | `e2e/report-leaks.spec.ts` (Chromium + WebKit, axe) | PASS | Judge round 1 |
| SPEC-14..16 | checks, docs, N/A DoD | lint, typecheck, `npm test`, docs | PASS | Judge round 1 |

- `npm test`: 1303 passed, 0 failed (279 files; 44 opt-in slow tests skipped); lint and typecheck pass; `src/stats/leaks.ts` 100% line coverage. CI and Visual runs on HEAD succeeded. Gates: build-1 PASS, fix-2 PASS.
- Judge round 1: 16/16 PASS. Live app run in Chromium (13 hands) and WebKit (21 hands) with hints on every 5th decision: shown leaks and stored `leakCounts` equalled an independent tally of the stored hand records; report unchanged after reload. Holdout checks confirmed JSON text equals the approved spec text.
- Test integrity: clean; no change under `src/engine`, `src/bots`, `src/advice`, `src/storage`.

## Review
Round 1: no BLOCKER or MAJOR findings (code or security). Security: stored `leakCounts` is validated and fails closed; all text renders as React text.

### Non-blocking review notes (deliberately not fixed)
- MINOR: the turn-fold fix ("pot has grown enough that many pairs and draws are worth a call") and the turn-call justification ("doubled bet size raises the required equity") pull in opposite directions. The real change from flop to turn is that a draw has one card to come instead of two. The text matches the approved Q-2 copy.
- NIT: flop-call fix says equity "beats" the price; the rule is "at least" the price (a tie calls), and implied odds allow slightly less.
- NIT: flop-bet fix says "see the turn for free"; a check is only free when the user acts last.
- MINOR: scope over budget (below).

## How to try it
`npm run dev` → New game → Start game → play 30-60 hands (open the Hint before a few) → Leave table → read "Biggest leaks this session". Checks: `npm run lint && npm run typecheck && npm test`; `npm run e2e` for `e2e/report-leaks.spec.ts`.

## Run metrics
Questions 2 · assumptions 8 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · sendbacks 0 · changed lines 1228 in 13 files (budget 950 / 12).

## Known limitations and follow-ups
- [trainer] Revisit leak copy: turn-fold vs turn-call justification tension (MINOR); flop-call "beats" vs "at least"; flop-bet "turn for free" only when acting last (NITs). Source: reviews/round-1/code.json. Owner: this copy is in `src/stats/leak-categories.json`; needs the user's decision on Q-2 wording.
- [trainer] All leaks are listed in category order; ranking by Major count and the top-3 limit come with TASK-10.8.
- [trainer] Preflop categories (REQ-047.6/.7) are TASK-10.6; preflop decisions are not counted here.
- [trainer] Reports stored before this story show no leaks section (A-4); no back-fill.
- Scope over budget: 1228 lines / 13 files vs 950 / 12. The extra file is the one-line unlocked test edit; the extra lines are tests and docs.

## Lessons for the factory (proposals — not applied)
- Spec scope budgets undercount tests and docs for a feature with 5 new test files; estimate lines including tests/docs, or count the unlocked-test edit up front when a new key is added to a pinned report shape. The first test run failed once on the key-order pin of the TASK-10.4 test, which the spec's D-3 locked-test audit did not list because it is unlocked.
