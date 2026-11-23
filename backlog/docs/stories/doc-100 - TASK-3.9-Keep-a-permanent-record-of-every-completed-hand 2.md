---
id: doc-100
title: 'TASK-3.9: Keep a permanent record of every completed hand'
type: other
created_date: '2026-11-23T12:19:00Z'
updated_date: '2026-11-23T12:19:00Z'
---
# TASK-3.9: Keep a permanent record of every completed hand

Status: Done · Completed: 2026-11-23 · Epic: TASK-3 · Milestone: m-1 · Requirements: REQ-052 (.1, .2, .5, .6, .7) · Branch: doit/TASK-3.9

## What was asked
When a hand ends, write one permanent record to IndexedDB (the first IndexedDB use in the app). Deal the next hand only after the write has finished. Records hold everything later screens need to rebuild a hand, are add-only, and are never deleted automatically. `onHandComplete` fires exactly once per hand, and a new callback on each render must not restart the 1.5 s next-hand timer. Spec: doit/TASK-3.9/spec.md. No screen or text changed.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Bot ids are integers unique per session: 1..k at seating (ascending seat), each replacement gets `nextBotId`; user seat is `null`. A bot is (sessionId, botId). | yes | AC#6 needs a replacement to differ; names are poor keys. | Use name or UUID as id. |
| A-2 | `TableState.botIds` and `nextBotId` are required fields; the one non-spreading test literal was updated. | yes | Stronger typing. | Make optional. |
| A-3 | Write uses `{ durability: 'strict' }` and counts as done at the transaction `complete` event. | yes | Default relaxed durability can lose a committed write on a process kill. | Default durability. |
| A-4 | The delay/failure seam is a `handStore` option; the wrappers exist only in `e2e/support/records-harness.tsx`. No delay code ships. | yes | Same pattern as `createAdviceWorker`; no build flag that could ship enabled. | Build-time flag. |
| A-5 | The "browser killed after hand 12" test is Chromium only and opt-in (`npm run e2e:slow`). Every push runs a page-reload check instead. | yes | WebKit cannot be hard-killed portably; slow checks are opt-in. | Run on every push. |
| A-6 | "2 years old" is proven by seeding 1,000 records dated 730 to 731 days ago. | yes | The app has no time-based logic. | Fake the clock. |
| A-7 | `parseHandRecord` ignores extra properties. | yes | Later stories can add advice fields. | Reject unknown fields. |
| A-8 | Session id = 32 hex chars from `crypto.getRandomValues(new Uint8Array(16))`, one per `Table` mount. | yes | Works without a secure context; leaves e2e replay-word stubs untouched. | `crypto.randomUUID()`. |
| A-9 | Every-push e2e cost stays small. Measured: about +2.3 s wall locally. | yes | CI budget about 4 min. | Move to `e2e:slow`. |
| A-10 | Existing timing e2e tests pass unchanged. Confirmed: no locked e2e re-pin was needed. | yes | Writes finish in real ms. | n/a |

## Clarifications and decisions
All three questions were auto-accepted as recommended (unattended approval rule).
- Q-1 (D-1): format is database `tlh-trainer` v1, store `hands`, key `['sessionId','handNumber']`, cards as integers 0..51, `completedAt` ISO-8601 UTC string, integer `botId`.
- Q-2 (D-2): if the write fails, no next hand is dealt. The result stays up, Leave table works, and `Hand record could not be saved` goes to the console. No message yet (TASK-13.3).
- Q-3 (D-3): `fake-indexeddb` 6.2.8 added as an exact-pinned dev dependency (Apache-2.0, no runtime deps) for Node tests.
- D-4: the write starts first; deal time is max(1.5 s, write done). D-5: `onHandComplete` is read via a ref.
- Block 1 (auto-accepted, option 1): TASK-3.1 locked test `tests/table/session.acceptance.test.ts` (botId in expected seats) and `tests/stats/style-stats.test.ts` were re-pinned. These are pure additions of `botId`, with no assertion removed.

