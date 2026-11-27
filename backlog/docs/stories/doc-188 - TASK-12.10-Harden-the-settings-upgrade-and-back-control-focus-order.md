---
id: doc-188
title: 'TASK-12.10: Harden the settings upgrade and back-control focus order'
type: other
created_date: '2026-11-27T11:43:00Z'
updated_date: '2026-11-27T11:43:00Z'
---
# TASK-12.10: Harden the settings upgrade and back-control focus order

Status: Awaiting user review (not set Done) · Completed: 2026-11-27 · Epic: TASK-12 — Tune the trainer · Milestone: m-1 · Requirements: n/a (follow-up from doc-141) · Branch: doit/TASK-12.10

## What was asked
Three follow-ups from the TASK-12.1 review (doc-141): (1) the v3 settings-upgrade unit test must assert the raw `settings` record, not only `readSettings()`, which returns defaults even when no record exists. (2) A blocked IndexedDB upgrade must not leave every store call pending forever. (3) On Settings and Statistics, one Tab from the focused h1 must reach `← Home`. Spec: doit/TASK-12.10/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | `← Home` moves after the h1 in the DOM of both headers. CSS `order: -1` keeps it visually first, so layout is unchanged. | yes | Matches the doc-141 suggestion. Headers are already flex rows. | Use a keydown handler on the h1, or focus `← Home` on open instead of the h1. |
| A-2 | In Statistics the DOM order is h1, `← Home`, totals. | yes | Keeps the button directly after the h1. | Put the button after the totals. |
| A-3 | `UpgradeBlockedError` has the message "The database upgrade is blocked by another open connection". It only reaches `console.error` through the existing failure handlers. | yes | Not user-visible. | Use a DOMException. |
| A-4 | Only a blocked open resets the cached open promise (retry on the next call). Other open errors keep "every call rejects". | yes | A blocked open is transient. A `VersionError` is not. | Retry on every error. |
| A-5 | The upgrade test opens via `store.count()` before reading the raw record. "Upgraded to v4" means upgraded through the v4 step to the current version (DB_VERSION 5). | yes | Keeps the test on the app's own upgrade path. | Open a v4-only DB by hand. |
| A-6 (builder, after judge r1) | A call made while a blocked request is still pending waits up to `BLOCKED_GRACE_MS = 100` ms for it, then rejects with `UpgradeBlockedError`. | yes | Fixes J-1-01 (second call hung behind the pending blocked open). The 100 ms value is the builder's choice. | Change the constant, or time out differently (see follow-ups). |
| Q-1 (auto-accepted) | Option A: reject with `UpgradeBlockedError`, no on-screen text. | yes | Autopilot took the recommended option. | Option B: banner and keep waiting. |
| Q-2 (auto-accepted) | Edit the locked `e2e/settings.spec.ts` (owner TASK-12.1): re-pin the Tab-order expectation and update two comments. | yes | AC#3 cannot be met otherwise. Autopilot took the recommended option. | Revert the edit. |

## Clarifications and decisions
- Q-1 and Q-2 were auto-accepted under autopilot. Both are flagged above for review.
- D-1: a blocked upgrade rejects the open, the next call retries, and a late success of the rejected request closes its connection.
- D-3: the locked settings e2e is re-pinned to the DOM order.

## What was built
- `src/storage/hand-store.ts`: exported `UpgradeBlockedError`. `onblocked` rejects the open. A late success of a blocked open closes its connection. `openHandStore` clears its cached open so the next call retries. While a blocked request is pending, other calls wait up to 100 ms and then reject.
- `tests/storage/settings-store.test.ts`: the v3 upgrade test reads the raw `settings` record.
- `tests/storage/upgrade-blocked.test.ts` (new): covers the blocked rejection, retry after the blocker closes, `versionchange` closing the app's connection, a prompt reject while still blocked, and a late-succeeding open closing its connection.
- `SettingsScreen.tsx` and `StatisticsScreen.tsx`: `← Home` after the h1 in the DOM.
- `src/ui/styles.css`: `order: -1` on the two header back buttons.
- `e2e/settings.spec.ts`: Tab-order expectation re-pinned (Q-2).
- `e2e/back-focus.spec.ts` (new): one Tab from the h1 reaches `← Home` on both screens, and `← Home` stays left of the h1.
- `docs/storage/hand-records.md` and `docs/ui/navigation.md`: updated.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | Raw settings record after the v3 upgrade | Vitest | PASS | tests/storage/settings-store.test.ts |
| SPEC-02..04 | Blocked rejection, retry, close on `versionchange` | Vitest with fake-indexeddb | PASS (SPEC-02 failed in judge r1, fixed) | tests/storage/upgrade-blocked.test.ts, 9 asserts |
| SPEC-05, 06 | One Tab to `← Home` on Settings and Statistics | Playwright e2e | PASS | e2e/back-focus.spec.ts, 8 asserts |
| SPEC-07 | Settings tab walk follows DOM order | Playwright e2e | PASS | e2e/settings.spec.ts |
| SPEC-08 | Layout unchanged | Playwright e2e | PASS | e2e/back-focus.spec.ts |

- Gates: build-1, fix-2, fix-3 and fix-4 all PASS (4 gate runs). Final changed lines 262, over the spec budget of 230. The extra lines come from the J-1-01 fix.
- Judge r1 FAIL: J-1-01. A second store call hung behind the pending blocked open, so SPEC-02 was not met. The fix was the 100 ms grace wait (A-6). Judge r2 PASS on 8 of 8 items, and ACs 1, 2 and 3 are proven.

## Review
Rounds r1 and r2 were clean, with no blocking findings. The only blocking item was the judge's J-1-01, fixed as above.

### Non-blocking review notes (deliberately not fixed)
- MINOR: the `blockedOpen` reset at `src/storage/hand-store.ts:262` is redundant.
- NIT: the `db === opening` guard (`:268`) is dead code.
- NIT: a 170-character docblock line (`:240`).
- Judge J-2-01 (MEDIUM, open): see Known limitations.

## How to try it
`npm test` runs the unit tests, including `tests/storage/upgrade-blocked.test.ts`. The e2e command is `npx playwright test e2e/back-focus.spec.ts e2e/settings.spec.ts`. To check by hand, open Settings, then press Tab once and `← Home` should be focused.

## Run metrics
Questions: 2 (both auto-accepted) · assumptions: 6 plus the 2 auto-accepted decisions (`state.json` counters read 0) · review rounds 2 · judge rounds 2 · gate runs 4 · escalations 0 · changed lines 262.

## Known limitations and follow-ups
- [trainer] Judge J-2-01 (MEDIUM): a second app tab opened while a blocker is open stays on the loading Home menu with no error until the blocker closes. Its open queues behind the first tab's blocked request. Change: time out an unanswered open and reject with `UpgradeBlockedError`. Owner: no existing task known.
- [trainer] `docs/storage/hand-records.md` has a version table that says 4, but `DB_VERSION` is 5. Fix the table. Owner: none known.
- [trainer] Clean up the MINOR and NIT items above (redundant reset, dead guard, long docblock line).

## Lessons for the factory (proposals — not applied)
- The spec's blocked-upgrade design covered only the call after a blocked open. Judge r1 found the hang for a call made while the request is still pending. Proposal: when a spec adds a "reject instead of hang" path, list "calls made while still pending" as a required edge case.
- `state.json` counters (`questions`, `assumptions`) stayed 0 despite two auto-accepted questions and several assumptions. Proposal: have the orchestrator update the counters when Q&A is auto-accepted.
- The scope budget (230 lines) was exceeded by the judge fix (262). Proposal: re-estimate the budget at sendback.
