# TASK-9.7: See a grade summary badge after each hand when auto-open is off

Status: Done · Completed: 2026-11-24 · Epic: TASK-9 — Review the hand just played · Milestone: m-1 · Requirements: REQ-024 (024.2, 024.3), REQ-043 (043.8, 043.11, 043.13), REQ-057 (057.3) · Branch: doit/TASK-9.7

## What was asked
When the auto-open setting is off, a hand that would open the Hand Review panel shows a grade summary badge instead (for example "1 Major, 1 Minor" or "All correct"). Clicking the badge opens that hand's panel and holds the next hand until Deal next hand. Without a click, the next hand deals 1.5 s after the result and the badge goes away. A lone preflop fold shows no badge. Spec: doit/TASK-9.7/spec.md.

## Assumptions made without asking — please review
All eight were auto-accepted under autopilot (qa.md). A-1..A-4 are the user-visible copy and look. No Settings screen exists yet, so the app itself cannot turn auto-open off (see limitations).

| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Auto-open is a non-persisted `Table` prop `autoOpenReview` (default true). It is read through a ref at each hand end. | yes | No settings store exists. Saving it is TASK-12.6. | Replace the prop with the settings value in TASK-12.6 |
| A-2 | Badge text counts Major and Minor grades: "1 Major, 1 Minor". Zero counts and Correct grades are left out. No errors gives "All correct". | yes | Matches the AC and REQ-043.11. | `reviewBadge` in `src/table/review.ts` |
| A-3 | The badge is a native button with accessible name "Open hand review: <text>" and a `data-worst` attribute. | yes | The name says what the click does and contains the visible text. | `TableView` markup |
| A-4 | Look: sits where Deal next hand sits, 44 px high, white text. Background follows the worst grade: #a3151c major, #9a5b00 minor, #2f6fe0 correct. No storyboard shows the badge. | yes | Reuses the panel's grade colours. | `.review-badge` in `src/ui/styles.css` |
| A-5 | The badge appears once the hand's grades are stored, not at the instant the result shows. | yes | The badge needs the grades. | `Table.tsx` |
| A-6 | The badge clears on click, on Deal next hand, and when the hand number changes. It shows only while the result is shown and no review is held. | yes | REQ-043.11. | `Table.tsx` |
| A-7 | If the user busts or a sit-and-go stops with auto-open off, the bust dialog opens as today and the badge sits behind it. | yes | Nothing waits on a panel. | n/a |
| A-8 | No locked test needed an edit. | yes | Checked against every locked test. | n/a |

Deviation also auto-accepted: the spec named a `useEffect` to clear the badge on a new hand. The lint rule `react-hooks/set-state-in-effect` rejects that, so the badge is cleared during render when the hand number changes. Behaviour is the same as A-6.

## Clarifications and decisions
- No questions asked.
- D-1: `afterHandReview(hand, autoOpen)` returns `'none'` if `opensReview` is false, else `'panel'` with auto-open on, else `'badge'`.
- D-2: The badge never holds the next hand. Only clicking it creates a held review.
- D-3: The setting is a non-persisted prop, as A-1.

## What was built
- `src/table/review.ts`: `afterHandReview` and `reviewBadge(grades)`, which returns `{ text, worst, label }`. It throws RangeError on an empty list.
- `src/ui/table/Table.tsx`: `autoOpenReview` prop, badge state filled at grading, `openReview` on click, and `TableView` props `reviewBadge` and `onOpenReview` that render `button.review-badge`.
- `src/ui/styles.css`: `.review-badge`, the `data-worst` colours and the focus ring.
- `e2e/support/records-harness.tsx` and `e2e/support/table-harness-bundle.ts`: an `autoOpen` option for the records harness.
- `docs/ui/review.md`: new section "Grade summary badge (auto-open off)".
- No new dependencies. The app passes no prop, so its behaviour is unchanged.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..03 | Badge text, panel vs badge vs none, call-then-fold vs lone fold | `tests/table/review-badge.acceptance.test.ts` | Pass | gates/build-1.json |
| SPEC-04, 05 | Rendered button, text and colours | `tests/ui/review-badge.acceptance.test.tsx` | Pass | gates/build-1.json |
| SPEC-06..09 | Live flows in Chromium and WebKit: badge, 1.5 s deal, axe, click holds the panel, lone fold, auto-open on | `e2e/review-badge.spec.ts` | Pass | judge/round-1.json |
| SPEC-10, 11 | Lint, typecheck, tests, golden, playtest, full e2e | npm test 1237 passed, golden 282/282, playtest 0 violations | Pass | judge/round-1.json |
| SPEC-12 | Docs and publish | docs/ui/review.md, this doc | Pass | judge/verdict-1.json |

- Judge round 1 passed 12/12 with no failures. The judge also played the real app with a temporary, reverted `autoOpenReview={false}`: badge texts matched the stored grades, the gap before the next deal was about 1.5 s, a click held the review, and lone folds showed no badge.
- Gate runs: 3 (build, fix, fix), all PASS.

## Review
Round 1: security review had no findings. Code review had one MINOR and no blocking findings.

### Non-blocking review notes (deliberately not fixed)
- MINOR `Table.tsx:badge-click-races-auto-deal-render` (J-1-02): a click in the same scheduler task as the 1.5 s auto-deal could leave a review of hand n held while hand n+1 is in play. It is very unlikely and was not reproduced. The fix is one line, in `reviews/round-1/code.json`.
- J-1-01 (LOW): the story doc was not yet listed during judging. It is published in this docs stage.

## How to try it
- `npx playwright test e2e/review-badge.spec.ts` runs the records harness with auto-open off.
- By hand: temporarily pass `autoOpenReview={false}` in `src/ui/table/TableScreen.tsx` (do not commit), run `npm run dev` and play.

## Run metrics
Questions 0 · assumptions 8 · review rounds 1 · judge rounds 1 · gate runs 3 · escalations 0 · changed lines 618 (9 files).

## Known limitations and follow-ups
- Auto-open cannot be switched off in the app until TASK-12.6 adds the Settings toggle (A-1). The flag is a non-persisted prop, so users see no badge today.
- [trainer] Code MINOR badge-click-races-auto-deal-render (J-1-02): when the hand number changes, also drop a held review that belongs to an earlier hand. Owner: TASK-12.6, where the orchestrator is adding it as an AC.
- Copy, label, colour and placement (A-1..A-8) and the render-time clear deviation await user review.

## Lessons for the factory (proposals — not applied)
- The spec prescribed a `useEffect` that the repo's lint rule forbids. Spec writers should check `react-hooks/set-state-in-effect` before prescribing effect-based state resets.
