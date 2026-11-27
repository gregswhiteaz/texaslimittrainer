---
id: doc-196
title: >-
  TASK-13.13: Pin error-recovery history handling and decide on empty paused
  sessions
type: other
created_date: '2026-11-27T20:39:00Z'
updated_date: '2026-11-27T20:39:00Z'
---
# TASK-13.13: Pin error-recovery history handling and decide on empty paused sessions

Status: Judge PASS (not set Done) · Completed: 2026-11-27 · Epic: TASK-13 — Rely on a private offline app · Milestone: m-1 · Requirements: REQ-002.4, REQ-004, REQ-044.8 (context only) · Branch: doit/TASK-13.13

## What was asked
TASK-13.1 left three loose ends (doc-143). (1) No repo test pinned that Return Home after an error steps off the Table's history entry, so one Back leaves the app. (2) A paused session with 0 completed hands (error in hand 1) is offered for Resume as "0 hands · paused", and nobody had decided whether it should be. (3) `AppRoot` keyed `App` with a `generation` counter that did nothing. Spec: doit/TASK-13.13/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | "Does not return to the dead table" is shown by `history.state.tlhTable` being undefined, then one `page.goBack()` reaching `about:blank` (same check as `e2e/pause-history.spec.ts`). | yes | Without `history.back()` in `AppRoot` both assertions fail; a Home-only check would pass without the fix. | Assert only `tlhTable`. |
| A-2 | The hand-1 error is the `illegal-bot` fault, armed after the start record is stored and before any bot acts. Helpers are copied from the locked files, not imported. | yes | Already proven in TASK-13.1; arming late guarantees a 0-hand session exists. | Use `reject-bot` or `worker-error`. |
| A-3 | The new tests run in chromium and webkit on every `npm run e2e` (not opt-in). | yes | Short single-hand scenarios under the paused clock. | Restrict to chromium. |
| A-4 | The `App.tsx` comment "survives AppRoot's remount of App" stays. | yes | App still remounts because the ErrorScreen branch unmounts it. | Reword the comment. |

state.json records 0 assumptions logged; these four are in spec.md section 2.

## Clarifications and decisions
- Q-1: Offer a 0-hand paused session for Resume? Options: A keep offering and pin it; B never offer it (delete on Home load); C discard only after an error. **Answer: A (recommended).** Recorded in the task notes and `docs/ui/navigation.md`. No product, text or locked-test change.
- D-1: Remove `generation` and the `key` prop. Leaving the error state always mounts a fresh App, so the key never changed behaviour.
- D-2: The Q-1 A decision, pinned by SPEC-02.
- D-3: New tests go in a new file so no locked test is edited.

## What was built
- `src/ui/AppRoot.tsx`: `generation` state, its comment and the `key` prop removed. It now renders `<App returned={returned} />`, and `#returnHome` calls `setState({ error:false, returned:true })`.
- `e2e/error-recovery-history.spec.ts` (new, 2 tests, 99 lines). SPEC-01: after a hand-1 error, Return Home focuses the heading, the Table is gone, `history.state.tlhTable` is undefined, and one Back reaches `about:blank`. SPEC-02: the 0-hand session is offered for Resume, and Resume deals Hand #1.
- `docs/ui/navigation.md`: the Q-1 decision line, and the new e2e file added to the Tests list.
- No new dependencies. Diff: 19 files including the doit work folder; product code is 1 file.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | Return Home clears the Table history entry; one Back leaves the app | New e2e, chromium + webkit | PASS | `--repeat-each 5`: 20 passed. Mutation: removing `history.back()` from `#returnHome` made it fail. |
| SPEC-02 | 0-hand paused session offered and resumable | New e2e | PASS | Judge also drove the preview build: subtitle "… 0 hands · paused", `data-paused="shown"`, repeated error then Resume. |
| SPEC-03 | No redundant `generation` key | `grep -nE "generation\|key=" src/ui/AppRoot.tsx` finds nothing; full suite | PASS | Existing e2e still green. |

- `npm test`: 351 files passed, 11 skipped; 1555 tests passed, 60 skipped. `npm run build` ok. `npm run e2e`: 417 passed, 19 skipped, 0 failed. Format, lint and typecheck clean.
- Gates: 2 runs (build-1, fix-2).
- Judge round 1: PASS (3/3). It ran a real uncaught error in the preview build in chromium and webkit, plus 3 completed hands then a fault in hand 4 ("3 hands · paused", one Back reaches `about:blank`). Test-integrity check clean, no locked test edited.

## Review
Round 1, code and security reviews: no blocking findings. Security: no new trust boundary; the fault hook stays in `e2e/support` and the locked check that dist has no `__tlhFault` still holds.

### Non-blocking review notes (deliberately not fixed)
- NIT (code): `e2e/error-recovery-history.spec.ts:14` copies locator helpers, `tableKey` and `runUntilErrorScreen` from the locked `error-recovery.spec.ts` and `pause-history.spec.ts`. This follows the spec. It adds a third copy of the locators.

## How to try it
- `npx playwright test e2e/error-recovery-history.spec.ts`
- Full check: `npm test && npm run build && npm run e2e`

## Run metrics
Questions: 1 (Q-1, answered A) · assumptions logged: 4 in spec (0 in state.json) · review rounds: 1 · judge rounds: 1 · gate runs: 2 · escalations: 0 · sendbacks: 0 · changed lines: about 100 in e2e, 18 in AppRoot, 4 in docs.

## Known limitations and follow-ups
- [trainer] Move the shared Playwright locators and `runUntilErrorScreen` into `e2e/support/` and drop the three copies; touching the locked TASK-13.1 and TASK-2.20 files needs their owners. Low value, so it is optional. No existing task owns it.

Not tracked (infra, below the value bar): none.

## Lessons for the factory (proposals — not applied)
- state.json showed `assumptions: 0` while spec.md lists four. Proposal: have the spec stage update that counter so run metrics match.
