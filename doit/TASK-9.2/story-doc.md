# TASK-9.2: Continue to rebuy or leave when I bust with the review open

Status: Done · Completed: 2026-11-24 · Epic: TASK-9 — Review the hand just played · Milestone: m-1 · Requirements: REQ-007 (007.2, 007.6) · Branch: doit/TASK-9.2

## What was asked
When a cash hand takes the user to $0 while the Hand Review panel is held, the control under the table should say `Continue`, not `Deal next hand`. Continue clears the review, deals nothing, and opens the existing `Out of chips` dialog (Rebuy / Leave table). TASK-3.11 already built that path; this story is the label, its tests and the docs. Spec: doit/TASK-9.2/spec.md.

## Assumptions made without asking — please review
All auto-accepted under the unattended-approval rule. No questions were asked.

| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Continue shows whenever a review is held on a bust, including after Close review. | yes | The control is already gated on a held review, not on the panel being open. | Show Continue only while the panel is open. |
| A-2 | Only the text changes: same class, ref (focus after Close review), position, no extra aria-label. | yes | Smallest change; focus and 44 px size carry over. | New class or aria-label. |
| A-3 | Continue runs the existing `onDealNext`, so the review panel closes as the dialog opens. | yes | TASK-3.11 A-3 built and locked this. The dialog is modal. | Keep the review mounted behind the dialog (new state). |
| A-4 | Label uses `userBusted(table)` (cash only), so a sit-and-go user on 0 keeps `Deal next hand`. | yes | Story is cash-only; TASK-5.8 owns the sit-and-go label. | Relabel sit-and-go too. |
| A-5 | The e2e seeds a stored $4/$8 cash session (user on $12, hand 13) with replay words `[1,1,2,3]`; the user busts after three decisions. A headless test pins the result. | yes | TASK-3.11's seed busts with no decision, so no review opens. | Scene harness with a fixture table. |
| A-6 | One assertion in the locked TASK-3.11 test `tests/ui/bust-dialog.acceptance.test.tsx` changed (see qa.md): held bust review now expects `>Continue</button>` and not `Deal next hand`; the `<dialog` check stays. | yes | The old assertion contradicts AC#1. | Revert the edit (that test then fails). |

## Clarifications and decisions
- No questions (Q) asked. Locked-test edit auto-accepted (qa.md).
- D-1: `TableView` derives the label from `userBusted(table)`; no new prop.
- D-2: Button text is exactly `Continue` (fixed by AC#1 / REQ-007.6).

## What was built
- `src/ui/table/Table.tsx`: the held-review button text is `{userBusted(table) ? 'Continue' : 'Deal next hand'}`; two comments updated. No type, prop or style change.
- `tests/ui/bust-continue.acceptance.test.tsx` (new): markup checks plus a headless pin of the e2e seed.
- `e2e/bust-continue.spec.ts` (new): live flow in Chromium and WebKit with axe.
- `tests/ui/bust-dialog.acceptance.test.tsx`: the A-6 locked edit.
- `docs/ui/navigation.md`: "Continue on a bust" paragraph.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1, AC#6 | UI test: open and closed held bust review shows one Continue, no Deal next hand, no dialog | PASS | judge round 1; fails under a mutation |
| SPEC-02 | AC#4 | UI test: $1, REVIEW_FOUR, sit-and-go bust keep Deal next hand | PASS | mutation-checked |
| SPEC-03 | seed | Headless pin: user busts after 3 decisions, stacks `[174,160,160,158,0,160]` | PASS | judge round 1 |
| SPEC-04 | AC#1-3 | e2e: Continue opens dialog, deals nothing, Rebuy deals Hand #14 with $160, axe clean | PASS | both browsers |
| SPEC-05 | AC#5 | e2e: Leave table pauses to Home, records stay `[13]`, Resume reopens dialog | PASS | both browsers |
| SPEC-06 | AC#2 | Existing `rebuy.acceptance` test unchanged | PASS | |
| SPEC-07 | AC#1 | Locked bust-dialog test with A-6 edit | PASS | |
| SPEC-08 | DoD | lint, typecheck, `npm test`, golden, 10,000-hand playtest | PASS | 1206 passed, 0 failed; 0 invariant violations |
| SPEC-09 | DoD | Docs paragraph; N/A items | PASS | |

- Judge round 1 passed 9/9 with no failures, including independent live holdout flows (8/8 in both browsers) and mutation checks. Gates: build-1 and fix-2 both PASS.

## Review
No blocking findings (code and security, round 1).

### Non-blocking review notes (deliberately not fixed)
- NIT (code): the A-5 seed builder is duplicated in `tests/ui/bust-continue.acceptance.test.tsx` and `e2e/bust-continue.spec.ts`, so the two could drift. The spec asked for the copy.
- Security: no findings.

## How to try it
- `npm run dev`, play a $4/$8 cash game until you bust after making a decision. Click `Continue` under the table.
- `npx playwright test e2e/bust-continue.spec.ts e2e/rebuy.spec.ts e2e/review.spec.ts`
- `npm test`

## Run metrics
Questions 0 · assumptions 6 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · changed lines 273 (5 files).

## Known limitations and follow-ups
- [trainer] Dedupe the A-5 seed builder into a shared test-support module used by the unit and e2e tests (code NIT). Owner: TASK-9.2 follow-up, no existing owner.
- [trainer] Leave table only pauses to Home until TASK-10.1 ends the session. Owner: TASK-10.1.
- [trainer] Continue closes the review panel as the dialog opens (A-3); keeping it visible behind the dialog is not done. No owner.
- [trainer] A stopped sit-and-go keeps `Deal next hand` until `See results`. Owner: TASK-5.8.

## Lessons for the factory (proposals — not applied)
None. The run had no failures, no send-backs and one review and judge round.