## What was built
- `src/table/hand-record.ts` (headless): `HandRecord`, `HandStore` (add / get / count only), `handRecord(...)`, and `parseHandRecord(...)`, which validates field by field and throws `RangeError('Invalid hand record: <field>')`.
- `src/storage/hand-store.ts`: `openHandStore`, `sharedHandStore`. Add-only, strict durability, a duplicate key rejects with `ConstraintError`, and reads are validated.
- `src/table/session.ts`: `botIds`, `nextBotId`, `initialBotIds`, `botId` on `CompletedHand.seats`.
- `src/ui/table/useTableSession.ts`: session id per mount, record write at hand end, auto-deal and `dealNext` chained on the write, `onHandComplete` via ref, `handStore` option.
- Tests: `tests/storage/*`, `tests/table/hand-record.test.ts`, `e2e/hand-records.spec.ts`, `e2e/hand-records-kill.spec.ts` (opt-in), `e2e/support/{records-harness.tsx,hand-records.ts,table-harness-bundle.ts}`.
- `docs/storage/hand-records.md`: the SPEC-19 documentation (database, every field, write-before-deal timing, immutability, failure, validation, test seam, how to run the kill test).
- 40 files, about 1,700 changed lines by the gate's count.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01, 03, 04, 05, 09, 11, 13, 14, 15 | AC#1-#3, #7-#11 | `e2e/hand-records.spec.ts` (Chromium + WebKit) | pass | 18 passed |
| SPEC-02 | AC#1 | `TLH_SLOW_TESTS=1` kill test, Chromium | pass | 1 passed, WebKit skipped by design |
| SPEC-05, 06, 07, 08, 10 | AC#3-#7 | `tests/storage/hand-records.acceptance.test.ts` | pass | locked |
| SPEC-12, 16, 17 | AC#6, #8 | `tests/storage/hand-store.test.ts`, `tests/table/hand-record.test.ts` | pass | incl. strict-durability spy (added in review) |
| SPEC-18 | DoD gates | lint, typecheck, `npm test`, playtest | pass | 928 passed / 35 skipped; `src/table` 100% lines; playtest 0 violations, output SHA unchanged (14d746f7…2e48) |
| SPEC-20 | DoD#7, #10 | `npm run e2e` | pass | 182 passed / 14 skipped; adds about 2.3 s per push |

A mutation check (the write gate replaced with `Promise.resolve()`) made 3 e2e tests fail, then was reverted. Gate runs: 4, all PASS. Judge: see doit/TASK-3.9/judge/. The CI run on the branch was not checked by this step.

## Review
Round 1: 0 blocking findings. Fixed in-story: a durability unit test (code MINOR), the docs privacy wording (security MINOR), a comment move (NIT).

### Non-blocking review notes (deliberately not fixed)
- Security MINOR: `replayCode` in a record lets anyone rebuild the full deck, including bots' mucked cards. The wording in the docs was corrected. A screen rule is tracked as an AC on TASK-9.5.
- Security MINOR: `parseHandRecord` has no cross-field consistency checks (for example awards versus pot). It is tracked as an AC on TASK-3.10.
- NIT: a replay code drawn for a deal that is then discarded while a slow write is pending. It has no user effect and is not tracked.

## How to try it
`npm run dev`, start a game, play two hands, and open DevTools → Application → IndexedDB → `tlh-trainer` → `hands`. Expect one record per hand, the same sessionId, and `completedAt` matching the clock. Run `npx playwright test e2e/hand-records.spec.ts`, and `npm run e2e:slow` for the kill test.

## Run metrics
Questions 3 · assumptions 10 · review rounds 1 · judge rounds: see judge/ · gate runs 4 · escalations 0 · blocks 1 · changed lines about 1,700 (40 files).

## Known limitations and follow-ups
- [trainer] TASK-9.5: a screen that reads records must show only `userHoleCards`, `shown` and `result.showdown`, and never deal from a stored `replayCode`.
- [trainer] TASK-3.10: `HandStore.get` should validate cross-field consistency (awards against pot, seats against actions).
- Pre-existing and not caused by this story: TASK-3.1 integrity error on `tests/ui/table.acceptance.test.tsx` comes from TASK-3.3's build.
- Not in scope: write-failure message, Retry and Leave (TASK-13.3), `navigator.storage.persist` (TASK-13.2), migrations (E13), sessions store (TASK-3.10).

## Lessons for the factory (proposals — not applied)
- The spec said A-2 and A-10 were the only locked-test re-pins, but adding `botId` to `CompletedHand.seats` also broke `tests/table/session.acceptance.test.ts` and `tests/stats/style-stats.test.ts`. This cost a blocked build round. Proposal: the spec step should grep existing tests for literals of any type it extends and list them as pre-approved re-pins.
- The spec's own §8 claim ("never stores bots' unshown cards") was wrong because of `replayCode`. Proposal: add a "derivable data" check to the security part of the spec template.
