# TASK-8.2: Mark a decision as hinted when I open the hint

Status: Done · Completed: 2026-11-24 · Epic: TASK-8 — Ask for a hint · Milestone: m-1 · Requirements: REQ-036 (036.2), REQ-040 (040.1), REQ-042 (042.5) · Branch: doit/TASK-8.2

## What was asked
If the user opens the hint card at a decision before acting, that decision's hand-record entry gets `hinted: true`, even if the card was hidden again or opened several times. Other entries stay `hinted: false`. A hinted decision is graded as usual, and its stored advice equals what the card showed. Spec: doit/TASK-8.2/spec.md.

## Assumptions made without asking — please review
All five were auto-accepted by autopilot (recommended option). None needed a question.
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Selecting Hint makes the decision hinted even if the card is still loading or the request failed when the user acts. | yes | REQ-040.1 says "requested a hint before acting". | Make `hintedAt` also require a ready card. |
| A-2 | `UserDecision.hinted` is optional and written only when true. Unhinted decisions keep their current shape. | yes | Locked tests deep-compare unhinted decisions. Same pattern as `observed`. | Always write `hinted: false`. That would touch locked tests. |
| A-3 | `applyUserAction(table, action, observed?, hinted = false)` takes a 4th positional parameter. | yes | No existing caller changes. | Use an options object. |
| A-4 | "10 points below required equity" is tested as a real-engine flop call with gap >= 10, graded `major` by `call-fold-margin`. | yes | The real equity engine can't pin exactly 10.0. The boundary is already locked elsewhere. | Add an equity stub seam. |
| A-5 | The e2e test looks for a user flop decision in at most 5 hands (check/call, pinned replay words). | yes | Bot play is seeded and the bound stops it running forever. | Use a fixture-state scene harness. |
| Dev-1 | SPEC-05 deviation (qa.md): it uses REVIEW_DECK with raise / Ben calls / Ben bets flop / user calls / check-check, not `LIMP_THEN_BET`. | yes | In the spec line Ben checks, and the range model never applies observed stats to a check line, so the 29 → 30 control could not differ. All spec assertions still hold. | Rewrite the test line. |

## Clarifications and decisions
- No questions asked.
- D-1: the flag comes from Table's existing `HintState`: `hintedAt(hint, table.hand)` compares the `HandState` token by identity. It is passed through `act(action, hinted)`. No new state.
- D-2: `decisionRecord` writes `hinted: decision.hinted === true`. Grading is untouched.

## What was built
- `src/table/session.ts` — `UserDecision.hinted?`; `applyUserAction` 4th parameter, writes `hinted: true` only when hinted.
- `src/table/hand-record.ts` — `decisionRecord` writes `hinted` from the decision (was hard-coded false).
- `src/table/hint.ts` — `hintedAt(state, decision)`: pure, true iff the hint was opened at this decision. It ignores open, card and failed.
- `src/ui/table/useTableSession.ts` — `act(action, hinted?)`.
- `src/ui/table/Table.tsx` — `onAct` computes `hintedAt(hint, table.hand)` before `setHint(NO_HINT)`.
- `tests/support/table-scenarios.ts` — `userTableAfter` gains a 6th `hints` parameter that drives the real toggle state machine. `REVIEW_DECK` and `LIMP_THEN_BET` are exported.
- Docs: `docs/storage/hand-records.md` (the `hinted` row) and `docs/ui/hint.md` ("Hinted decisions" section).
- Stored advice matches the card because hint and decision share one observed-stats snapshot per decision. No format, parser, grading or UI changes. No new dependencies.

## How it was verified
| SPEC | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| 01-03 | flop-only, hide, 3 opens | `tests/table/hinted.acceptance.test.ts` through the fake IndexedDB round trip | PASS | hinted arrays `[false,true,false,false]`, one hinted entry |
| 04 | hinted bad call still Major | same file | PASS | gap >= 10, `major`, `call-fold-margin`, equal to unhinted record except `hinted` |
| 05 | stored advice equals the card at 29 → 30 hands | same file | PASS | move, label, equity, explanation and opponent basis equal the card. The control differs. |
| 06 | `hintedAt`, `applyUserAction`, `decisionRecord` units | `tests/table/hint.test.ts` | PASS | |
| 07-08 | live table | `e2e/hinted.spec.ts`, Chromium + WebKit | PASS | 4/4 |
| 09 | repo checks | lint, typecheck, `npm test`, golden, playtest | PASS | 1203 passed, golden 282/282, playtest 10,000 hands with 0 violations |
| 10 | docs, CI | docs read, `gh run list` | PASS | CI and Visual green |
- Judge round 1: 10/10 PASS, integrity PASS. Holdout live checks (8/8 on both engines) covered a preflop-only hint, a hint at every decision, a forced worker failure with the card open, and open/hide x3.
- Gates: 2 runs (build-1, fix-2).

## Review
Round 1, code and security. No blocking findings. Security: no reachable vulnerability, since `parseHandRecord` still rejects a non-boolean `hinted`.

### Non-blocking review notes (deliberately not fixed)
- NIT (code): the SPEC-08 "only one hinted entry" assertion guards against a leak only if the hand has more than one decision. The test doesn't assert that (also judge LOW J-1-01). The judge's holdout covered it.
- NIT (code): `hinted === true` in `useTableSession` is redundant, because `applyUserAction` already defaults it.

## How to try it
`npm test -- tests/table/hinted.acceptance.test.ts tests/table/hint.test.ts` and `npx playwright test e2e/hinted.spec.ts`. By hand: `npm run dev`, start a 6-max game, press Hint at a flop decision, then call. After the hand, IndexedDB `hands` shows only the flop entry with `hinted: true`.

## Run metrics
Questions 0 · assumptions 5 (+1 recorded deviation) · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · sendbacks 0 · changed lines +461 / -56 across 12 files (excluding doit/).

## Known limitations and follow-ups
- The review's "hinted" tag is not done here. It belongs to TASK-9.6 (E09-S05), which also owns the cross-epic Playwright flow "hint at flop, hand ends, review shows 'hinted'".
- Hint-usage reporting is E10. Excluding hinted decisions from the G-2 major-error rate is E11.
- `hinted` isn't persisted in the session record. A resumed hand restarts with no decisions, so no stale flag.
- [trainer] Strengthen `e2e/hinted.spec.ts` SPEC-08 to assert the hand has at least 2 decisions (judge LOW J-1-01 / review NIT). Owner: this story's test file (a locked test, so a deliberate edit). No existing task owns it.
- [trainer] Drop the redundant `hinted === true` in `useTableSession.act` (NIT, no behaviour change).

## Lessons for the factory (proposals — not applied)
- The spec's SPEC-05 example hand line could not exercise the 29 → 30 boundary, because the range model ignores observed stats on a check line. Spec authors should check that a worked example can actually differ from its control before locking it.
