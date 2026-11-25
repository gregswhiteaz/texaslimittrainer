---
id: doc-144
title: 'TASK-13.2: Ask the browser to keep my history on first launch'
type: other
created_date: '2026-11-25T18:42:00Z'
updated_date: '2026-11-25T18:42:00Z'
---
# TASK-13.2: Ask the browser to keep my history on first launch

Status: Done · Completed: 2026-11-25 · Epic: TASK-13 — Rely on a private offline app · Milestone: m-1 · Requirements: REQ-052 (REQ-052.4) · Branch: doit/TASK-13.2

## What was asked
On first launch (no stored record) the app calls `navigator.storage.persist()` once and stores the result. The stored flag is "not granted" if the API is missing, rejects or resolves to anything but `true`. Later launches don't ask again. No UI changes; the Settings warning is TASK-12.9. Spec: doit/TASK-13.2/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | The request starts from `src/main.tsx` after the first render, fire-and-forget. | yes | Runs once per page load. A `useEffect` would run twice under StrictMode and again on every Return Home. | Move to App with a module-level once-guard |
| A-2 | If the record can't be read, persist is NOT called. The error is logged. | yes | A result that can't be recorded would be requested on every launch. | Call persist anyway |
| A-3 | If the write fails after persist resolved, log it. The next launch asks again. | yes | No record means ask (task Note). Asking twice is harmless. | Retry in-session |
| A-4 | An invalid stored record reads as `null` (no record), so the next launch asks again and overwrites it. | yes | Self-repairing, as in TASK-12.2. | Reject the read |
| A-5 | `granted` is `result === true`. | yes | Every failure path is "not granted". | Accept truthy values |
| A-6 | Every failure is caught, so nothing reaches AppRoot's `unhandledrejection` error screen. | yes | AC#3 needs Home to open. | n/a |
| A-7 | `persist` is called as `navigator.storage.persist()`, not detached. | yes | A detached call throws "Illegal invocation". | bind |

## Clarifications and decisions
- Q-1 (persisted format; auto-accepted, recommended option): new `meta` object store in DB `tlh-trainer`, version 4 to 5, record `{ granted: boolean }` under key `'persistentStorage'`. The settings record is unchanged. Rejected: second key in `settings` (breaks locked opponent-styles checks), a settings field, and a separate database.
- D-2: `readPersistentStorage(): Promise<boolean | null>` where null means no valid record. TASK-12.9 can tell "never recorded" from "not granted".
- D-3: locked tests that pinned version 4 or the store list were unlocked with reason "TASK-13.2 Q-1" and re-pinned (4 to 5, add `'meta'`). No check was removed.

## What was built
- `src/storage/persistent-storage.ts` (new): `parsePersistentStorage`, `browserPersist(navigator)`, `requestPersistenceOnce(store, persist)`. It reads the record, returns it if present, otherwise calls persist once, writes `granted` and never rejects.
- `src/storage/hand-store.ts`: `DB_VERSION = 5`, `meta` store (additive upgrade, no record created), `readPersistentStorage()` and `writePersistentStorage(granted)`.
- `src/main.tsx`: `void requestPersistenceOnce(sharedHandStore(), browserPersist(navigator))` after render.
- Re-pinned tests/helpers: `tests/storage/{hand-store,settings-store,session-end.acceptance}.test.ts`, `e2e/{home-control,opponent-styles}.spec.ts`, `e2e/support/hand-records.ts`.
- Docs: `docs/storage/persistent-storage.md` (new), `docs/storage/settings.md`.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | e2e, Chromium: real persist wrapped, called once, record stored, same-origin requests only | PASS | e2e/persistent-storage.spec.ts |
| SPEC-02 | AC#2 | e2e, Chromium and WebKit: persist resolves false | PASS | same |
| SPEC-03 | AC#3 | e2e: persist missing or rejecting, Home opens, no pageerror | PASS | same |
| SPEC-04 | AC#4 | e2e: relaunch does not ask again | PASS | same |
| SPEC-05..08 | rules, failures, API lookup, v5 upgrade | unit (fake-indexeddb) | PASS | tests/storage/persistent-storage.test.ts |
| SPEC-09..11 | checks, docs, N/A DoD | gates and review | PASS | gates/build-1.json, fix-2.json |

- `npm test`: 1410 passed; lint and typecheck clean. Full `npm run e2e`: 357 passed, 19 skipped, 0 failed (Chromium and WebKit).
- Judge round 1: PASS 11/11, no findings. It included a real v4 to v5 upgrade of a played profile in both browsers: old stores byte-identical, `meta` created, Resume, Statistics and Settings working, axe clean. It also covered stubbed true, false, reject, sync throw, non-boolean, missing API and never-settling persist.

## Review
Round 1: no blocking findings.

### Non-blocking review notes (deliberately not fixed)
- MINOR: a `parsePersistentStorage` unit test is duplicated.
- NIT: a redundant `Array.isArray` check.
- NIT: the e2e `storedRecord` helper doesn't close the DB on failure.
- Scope: 693 changed lines against a 520 budget. The reviewer judged this justified (mostly the mechanical re-pins and tests).

## How to try it
`npm test` · `npm run e2e -- e2e/persistent-storage.spec.ts`

## Run metrics
Questions 1 · assumptions 7 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · changed lines 693.

## Known limitations and follow-ups
- [trainer] TASK-12.9 (already recorded there): read via `readPersistentStorage()`. `null` means nothing recorded, so show the warning for null as well as false.
- [trainer] E12 Reset all data must also clear the `meta` store, or the request won't be repeated on the next launch. Owner: E12 reset task.
- Nothing is shown to the user yet, and a not-granted result is not retried on later launches (by design).

## Lessons for the factory (proposals — not applied)
- Locked tests that pin the DB version or store list needed three unlock edits. Consider an unlocked shared helper for the version and store names so future schema bumps don't touch locked files.
