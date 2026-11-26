# TASK-9.10: Handle a failed decision grade cleanly and test the pending-grades state

Status: Done · Completed: 2026-11-26 · Epic: TASK-9 — Review the hand just played · Milestone: m-1 · Requirements: n/a (follow-up from TASK-9.3 doc-117 and TASK-13.1 doc-143) · Branch: doit/TASK-9.10

## What was asked
Each user decision is graded by the advice worker as it is made. If one grade request rejected mid-hand, nothing handled the rejection until the hand ended. The browser then fired `unhandledrejection`, and since TASK-13.1 that shows the app error screen mid-hand. The acceptance criteria:
1. A rejected grade raises no `unhandledrejection`, the hand end still logs `Hand record could not be saved`, and no review panel opens (Chromium and WebKit).
2. A finished hand with pending grades shows no review `<aside>` and does show Deal next hand.
3. The failed-grade outcome is handled deliberately and `docs/ui/navigation.md` states what the user sees.

Spec: doit/TASK-9.10/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| Q-1 (A) | After a grade fails mid-hand, the hand plays to its result and the result stays on screen. There is no review panel or badge, and no next hand is dealt (Deal next hand does nothing). Leave table and Home still work, Resume re-deals that hand number, and there is no error screen. This was auto-accepted as the recommended option. | yes | It matches the documented write-failure rule and store failures. TASK-13.3 adds the message and Retry later. | Rethrow the grade failure to the error boundary, either at hand end (option B) or mid-hand (option C, which contradicts AC#1). Change `decision-grades.ts` and the docs. |
| A-1 | The no-op handler is attached in `requestNewGrades` (the pure tracker), not in `requestDecisionGrade`. | yes | It covers every request function. It also covers a hand that never ends, such as Home mid-hand. It can be unit-tested under the node environment. | Move `.catch` into `requestDecisionGrade` in `useTableSession.ts`. |
| A-2 | The e2e fault answers the next `grade` request with an `ok:false` reply on a microtask. The worker stays healthy. | yes | A worker crash would break the next bot request and hide the grade behaviour behind the bot error path. | Dispatch a worker `error` event instead. |
| A-3 | The e2e test faults a Call or Check on the user's first preflop turn. | yes | A preflop Call or Check never ends the hand, so the rejection is certainly mid-hand. | Fault a Fold and check that the hand is still running. |
| A-4 | The new tests are not marked slow. They run on every `npm test` and `npm run e2e`. | yes | They are behaviour checks, not speed or scale checks. | Add the slow marker. |

## Clarifications and decisions
- Q-1 asked what the user sees once the hand ends after a grade failed. It was auto-accepted as (A), as above. Follow-up: TASK-13.3 must know a write can fail because grading failed, so its Retry must re-request grades.
- D-1: each grade promise gets a no-op rejection handler when it is requested. The failure is handled once, at hand end, by the existing record-write path. Rethrowing at once would contradict AC#1.
- D-2: the user-visible outcome is Q-1 (A).
- Not done on purpose:
  - No new UI, retry or main-thread fallback grading.
  - The store-write failure path is unchanged.
  - `AppRoot`, `ErrorScreen` and the unhandled-rejection classifier are unchanged.
  - Bot-decision failures still show the error screen.
  - No locked test was edited.

## What was built
`requestNewGrades` in `src/table/decision-grades.ts` now calls a no-op catch on each new request promise. It still stores the original promise in `pending`, so `gradedDecisions` rejects with the same error as before. At hand end the existing record-write chain logs `Hand record could not be saved`. `onHandGraded` is never called, so the review stays pending: no `<aside>`, Deal next hand shown.

| File | Purpose |
|---|---|
| `src/table/decision-grades.ts` | The handler, plus an updated doc comment. This is the only production change. |
| `tests/table/decision-grades-rejection.test.ts` (new) | Unit tests for the tracker. |
| `tests/ui/review-pending.acceptance.test.tsx` (new) | Markup test for the pending-grades state. |
| `e2e/support/fault-injection.ts` | Test-only `reject-grade` fault (one-shot `ok:false` reply, sets `__tlhGradeFaulted`) and a `gradeFaulted(page)` reader. |
| `e2e/grade-failure.spec.ts` (new) | Chromium and WebKit end-to-end test. |
| `docs/ui/navigation.md` | New "Failed decision grade (TASK-9.10)" paragraph. A failed grade is noted as not an error-screen cause. Tests-list lines added. |
| `docs/ui/review.md` | The Timing paragraph now says no unhandled rejection and no error screen. |

There are no new dependencies and no configuration changes.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | `e2e/grade-failure.spec.ts` (Chromium and WebKit). It checks that the fault fired before the hand ended, no error heading, no `<aside>`, the failed-save log, 0 `unhandledrejection` events, no page errors, still `Hand #1`, Leave table works, and nothing stored. | PASS | gates/fix-2.json, judge/verdict-1.json |
| SPEC-02 | AC#2 | `tests/ui/review-pending.acceptance.test.tsx`: no `<aside` and one Deal next hand, for open true and false. | PASS | same |
| SPEC-03, SPEC-04 | AC#1, AC#3 | `tests/table/decision-grades-rejection.test.ts`: no process `unhandledRejection`, `gradedDecisions` rejects with the same error, `pending` holds the original promises. | PASS | same |
| SPEC-05 | AC#3 | Docs updated, with the outcome checked against the spec. | PASS | judge round 1 |
| SPEC-06 | — | Full gate (`npm test` plus checks). | PASS | gates/build-1.json, gates/fix-2.json |

- Judge round 1: PASS. Test suite PASS, end-to-end PASS, no failed or missing items, no unproven AC or DoD.
- Gates: 2 runs (build, fix), both PASS. The code reviewer judged that the unit tests would fail if the handler were missing or if the derived promise were stored.

## Review
Round 1 had no blocking findings. The code review passed every rubric item and the security review had no findings. The src change only attaches a no-op catch and keeps the original promise, so it fails closed. The fault injection is test-only and nothing in `src/` imports `e2e/`.

### Non-blocking review notes (deliberately not fixed)
None. No MINOR or NIT findings were raised.

## How to try it
- `npm test` (unit and acceptance).
- `npm run e2e -- e2e/grade-failure.spec.ts` (Chromium and WebKit, against the built app).

## Run metrics
Questions: 1 (auto-accepted) · assumptions logged: 4 in the spec, plus Q-1 · review rounds: 1 (0 findings) · judge rounds: 1 (PASS) · gate runs: 2 · escalations: 0 · sendbacks: 0 · changed lines: 230 in the gate's count (src, tests, e2e and docs; the spec budget was 240).

## Known limitations and follow-ups
- [trainer] TASK-13.3 (save-failure message with Retry and Leave table): its Retry must handle a write that failed because grading failed. Retry must re-request the grades, not only re-run `store.add`. The orchestrator is adding this as an AC on TASK-13.3.
- A failed grade is silent to the user for now (result stays, nothing is dealt, no message) until TASK-13.3 lands.

## Lessons for the factory (proposals — not applied)
Nothing went wrong or slow in this run, so there are no proposals. state.json shows `questions: 0` and `assumptions: 0` although one question and four assumptions were recorded. The counters appear not to be updated by the spec or QA stages.
