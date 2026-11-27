# TASK-1.57: Make the players-choice table-size e2e test reliable on WebKit after Leave table

Status: Ready for Done (judge PASS, not set Done) · Completed: 2026-11-27 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-1 · Requirements: n/a (CI follow-up) · Branch: doit/TASK-1.57

## What was asked
Main CI runs 45978923317 and 45982375061 failed once each on WebKit at `e2e/players-choice.spec.ts:143`. After clicking Leave table, the "TLH Trainer" heading was not visible within 5 s. The re-run passed. AC#1: the table-size test passes every time on Chromium and WebKit (for example `--repeat-each 10`) because it waits on the real condition, with no assertion removed or loosened. Spec: doit/TASK-1.57/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | The wait is added only before the two table-screen axe scans (n = 2 and n = 10), not on every iteration. | yes | Only those iterations swap in real timers. Elsewhere a late effect schedules on the paused fake clock and nothing fires. | Move the poll out of the `if` so it runs on every iteration (9 extra IndexedDB reads). |
| A-2 | The wait reuses `storedSessions` and polls until exactly one session record is stored. | yes | Each test has a fresh browser context. Earlier zero-hand sessions are deleted before the test reaches Home. So one record means this Table's start-record effect has run, and the first-deal timer is already queued on the paused clock. | Use a page-side MessageChannel flush. The spec rejected it because it depends on task ordering. |
| D-2 (decision) | Edit the test file locked by TASK-2.2, adding only a wait. | yes | Auto-accepted in autopilot (Q-1). The only alternatives were removing two axe scans or leaving the flake. | Revert the 8-line diff. |

## Clarifications and decisions
- Q-1: Edit the TASK-2.2-locked `e2e/players-choice.spec.ts`? Auto-accepted (autopilot, recommended option): yes. The lock hash was updated under TASK-2.2.
- D-1: Fix the test, not the app. The app behaves as specified. The test swaps in real timers before the Table's mount effects have run.

## What was built
Root cause: a race in the test, not an app bug. `startGame` opens the Table from a promise callback (`src/ui/App.tsx`), so React runs the Table's passive effects in a later scheduler task. Usually that happens before the test's axe scan. When it happens during the scan, `axeWithPausedClock` has replaced `window.setTimeout` with real worker timers. The first-deal `setTimeout(…, 0)` then runs on real time and a whole heads-up hand is played. Leave table then opens the Session report, or the Leave dialog, instead of Home. The CI error-context showed "Session report · 2 players · 1 hand".

Fix: `e2e/players-choice.spec.ts` (+8/−1). It imports `storedSessions` from `./support/hand-records`. Before each of the two table axe scans it runs `await expect.poll(async () => (await storedSessions(page)).length).toBe(1);`, with a comment. No `src/**` change. The shared paused-clock helper and the second test are untouched.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | Acceptance: the table-size test, which asserts the Home heading after every Leave table, n = 2…10 | PASS | 10/10 on Chromium and WebKit with `--retries=0`, and the Linux CI WebKit job |
| SPEC-02 | AC#1 | `npx playwright test e2e/players-choice.spec.ts --repeat-each 10 --retries=0 --project=chromium --project=webkit` | PASS | Judge run: 40 passed (both tests × 10 × 2 browsers), 0 failed, 0 flaky |
| SPEC-03 | AC#1 | `git diff main` has no removed `expect(` lines | PASS | grep exit 1. Diff is import, braces, comment and poll only |

- Full suite: `npm run e2e` gave 401 passed, 19 skipped, 0 failed. Lint, typecheck and format are clean.
- Branch CI run 45983703864 is green (E2E 399 passed, 0 flaky).
- Integrity check (`doit.py test-integrity`) exit 0. Gates: build-1, fix-2 and fix-3, all PASS.
- Judge round 1: PASS, 3/3 items, no unproven ACs.

## Review
Round 1: code and security reviewers returned no findings. The code reviewer confirmed that the start-record effect is declared before the deal effect in the same passive flush, so a stored record means the deal timer is already queued on the paused clock.

### Non-blocking review notes (deliberately not fixed)
None.

## How to try it
`npx playwright test e2e/players-choice.spec.ts --repeat-each 10 --retries=0 --project=chromium --project=webkit`

## Run metrics
Questions: 1 (auto-accepted) · assumptions logged: 2 (plus 1 locked-edit decision) · review rounds: 1 · judge rounds: 1 · gate runs: 3 · escalations: 0 · changed lines: 9 (1 file).

## Known limitations and follow-ups
- The race cannot be reproduced on demand. Proof is repeated passes, not a failing-then-passing test. The trigger depends on scheduler timing.
- Other specs that call `axeWithPausedClock` on a freshly opened Table without waiting for its effects could have the same race. The spec judged them safe because they scan at Home or at the user's turn. No follow-up is proposed because there is no evidence of failures.

## Lessons for the factory (proposals — not applied)
- The failure was first seen in main CI, twice, before it was fixed. No change proposed. The shared helper's comment ("Run it only where nothing is due") already states the rule the test broke.
