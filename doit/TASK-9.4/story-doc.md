# TASK-9.4: See the hand number, my cards, position, result and replay code in the review

Status: Done · Completed: 2026-11-24 · Epic: TASK-9 — Review the hand just played · Milestone: m-1 · Requirements: REQ-043 (043.3, 043.4), REQ-013 (013.4, 013.5) · Branch: doit/TASK-9.4

## What was asked
The Hand Review panel header should sum up the hand: the user's net result ("You lost $48"), their two hole cards, their position ("Cutoff"), plus the hand number and the replay code (the same code the hand record stores). Spec: doit/TASK-9.4/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | `TableView` builds the summary with `reviewSummary(completedHand(table), table.handNumber)`; `ReviewState`/`HeldReview` unchanged. No hand means no subtitle or replay line. | yes | The next hand is held while a review shows, so `table.hand` is the reviewed hand. Locked tests pass `review` without a hand. | Add `hand`/`summary` to `ReviewState` |
| A-2 | Net = user's share of awards + returned uncalled amount − every chip put in (blinds included); equals final stack minus starting stack. | yes | Derivable from `CompletedHand` actions and result. | Store final stacks on `CompletedHand` |
| A-3 | Position name comes from `positionName(...)`, the same name shown on the user's seat. | yes | One source; gives "Cutoff"; heads-up gives Small/Big blind. | Use `CHART_POSITIONS`/`SEAT_NAMES` wording |
| A-4 | Result text uses `$` in cash and sit-and-go alike. | yes | Review entries already do; TASK-5.3 changes all sit-and-go amounts at once. | Chips wording now |
| A-5 | Subtitle cards are 24 × 34 px, `role="group"`, `aria-label="Your hole cards"`. | yes | Keeps the subtitle on one line beside the 18 px heading; "Your cards" is already used by the seat and locked tests. | 30 × 42; reuse "Your cards" |
| A-6 | No locked test needed an edit (checked review, review-numbers, table-display, bust-continue acceptance tests and e2e specs). | yes | See spec A-6. | n/a |

## Clarifications and decisions
Autopilot ran, so Q-1..Q-3 were auto-accepted (recommended option). They are user-visible copy; please review:
- Q-1: subtitle reads "You lost $48 · [A♥][9♠] · Cutoff", cards drawn as small PlayingCards (deck-colour setting), position worded as on the seat.
- Q-2: replay line "Hand #133 · Replay code 9e3779b9…" in 12 px muted text directly under the subtitle.
- Q-3: zero net result reads "You broke even".

## What was built
- `src/table/review.ts`: `ReviewSummary`, `netResult(hand)`, `resultText(net)`, `reviewSummary(hand, handNumber)`.
- `src/ui/table/ReviewPanel.tsx`: optional `summary` prop; `.review-title` wrapper with the subtitle and the replay line.
- `src/ui/table/Table.tsx`: `TableView` builds the summary from `completedHand(table)` and `table.handNumber` (null before a result).
- `src/ui/styles.css`: subtitle (14 px), small cards, replay line (12 px, wraps, monospace code).
- Tests/support: fixtures `REVIEW_LOST_48` (hand 133) and `REVIEW_WON_56`; `review-header` scene; `docs/ui/review.md` gains a "Header" section.
- Only the user's own hole cards enter the summary (security review: REQ-025 holds).

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..03 | Header content, replay line, no leaks | `tests/ui/review-header.acceptance.test.tsx` | Pass | judge/round-1.json |
| SPEC-04, 05 | `netResult`, `resultText`, summary | `tests/table/review-summary.test.ts` | Pass | judge/round-1.json |
| SPEC-06, 07 | Live app and scene | `e2e/review-header.spec.ts` (Chromium, WebKit) | Pass | judge/round-1.json |
| SPEC-08..10 | Existing behaviour, docs, gates | Full suite, gates | Pass | gates/build-1.json, fix-2.json |

Judge round 1 passed 10/10 (test suite PASS, end-to-end PASS, no unproven AC/DoD). Gates: 2 runs, both PASS.

## Review
No blocking findings. Security: none.

### Non-blocking review notes (deliberately not fixed)
- MINOR: `reviewHeader(table)` in `src/ui/table/Table.tsx:200` is a one-use helper; the spec inlined it. Behaviour identical.
- NIT: `src/ui/styles.css:752` adds `.review-summary .table-cards { gap: 4px }`, not in the spec's CSS list. Harmless.

## How to try it
`npm test` for unit and acceptance tests; run the e2e spec `e2e/review-header.spec.ts` with Playwright; finish a hand in the app and open the review.

## Run metrics
Questions 3 (auto-accepted) · assumptions 6 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · changed lines 568.

## Known limitations and follow-ups
- [trainer] Sit-and-go result text shows `$` until chip wording lands (A-4); owned by TASK-5.3.
- [trainer] Optionally inline the one-use `reviewHeader` helper in `Table.tsx` (code MINOR); low value, can stay.
- [trainer] Optionally drop the unspecified `.review-summary .table-cards` gap rule if the default gap looks fine (NIT).
- Out of scope by spec: opponents' cards (TASK-9.5), hinted tag (TASK-9.6), grade badge/auto-open (TASK-9.7), timing (TASK-9.8), approximate labels (TASK-9.9), copy button for replay code.

## Lessons for the factory (proposals — not applied)
None; the run had no send-backs or failures.
