---
id: doc-147
title: 'TASK-2.21: Harden the end-paused-session path'
type: other
created_date: '2026-11-25T20:55:00Z'
updated_date: '2026-11-25T20:55:00Z'
---
# TASK-2.21: Harden the end-paused-session path: in-transaction recheck, focus after failure, early-open test

Status: Done · Completed: 2026-11-25 · Epic: TASK-2 · Milestone: m-1 · Requirements: REQ-004.1, REQ-004.4, REQ-044.7, REQ-044.8 · Branch: doit/TASK-2.21

## What was asked
Three follow-ups from TASK-2.7 (doc-123). (1) `ended()` must not re-end a session that is already ended (another tab could end it between the pre-check and the write). (2) After a failed "End session and start", focus must return to Start game. (3) A test must fail if the Table opens before the end finishes. Spec: doit/TASK-2.21/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | An already-ended session makes `ended()` reject with `DOMException('Session already ended', 'ConstraintError')` and write nothing. Applies to `endSession` and to the confirmed id in `endPausedSessions`. | yes | Locked TASK-10.1 test requires `ConstraintError` when ending an ended session that has a report; one rule now covers records with and without a report. | Resolve `null` with no write (breaks the locked test; needs a locked edit). |
| A-2 | If another tab ends the confirmed session in the gap, Confirm fails like any other failure: error logged, dialog closes, focus to Start game, no game starts. The next Start game starts at once. | yes | Follows from A-1 with no new App branch; needs two tabs, rare. | Treat "already ended" as success in App (needs an error-type branch). |
| A-3 | The failed-Confirm e2e is made deterministic by seeding a stored report for the unended paused session, so the report `add` fails with `ConstraintError`. | yes | Real code path, no injection hook. | Throw from `IDBDatabase.prototype.transaction` as in `e2e/session-end-retry.spec.ts`. |
| A-4 | The early-open test holds the end transaction (scope `hands, reports, sessions`) open using the TASK-2.20 hold, generalised by scope. | yes | Without the hold the early-open race would fail only sometimes. | Timer delay in an init script. |
| A-5 | New tests go in new files that run on every push; each e2e case plays at most one hand. | yes | Keeps locked TASK-2.7 files untouched; suite stays fast. | Add cases to locked `e2e/new-game-confirm.spec.ts`. |

## Clarifications and decisions
No questions asked (autopilot; qa.md). Decisions:
- D-1: the `isEnded` check sits in `ended()`'s read callback, before the 0-hand delete, so it shares the transaction with every write and also protects an ended 0-hand record.
- D-2: the focus fix lives in `GameConfigScreen` (a layout effect when a shown end prompt is cleared while Config stays mounted), not in App or the dialog.
- D-3: `armSessionsHold(page, scope = ['sessions'])`; default unchanged.

## What was built
- `src/storage/hand-store.ts`: `ended()` aborts with `ConstraintError` when the record it reads is already ended (order: absent → null; parse fail → abort; ended → ConstraintError; 0 hands → delete; else report path). The outside-transaction filter in `endPausedSessions` stays as a cheap skip.
- `src/table/session-report.ts`: `SessionEnder` doc says an already-ended session is rejected.
- `src/ui/config/GameConfigScreen.tsx`: focuses Start game when a shown end prompt is cleared.
- `e2e/support/hold-writes.ts`: hold takes an optional transaction scope; the keep-alive chain stays on `sessions`, so the scope must include it.
- `docs/storage/reports.md`, `docs/ui/navigation.md`: updated.
- No change to user-visible text, dialog markup, DB version or stored formats.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | Ended session (no report, 0-hand, with report) not re-ended | `tests/storage/end-recheck.acceptance.test.ts` | PASS | ConstraintError, stores identical; fails on base code |
| SPEC-02 | `endPausedSessions` with ended confirmed id writes nothing | same file | PASS | Judge holdout with a mid-gap end by another connection also passes |
| SPEC-03 | Failed Confirm: focus on Start game, values kept | `e2e/end-session-hardening.spec.ts` (chromium, webkit) | PASS | 0 dialogs, 9 players and $10 / $20 kept, stores unchanged, error logged; judge two-tab holdout agrees |
| SPEC-04 | Table opens only after the end commits; same session id after hand 1 | same e2e | PASS | Held transaction: dialog stays, no header; then 0-hand session, then 1 hand |
| SPEC-05 | Gates | `npm test`, lint, typecheck, `npx playwright test` | PASS | 1412 vitest passed; Playwright 375 passed, 19 skipped, 0 failed |

- Gates: build run and fix run both PASS; scope warn 347 changed lines vs 330 budget (fail above 660).
- Judge round 1: PASS 5/5, no findings. No locked test edited.

## Review
Round 1: code and security reviews had no blocking findings. Security confirmed the earlier MINOR `ended-no-recheck-in-transaction` is closed.

### Non-blocking review notes (deliberately not fixed)
- MINOR: each case in `end-recheck.acceptance.test.ts` calls `endSession` twice (name check, then `instanceof DOMException`); one call would do.
- NIT: `started?.sessionId as string` cast in `e2e/end-session-hardening.spec.ts`.
- TASK-2.7's locked SPEC-08 in `e2e/new-game-confirm.spec.ts` remains weak; the stronger check lives in the new file.

## How to try it
`npm test`; `npx playwright test e2e/end-session-hardening.spec.ts`. By hand: `npm run dev`, put a report for a paused session into IndexedDB `tlh-trainer/reports`, then New game, pick 9 players, Start game, "End session and start". The dialog closes, Start game has focus and 9 players is kept.

## Run metrics
Questions 0 · assumptions 5 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · changed lines 347 (budget 330).

## Known limitations and follow-ups
- A-2: a lost cross-tab race shows no on-screen message (logged only), as in TASK-2.7 A-5.
- [trainer] Tidy the double `endSession` call per case in `tests/storage/end-recheck.acceptance.test.ts` (one call, check type and name together) and drop the `as string` cast in the e2e. Owner: none known.
- [trainer] Strengthen TASK-2.7's SPEC-08 in `e2e/new-game-confirm.spec.ts` (needs a locked-test edit) or accept that the new file covers it. Owner: TASK-2.7 area.

## Lessons for the factory (proposals — not applied)
- Scope budget was exceeded by 17 lines (347 vs 330); estimate test-file size more generously in specs that add two new test files plus a support change.
