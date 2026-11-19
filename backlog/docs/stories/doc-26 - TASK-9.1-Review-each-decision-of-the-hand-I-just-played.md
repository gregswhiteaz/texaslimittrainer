---
id: doc-26
title: 'TASK-9.1: Review each decision of the hand I just played'
type: other
created_date: '2026-11-19T02:05:00Z'
updated_date: '2026-11-19T02:05:00Z'
---
# TASK-9.1: Review each decision of the hand I just played

Status: In review (Judge and CI pending) · Completed: pending · Epic: TASK-9 · Milestone: m-0 · Requirements: REQ-024.2, REQ-024.3, REQ-043.2, REQ-043.7, REQ-043.10, REQ-043.12, REQ-057.1, REQ-057.3 · Branch: doit/TASK-9.1

## What was asked
When a hand ends in which the user did more than a single preflop fold, a Hand Review panel opens beside the table. It lists every user decision in order, each with street, board at that point, the user's action, the advised action and a graded badge (Correct / Minor error / Major error, text on a colour). Grades come from the TASK-7.4 grader on the view captured at that decision. While a reviewed hand is on the table the 1.5 s auto-deal is held; the next hand comes only from "Deal next hand", which stays after the panel is closed. Hands with no user decision or only a preflop fold keep the auto-deal. Spec: doit/TASK-9.1/spec.md.

## What the panel looks like
Screenshots (1280x720 Chromium): `doit/TASK-9.1/review-open.png` (panel open) and `doit/TASK-9.1/review-closed.png` (after Close, Deal next hand still there). The panel is a 400 px dark card to the right of the table with the heading "Hand #1 review" and an x "Close review" button. Each entry shows an uppercase street label, the board cards at that point as small drawn cards (none preflop), a coloured text badge on the right, and a second line "You: Call $4 · Advice: Fold". Badges: Correct blue, Minor error amber, Major error dark red, all white text. No equity numbers or explanations (TASK-9.3). A red "Deal next hand" button sits under the table.

Visible shortcoming: at 1280x720 "Deal next hand" is below the fold while the panel is open, so the user must scroll to reach it. Vertical fit is TASK-3.16.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Grades computed once, eagerly, in the hand-complete callback (one `gradeView` per user decision), held in `Table` state until the next hand. | yes | Panel shows all entries at once. About 19 ms for 4 decisions on the pinned hand. | Grade lazily on render (TASK-9.3 moves it off-thread anyway). |
| A-2 | Panel is a complementary landmark, not a dialog; focus not trapped. Focus goes to the heading on open, to Deal next hand after Close, nowhere after Deal next hand. | yes | Table stays usable while open; Close unmounts so focus needs a home. | Use `role="dialog"` or skip focus moves. |
| A-3 | Deal next hand shows only while a reviewed hand is held; auto-dealt hands show no button. | yes | REQ-024.3 deals those after 1.5 s; a 1.5 s button invites misclicks. | Show it after every hand. |
| A-4 | Layout: table column plus 400 px panel, 16 px gap; `.table-screen` widens from 1040 to 1280 px while the panel is open (table 832 px wide). | yes | Matches storyboard; seats fit without overlap. TASK-3.16 owns final fit. | Shrink table permanently or overlay the panel. |
| A-5 | `reviewEntries` lets grader errors propagate; no "could not grade" fallback. | yes | Stored views are always legal 6-max decisions; a fallback would hide bugs. | Catch and show "Not graded". |
| A-6 | Entry board is the full board of that decision's view, drawn at 30x42, group labelled "Community cards" (not "Board", so existing e2e strict-mode locators stay unique). | yes | AC#1 "board at that point". | Show only the new card on turn/river, or text. |
| A-7 | No handling for non-6-max tables; the app only seats 6-max. | yes | `positionOf` cannot throw at 6 seats. | Follow-up TASK-2.2/TASK-7.6. |
| A-8 | The e2e big-blind-walk path pins the 4th replay code (`9e3779b9 00000001 00000002 00000007`) so a real-app hand ends with the user as big blind and all bots folding. | yes | Vitest cannot mount the hook (node environment). | A custom-config harness page. |

## Clarifications and decisions
- **Q-1 (user, 2026-11-18): entry wording and board display.** Options: exact amounts + drawn board (Recommended) / storyboard text without amounts / "Recommended:" wording / only the new card. The user chose exact amounts + drawn board. Street label Preflop/Flop/Turn/River (uppercase by CSS), full board as 30x42 cards (none preflop), badge on the right, "You: Call $4 · Advice: Fold" using the action-bar labels (qa.md).
- Settled by the storyboard, not asked: heading "Hand #N review" (D-5), x "Close review" button, red "Deal next hand" under the table, badge colours Correct #2F6FE0 / Minor #9A5B00 / Major #A3151C with white text (contrast 4.7:1 or better).
- D-1: pure model `src/table/review.ts` holds every rule; the panel only renders data.
- D-2: hold is `review !== null`; set in a stable `onHandComplete`, cleared only by Deal next hand. Close keeps the hold (REQ-043.10).
- D-3: `dealNext()` draws one `newCode()` outside the updater and deals only when the hand is done: the auto-deal's code path.
- D-6: no earlier-story test edited; every earlier e2e that ends a hand after a non-fold decision was checked and none expects the auto-deal.

