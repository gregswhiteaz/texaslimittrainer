---
id: doc-50
title: 'TASK-2.18: Pin Home focus, user-seat cards and config-driven stacks in tests'
type: other
created_date: '2026-11-21T02:09:00Z'
updated_date: '2026-11-21T02:09:00Z'
---
# TASK-2.18: Pin Home focus, user-seat cards and config-driven stacks in tests

Status: Done · Completed: 2026-11-20 · Epic: TASK-2 · Milestone: m-0 · Requirements: n/a (follow-up from the TASK-2.1 review, doc-23) · Branch: doit/TASK-2.18

## What was asked
Three TASK-2.1 behaviours were correct but unpinned (a mutant of each survived review): Home must not steal focus on first load; the user's face-up cards must come from the configured user seat; session stacks must follow `config.seats`. Add a test for each that fails on its mutant. Test-only chore. Spec: doit/TASK-2.18/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | The focus check (AC#1) is a Playwright test, not Vitest. | yes | Vitest runs in node with no DOM, so `useEffect` never runs under `renderToString`. | Add jsdom plus a testing library (new dependency). |
| A-2 | "Seat 5 hard-coded" now means `playerView(table.hand, 5)` at `src/table/table-view.ts:143`. | yes | The `p.seat === 5` line the review named no longer exists. | Also mutate `isUser`; already caught by an existing test. |
| A-3 | The stacks config uses seats 1, 3, 5, 7, 9 (user 5, button 9). | yes | Differs from DEFAULT_SEATS (1-6) in both numbers and count. | Use seats [1,2,4,5,6]. |
| A-4 | The first-load check waits 500 ms after the h1 is visible, then reads `document.activeElement` once. | yes | The check would pass trivially before the focus effect runs. | Use `requestAnimationFrame` plus a `setTimeout(0)` round-trip. |

## Clarifications and decisions
No questions asked (autopilot). D-1: new test files, not edits to locked ones.

## What was built
Three new test files, no production changes, no new dependencies (57 lines total):
- `e2e/home-first-load.spec.ts` (SPEC-01): focus is on `body`, not the h1 "TLH Trainer".
- `tests/ui/user-seat-cards.acceptance.test.tsx` (SPEC-02): the `data-user` seat is seat 1 and its "Your cards" codes equal seat 1's engine hole cards (read from `HandState`, not through `playerView`).
- `tests/table/session-stacks.acceptance.test.ts` (SPEC-03): `seatSession` stacks are `[{seat:1..9 odd, stack:160}]`.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | Playwright, Chromium and WebKit; mutant M1 (`useHeadingFocus.ts:11` guard removed) | Pass; M1 fails both browsers | received `{onBody:false,onHeading:true}` |
| SPEC-02 | AC#2 | Vitest; mutant M2 (`playerView(table.hand, 5)`) | Pass; M2 fails | `['4c','Qd']` vs `['Js','9s']` |
| SPEC-03 | AC#3 | Vitest; mutant M3 (`DEFAULT_SEATS.map`) | Pass; M3 fails | 6 entries instead of 5 |

- `npm test`: 104 files, 367 passed, 6 skipped. Lint, typecheck and format clean. `git diff --stat src` empty after the mutant runs.
- Judge round 1: PASS, no failures, no unproven AC or DoD. Gate runs: 1.

## Review
Round 1 (code and security): no findings. The reviewer re-ran all three mutants independently and confirmed `src/` is clean.

### Non-blocking review notes (deliberately not fixed)
None.

## How to try it
`npx vitest run tests/ui/user-seat-cards.acceptance.test.tsx tests/table/session-stacks.acceptance.test.ts` and `npx playwright test e2e/home-first-load.spec.ts`.

## Run metrics
Questions 0 · assumptions 4 · review rounds 1 · judge rounds 1 · gate runs 1 · escalations 0 · sendbacks 0 · changed lines 57 (3 files).

## Known limitations and follow-ups
Left over from the TASK-2.1 review and excluded by the spec:
- [trainer] Add a test that the "Your shown cards" showdown path (`src/table/hand-result.ts:84`) shows the user's own cards. Owner: TASK-3.22 (Pin the hand-result edge cases); TASK-1.15 is the other candidate.
- [trainer] Make `resolveSessionConfig`'s shallow Partial merge unable to produce an inconsistent config (MINOR). Partly owned by TASK-3.10 AC#5 (`assertSessionConfig` on stored configs); the merge path for in-app Partial configs has no owner.
- [trainer] Remove the unused TABLE_SIZE_NAMES entries (NIT). No owner found; TASK-2.2 (choose table size) is the natural one.

## Lessons for the factory (proposals — not applied)
None; the run had no send-backs, failures or findings.
