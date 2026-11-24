---
id: doc-120
title: 'TASK-9.6: See which reviewed decisions were hinted'
type: other
created_date: '2026-11-24T15:44:00Z'
updated_date: '2026-11-24T15:44:00Z'
---
# TASK-9.6: See which reviewed decisions were hinted

Epic: TASK-9 (Review the hand just played) · Requirements: REQ-040.2, REQ-043.5 · Judge round 1: PASS (9/9 spec items)

## Assumptions to review (decided without asking)
| ID | Assumption | Reversible |
|---|---|---|
| A-1 | The panel reads the stored `entry.decision.hinted`. No new field or model function. | yes |
| A-2 | Tag is an outlined pill, lowercase "hinted" (`<span data-part="hinted" class="hinted-tag">`), right after the grade badge, both inside a right-aligned `review-verdict` group. | yes |
| A-3 | `.review-entry-top` now wraps (`row-gap: 6px`). A river entry with a tag moves the verdict group to a second right-aligned line. Entries without a tag are unchanged. | yes |
| A-4 | Test fixtures come from the real hint state machine (`userTableAfter(..., hints)`). The hinted Major error is a real grade (REVIEW_FOUR with the river call changed to a fold). | yes |
| A-5 | Live flows use the records harness, play check-or-call, at most 5 hands each. | yes |
| A-6 | No locked test needed editing. The new live flows are in a new file, not the locked `e2e/hinted.spec.ts`. | yes |

A-1..A-6 were auto-accepted (qa.md). The tag style (A-2) and row wrapping (A-3) are the ones to look at.

## What was built
A review entry whose stored decision has `hinted: true` shows a "hinted" tag beside its grade badge. The grade still shows, so a hinted Major error reads "Major error" and "hinted". Opening Hint and then hiding it still counts as hinted, because that is how TASK-8.2 stores it. Nothing is regraded.

Changed files (no new dependencies):
- `src/ui/table/ReviewPanel.tsx`: verdict group and tag.
- `src/ui/styles.css`: wrapping top row, `.review-verdict`, `.hinted-tag`.
- `docs/ui/review.md`: "Hinted tag" section.
- Tests: `tests/ui/review-hinted.acceptance.test.tsx`, `e2e/review-hinted.spec.ts`.

## How it was proven
- `npm test`: 1232 passed, 0 failed. Coverage about 95%. Lint and typecheck pass.
- Acceptance tests (SPEC-01..04) render the panel from real hint-state fixtures.
- Playwright on Chromium and WebKit (SPEC-05, SPEC-06) cover Hint at the flop and Hint opened then hidden at the first of 2+ decisions. They also check the tags against the stored records, axe, no overflow and same-origin requests. The judge ran the real built app twice per browser.
- Review round 1: no blocking findings. The security review had none.

## Non-blocking review notes
- NIT, `e2e/review-hinted.spec.ts:214`: `hinted.length === 0 ||` is implied by `decisions.length < 2`. It can be dropped or kept as a readable guard.
- NIT, `src/ui/styles.css:841`: the river-entry-with-tag wrap (A-3) is covered only by the CSS rule. No test renders a 5-card river entry with a tag. The spec accepted this.

## Known limitations and follow-ups
- Hinted decisions are still counted in the G-2 major-error rate (REQ-040.3). Excluding them belongs to the statistics story. [trainer]
- Hint counts are not in the Session Report (REQ-040.4). That belongs to the report story. [trainer]
- Optional: a test that renders a tagged 5-card river entry live, to pin the wrap (NIT above). [trainer], owner TASK-9.6 follow-up.
- Optional: drop the redundant guard in `e2e/review-hinted.spec.ts:214`. [trainer]

Not tracked (infra, below the value bar): none.

## Lessons for the factory
Nothing went wrong in this run. There were no send-backs, questions or escalations, and the gates passed.
