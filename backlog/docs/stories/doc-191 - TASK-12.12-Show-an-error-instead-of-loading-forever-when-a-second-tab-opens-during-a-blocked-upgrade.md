---
id: doc-191
title: >-
  TASK-12.12: Show an error instead of loading forever when a second tab opens
  during a blocked upgrade
type: other
created_date: '2026-11-27T13:02:00Z'
updated_date: '2026-11-27T13:02:00Z'
---
# TASK-12.12: Show an error instead of loading forever when a second tab opens during a blocked upgrade

Status: In review (not set to Done) · Completed: 2026-11-27 · Epic: TASK-12 — Tune the trainer · Milestone: m-1 · Requirements: n/a (follow-up from TASK-12.10 doc-188 J-2-01 and TASK-12.11 A-3) · Branch: doit/TASK-12.12

## What was asked
1. If an old-build connection blocks the v5 database upgrade and a second app tab is opened, that tab's open used to queue behind the first tab's blocked request, get no event, and leave Home loading forever. It must now reject with `UpgradeBlockedError` after a bounded wait, so the tab shows its existing failure state, with a test.
2. TASK-12.10 tidy-ups: correct the version table in `docs/storage/hand-records.md` to 5, and remove a redundant reset, a dead guard and an over-long docblock line in `hand-store.ts`. All storage tests must still pass.
3. An e2e with a held write that pins TASK-12.11 A-3: after a failed settings save showed the message, the next change clears it before that save settles.

Spec: doit/TASK-12.12/spec.md.

## Assumptions made without asking — please review
Autopilot run, no questions asked. A-1 is user-visible timing and is the one to look at.

| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | **Open timeout is 10 s** (`OPEN_TIMEOUT_MS = 10_000`), measured to the request's first event (`blocked`, `upgradeneeded`, `success` or `error`). A slow upgrade never counts. | yes | Measured in Playwright Chromium: first event 0-1 ms, whole first-run upgrade 0-1 ms. A false timeout is costly (Home hides Resume, settings fall back to defaults), so it errs long. The only cost is a 10 s wait in the rare two-tab-blocked case, instead of forever. | Change the constant (5 s is snappier, 30 s safer). |
| A-2 | A timed-out open is handled exactly like a blocked one: rejects `UpgradeBlockedError`, is tracked as the pending `blockedOpen`, a late success closes its connection at once, and the next store call retries. | yes | One recovery rule, reusing TASK-12.10. | Introduce a separate error type (callers do not distinguish). |
| A-3 | `openHandStore` gets a third optional parameter `openTimeoutMs`; `OPEN_TIMEOUT_MS` is exported. App code is unchanged. | yes | Tests use ~200 ms rather than 10 s. | Use fake timers (fragile with fake-indexeddb). |
| A-4 | The "redundant reset" is removed: `onBlocked` just sets `blockedOpen = settled`, and nothing sets it back to null. | yes | The TASK-12.10 r2 reviewer's suggestion; no behaviour change. | Restore the `.then` reset. |
| A-5 | `e2e/support/hold-writes.ts` runs its keep-alive `count()` on `sessions` when in scope, else on the first store of the scope, so a `settings` write can be held. | yes | Smallest change; existing callers unchanged. | Add a separate helper. |
| A-6 | The new e2e carries its own ~15-line copy of the TASK-12.11 "fail settings puts" init script. | yes | The original is private to TASK-12.11's locked acceptance file. | Move it to `e2e/support/` (needs a locked-file edit). |

Note: `state.json` shows `assumptions: 0` because no counter was incremented. The six assumptions above come from spec.md.

## Clarifications and decisions
No questions asked.
- D-1: Bound the wait for an open's first event and reuse the blocked-open path. Rejected: BroadcastChannel/`navigator.locks` cross-tab detection, because store instances in different tabs share no state.
- D-2: The timer measures time to the first event, not to `success`, so a slow first-run upgrade cannot be cut off.
- D-3: The AC#3 test is a new file, `e2e/settings-save-held.spec.ts`, so TASK-12.11's locked acceptance file is untouched.

## What was built
- `src/storage/hand-store.ts` (+37/-15):
  - `OPEN_TIMEOUT_MS = 10_000` is exported.
  - `opened()` takes a `timeoutMs` and starts a timer after `factory.open`. A `giveUp()` that is idempotent (guarded by `settle`) rejects `UpgradeBlockedError` through the blocked-open path.
  - `onblocked`, `onupgradeneeded`, `onsuccess` and `onerror` all clear the timer first.
  - `openHandStore(factory, name, openTimeoutMs = OPEN_TIMEOUT_MS)`. `sharedHandStore()` is unchanged.
  - Tidy-ups: no `.then` reset, no `db === opening` guard, docblock rewrapped to 120 columns or fewer.