## What was built
- `src/table/review.ts` (new): `opensReview(hand)` (false iff no decision, or exactly one preflop fold) and `reviewEntries(hand)`, which grades each user decision with `gradeView(view, action.type)`; text from `actionLabel`, `GRADE_LABELS`, `STREET_LABELS`.
- `src/ui/table/ReviewPanel.tsx` (new): the panel.
- `src/ui/table/Table.tsx`: optional `review`, `onDealNext`, `onCloseReview` and `dealNextRef` props; `.table-layout` wrapper; Deal next hand button; `Table` holds review state, stable `onHandComplete` (caller's callback read through a ref), the hold, Close and Deal next hand.
- `src/ui/table/useTableSession.ts`: returns `dealNext`.
- `src/ui/styles.css`: layout, panel, entries, badges, Deal next hand.
- Tests: `tests/support/table-scenarios.ts` (`userTableAfter`, five scripted states), `tests/table/review.acceptance.test.ts`, `tests/table/review.test.ts`, `tests/ui/review-panel.acceptance.test.tsx`, `e2e/review.spec.ts`.
- No engine, bot or advice file changed; no new dependency.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01, 02, 04, 08 | 4 entries in order, grades equal grader output, no review for lone preflop fold/walk, call-then-fold review | Vitest acceptance | pass | tests/table/review.acceptance.test.ts |
| SPEC-03 | Panel markup, text badges, no M2 placeholders | Vitest render | pass | tests/ui/review-panel.acceptance.test.tsx |
| SPEC-09 | Model edges | Vitest unit | pass | tests/table/review.test.ts |
| SPEC-05, 06, 07 | Auto-deal after 1.5 s without review; panel opens, holds, Deal next hand; Close keeps hold; axe; layout; badge colours | Playwright, Chromium + WebKit | pass (6/6) | e2e/review.spec.ts |
| SPEC-10 | Earlier e2e flows unchanged | Playwright | pass (66/66; full `npm run e2e` 86 passed) | build-log.md, code review |
| SPEC-11 | `dealNext` shares the auto-deal path; stable callback | manual review | pass | reviews/round-1/code.json |
| SPEC-12 | lint, typecheck, tests, coverage | `npm test` | pass: 72 files, 260 passed, 1 skipped | gates/build-1.json |
| SPEC-13 | CI green, doc published | CI, backlog doc | pending | |
| SPEC-14 | N/A DoD items | Judge | pending | |

Gate: build run 1 PASS. Judge rounds: none yet (pending). CI: pending.

## Review
Round 1, code and security reviewers: no blocking findings (review_findings round 1 = 0).
- Code: all SPEC items pass. Mutation checks in a scratch copy: 11 mutants caught (dropped street check, wrong grade action, advice = user action, uncopied board, first view reused, fixed label, no hold, Close clearing review, no focus after Close, no heading focus, Deal next hand keeping the review); 2 survivors, both not observable or manual (see notes).
- Security: no hindsight in grading (only the user's own captured views and actions), one hand dealt per click, Close cannot bypass the hold.

### Non-blocking review notes (deliberately not fixed)
- NIT: `TableView` has an extra optional `dealNextRef` prop not in the spec interface; needed for the A-2 focus move after Close. TASK-9.2/9.7 should know it exists.
- NIT: no automated test notices if `onHandComplete` loses its stable identity (SPEC-11 is manual). An unstable callback would restart the 1.5 s timer each render.
- NIT: the `rest.length > 0` term in `opensReview` is unobservable in any reachable state (a preflop fold ends the user's decisions); kept because spec Rule 1 and REQ-043.12 state it.

## How to try it
`npm run build && npm run preview`, open http://localhost:4173, New game, Start game. Fold at the first turn: no panel, next hand in about 1.5 s. Check or call to the end: panel opens, nothing deals; Close keeps the result and Deal next hand; click Deal next hand. Tests: `npm test`, `npx playwright test e2e/review.spec.ts`, `npm run e2e`.

## Run metrics
Questions 1 · assumptions 8 · review rounds 1 · judge rounds 0 (pending) · gate runs 1 · escalations 0 · changed lines 1153 across 10 files (budget 1000 lines / 10 files: line count over budget, warn).

## Known limitations and follow-ups
- Deal next hand is below the fold at 1280x720 while the panel is open (A-4).
- Follow-ups (owners from spec §13):
  - TASK-3.16: fit the table, open panel and Deal next hand in 1280x720 without vertical scrolling; keep table width stable when the panel opens and closes; move the e2e helpers copied into `e2e/review.spec.ts` to `e2e/support/`.
  - TASK-9.3: read stored decision entries off the main thread instead of recomputing; add equity, explanation and basis to entries.
  - TASK-9.4: add subtitle (hole cards, position, net result) and replay code under the "Hand #n review" heading.
  - TASK-9.7: gate initial `open` on the auto-open setting; build the summary badge from `reviewEntries`, reusing `opensReview`.
  - TASK-9.2: show Continue instead of Deal next hand when the stack is $0, using the held-review state.
  - TASK-2.2 / TASK-7.6: make `gradeView` work at other table sizes and add review tests at 2 and 10 players.
  - TASK-13.11: include the Table screen with the panel open in the all-screens axe run.
  - Add an automated test that `onHandComplete` stays stable (re-render during the 1.5 s gap, deal still lands near 1500 ms); owner suggestion: TASK-3.16 if it adds a hook harness.

## Lessons for the factory (proposals — not applied)
- The change landed at 1153 lines against a 1000 budget. Most of it is tests and e2e helpers copied from other specs; a shared `e2e/support/` module (TASK-3.16) would cut future stories' size.
- SPEC-11 as a manual-only item left a real regression class (unstable callback) with no automated guard; specs should prefer a harness for hook-level behaviour.
