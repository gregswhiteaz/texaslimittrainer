# TASK-9.5: See opponents' cards in the review only when they were shown at showdown

Status: Done · Completed: 2026-11-24 · Epic: TASK-9 — Review the hand just played · Milestone: m-1 · Requirements: REQ-043 (043.6), REQ-025 · Branch: doit/TASK-9.5

## What was asked
The Hand Review panel should show an opponent's cards only if that opponent turned them face up at showdown. Mucked and folded hands must never reach the panel, and the replay code must never be used to deal cards for display. Spec: doit/TASK-9.5/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| Q-1 | Copy/UX auto-accepted: a "Shown at showdown" list between the header and the decisions, one line per opponent who showed: "Ben showed" + two drawn cards + " · Pair of kings" | yes | Recommended option; autopilot rule | Edit `ReviewPanel.tsx` list markup |
| SPEC-04 deviation | The SPEC-04 hidden-card search covers opponent seats only, not the user. The header always shows the user's own cards, so a literal search over "every seat not in record.shown" would fail in `REVIEW_DEE_MUCKS`, where the user mucks. Auto-accepted (qa.md). | yes | Literal reading contradicts the header | Re-scope the search in the acceptance test |
| A-1 | Cards come from `CompletedHand.shown`, the field the hand record stores | yes | One source, identical to the record | Use `result.showdown` |
| A-2 | The user's own seat is left out of the list, even when the user showed | yes | Header already shows it | Add a "You showed" line |
| A-3 | `TableView` computes the list from `completedHand(table)`. `ReviewState` is unchanged. | yes | Same pattern as TASK-9.4 | New `ReviewState` field |
| A-4 | The list sits outside `.review-title`, before the Decisions `<ol>` | yes | Locked parsers read those regions | Move to the panel foot |
| A-5 | New markup has its own hooks (`data-review-shown`, group name "<Name>'s shown cards") | yes | Avoids locked-test selectors | — |
| A-6 | No locked test needed editing; all locked tests were checked | yes | Grep of locked tests | — |

## Clarifications and decisions
- Q-1 was auto-accepted as recommended (see above).
- D-1: shown cards are read only from `CompletedHand.shown`. The review sources never call `shuffledDeck`, `createHand` or `dealHand`, and never read `table.hand.players` or `hand.deck`.
- D-2: the list layout in Q-1.

## What was built
- `src/table/review.ts` — `ShownOpponent` and `shownOpponents(hand)`. It takes the opponents in `hand.shown`, in showdown order, leaves out the user's seat and adds the hand name. It throws `RangeError` for a seat not at the table.
- `src/ui/table/ReviewPanel.tsx` — optional `shown` prop that renders `ul[aria-label="Shown at showdown"]`. With no shown hands the markup is unchanged.
- `src/ui/table/Table.tsx` — `reviewHeader` now returns `{ summary, shown }` from one `completedHand(table)` call. The result is spread into `ReviewPanel`.
- `src/ui/styles.css` — `.review-shown` rules.
- Test support: `REVIEW_DEE_MUCKS` fixture in `tests/support/table-scenarios.ts` (Ben shows K♦ 7♣, Dee mucks 5♣ 5♦). Scenes `review-shown` and `review-fold-out` in `e2e/support/table-scenes.tsx` and `table-harness-bundle.ts`.
- `docs/ui/review.md` — "Shown hands" section and a Security line.
- No new dependencies. No engine, bot, advice or stats changes.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..05 | Ben's cards shown; mucked, folded and fold-out cards absent; panel data holds only shown cards; no dealing from the replay code | `tests/ui/review-shown.acceptance.test.tsx` | PASS | judge/round-1.json |
| SPEC-06 | `shownOpponents` model | `tests/table/review-shown.test.ts` | PASS | judge/round-1.json |
| SPEC-07, 08 | Browser scenes and live hand vs the stored record; Chromium and WebKit; axe | `e2e/review-shown.spec.ts` | PASS | judge/round-1.json |
| SPEC-09, 10 | lint, typecheck, `npm test`, golden suite, playtest, existing e2e | gates | PASS | gates/build-1.json, gates/fix-2.json |
| SPEC-11 | Docs | read of `docs/ui/review.md` | PASS | judge/round-1.json |

- `npm test`: 1228 passed, 43 skipped (existing opt-in slow tests). Table coverage 98.4% of lines.
- Judge round 1 passed 11/11. In the live app on Chromium and WebKit it checked 35 reviews with 35 distinct random replay codes. 29 had shown opponents and 6 had none. Every row matched the stored record and the table's showdown display. A search against all 52 cards found no hidden-card traces in text, attributes, titles or `data-card`. The review had no horizontal overflow, and every request was same-origin. Locked-test hashes matched.

## Review
Round 1: code review had 1 MINOR and 2 NITs, security review had no findings. No blocking findings.

### Non-blocking review notes (deliberately not fixed)
- MINOR: `reviewHeader` in `Table.tsx` now returns `{ summary, shown }`, so the name understates what it returns. Suggested rename: `reviewPanelData`.
- NIT: `.review-shown .table-cards { gap: 4px }` in `styles.css` is not in the spec's CSS list. It is harmless.
- NIT: the live e2e test (SPEC-08) does not assert that an opponent was shown. A fold-out hand also passes it. See reviews/round-1/code.json.

## How to try it
`npm run dev`, start a game and play a hand to showdown. The review panel lists the opponents whose cards the table showed. After a fold-out it lists none.
`npx playwright test e2e/review-shown.spec.ts`

## Run metrics
Questions 1 · assumptions 6 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · changed lines 641 (11 files in the gate).

## Known limitations and follow-ups
- [trainer] Rename `reviewHeader` to `reviewPanelData` in `src/ui/table/Table.tsx` (code MINOR). Owner: TASK-9.
- [trainer] Make the SPEC-08 live e2e test (`e2e/review-shown.spec.ts`) assert that at least one hand showed an opponent, so it cannot pass with fold-outs only (code NIT). Owner: TASK-9.
- [trainer] Drop or justify the extra `.review-shown .table-cards { gap: 4px }` rule in `styles.css` (code NIT, harmless).
- Out of scope: reviews rebuilt from stored records (history screens), and showing a mucked hand on request (never, per REQ-043.6).

## Lessons for the factory (proposals — not applied)
- The spec's SPEC-04 wording conflicted with the always-visible user header, which forced a build-time deviation. The spec template could ask for hidden-card searches to say whether the user's seat is included.