- `docs/storage/hand-records.md`: version table to 5 with `meta` since 5, plus one sentence on the open timeout.
- `e2e/support/hold-writes.ts`: can hold a write whose scope excludes `sessions`.
- `tests/storage/upgrade-blocked.test.ts` (+41) and `e2e/settings-save-held.spec.ts` (new, 83 lines).

Worked example (second tab): tab 1 `count()` gets `blocked` and rejects at once. Tab 2 `count()` is queued with no event, and after 10 s it rejects `UpgradeBlockedError`. The App's paused-session handler sets `paused = null`, so Home leaves loading. When the blocker closes, tab 2's queued request succeeds and closes itself, and tab 2's next call opens v5.

No new on-screen text (TASK-12.10 Q-1: reject, use existing failure states). No new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | Vitest `upgrade-blocked.test.ts`: queued second store rejects after the timeout, recovers, leaves no stray connection | PASS | Rejects in 201 ms with a 200 ms timeout; a `DB_VERSION+1` raw open upgrades from oldVersion 5 unblocked. The judge also checked the default 10 s rejection independently. |
| SPEC-02 | AC#1 | Vitest: an answered open never times out; `OPEN_TIMEOUT_MS === 10000` | PASS | Judge re-checked first-run and re-open with a 30 ms timeout. |
| SPEC-03 | AC#2 | `vitest run tests/storage` plus grep/awk checks on docs and `hand-store.ts` | PASS | 15 files and 45 tests passed. |
| SPEC-04 | AC#3 | `e2e/settings-save-held.spec.ts` (chromium and webkit) | PASS | Hold state is `held`, no alert, toggle unchecked, stored value correct after release. |
| SPEC-05 | AC#3 | The pause-history, end-session-hardening, settings-save-failed and settings-save-held e2e files | PASS | 20 passed. |

- `npm test`: 1545 passed, 0 failed (348 files, 11 skipped; 60 opt-in slow tests skipped). Full Playwright: 413 passed, 19 skipped, 0 failed. Format, lint and typecheck exit 0. Test integrity is clean.
- Judge round 1: PASS on all 5 items. Gates: build-1 and fix-2.

## Review
Round 1 had no blocking findings. Security review is clean. The code reviewer passed all 13 rubric items.

### Non-blocking review notes (deliberately not fixed)
- MINOR: the SPEC-02 test cannot detect a missing `clearTimeout` in `onupgradeneeded`. The fake-indexeddb upgrade takes about 1 ms, inside the 50 ms timeout. It does catch a missing clear in `onsuccess`. The spec marks D-2 as covered by design.
- NIT (judge J-1-01, LOW): `docs/storage/hand-records.md:28` is 134 characters because the edited paragraph was not rewrapped. Prettier passes.
- NIT: `hold-writes.ts:42` uses `stores[0] ?? 'sessions'`, a fallback needed only by `noUncheckedIndexedAccess`. The comment explains it.

## How to try it
- `npx vitest run tests/storage/upgrade-blocked.test.ts`
- `npx playwright test e2e/settings-save-held.spec.ts e2e/settings-save-failed.spec.ts`
- `npm test`

## Run metrics
Questions asked: 0 · assumptions logged: 6 (spec) · review rounds: 1 · judge rounds: 1 · gate runs: 2 · escalations: 0 · sendbacks: 0 · changed lines (src, tests, e2e, docs): +181/-29 across 5 files, plus the new e2e file.

## Known limitations and follow-ups
- A real two-tab, old-build scenario was not run in a browser. It is covered through fake-indexeddb (SPEC-01) because it needs an old build holding a v4 connection.
- The second tab shows the failure state only after 10 s.
- [trainer] Rewrap the blocked-handling paragraph in `docs/storage/hand-records.md` (lines 27-35) to about 115 columns. Owner: any open docs-tidy task, otherwise add it as an AC on TASK-12.12's parent TASK-12.
- [trainer] Optional: add a SPEC-02 case with a slowed upgrade so a missing `clearTimeout` in `onupgradeneeded` fails a test. Owner: TASK-12.
- Not tracked (infra, below the value bar): the `?? 'sessions'` fallback style in `hold-writes.ts`.

## Lessons for the factory (proposals — not applied)
- The run went smoothly. One small point: doc edits are only checked by SPEC grep commands, so a doc line-width check slipped through. Consider adding "prose lines in edited docs wrap like the surrounding file" to the builder checklist. This is a proposal only.
- `state.json` `assumptions` stayed 0 although the spec lists 6. Consider having the orchestrator count the spec table.
