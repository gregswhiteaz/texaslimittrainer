---
id: doc-101
title: 'TASK-3.10: Save the session after every hand so it can be resumed'
type: other
created_date: '2026-11-23T13:44:00Z'
updated_date: '2026-11-23T13:44:00Z'
---
# TASK-3.10: Save the session after every hand so it can be resumed

Status: Built, judged PASS, PARKED UNMERGED (see "Review") · Completed: 2026-11-23 · Epic: TASK-3 — Play hands at the table · Milestone: m-1 · Requirements: REQ-052 (REQ-052.3) · Branch: doit/TASK-3.10

## What was asked
The table keeps a session record in IndexedDB: created when the table starts, updated after every completed hand together with that hand's record, so a killed browser loses at most the hand in progress. The record holds what E02 Resume will read (config, seats with bot ids/names/styles/stacks, next button, hands played, rebuys, level, bot counters). The story also adds restore-side validation asked for by earlier security reviews (`assertSessionConfig`, self-consistent `resolveSessionConfig`, `parseSessionRecord`/`restoreSession`, safe `createHand`/`shuffledDeck` on hostile values, cross-field checks in `parseHandRecord`). The Resume screen is E02's. Spec: doit/TASK-3.10/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | `rebuys` is stored, always 0 (bot replacements are not rebuys); TASK-3.11 increments it | yes | Field listed in the description, no rebuy exists yet | Omit until TASK-3.11 (changes format later) |
| A-2 | `level` is `null` for cash, `1` for sit-and-go | yes | Level fixed until TASK-5.4 | — |
| A-3 | Start record written once per `Table` mount (`handsPlayed: 0`), chained before hand 1's write; a start-write failure is logged and does not block dealing | yes | E10 needs 0-hand sessions to exist to discard them | Write only after hand 1 |
| A-4 | A stake is "known" if it passes the engine's `assertChips`; need not be in `CASH_STAKES` | yes | Existing tests use odd valid stakes; fairness rules live in the engine | Require `CASH_STAKES` membership |
| A-5 | Names are 1–40 chars; actions per hand record ≤ 400; `shown.shown`/`showdown`/`awards`/`winners` ≤ 10 | yes | Real values are far below; AC#12 forbids unbounded | Tighter or no bounds |
| A-6 | `parseSessionRecord` ignores unknown extra properties except `hand`/`actions`, which it rejects | yes | Forward compatible, in-progress hand fails closed | Reject every unknown key |
| A-7 | AC#2's "killed in hand 11" is proven by the opt-in kill spec (`npm run e2e:slow`, Chromium); every push runs a reload-mid-hand-3 variant | yes | Hard kill is Chromium-only; slow checks are opt-in | Run kill every push |
| A-8 | Restored stacks must all be >= 1 (createHand rule); relaxed by the busting-out story (TASK-3.21/E05) | yes | Today every seat is refilled before the next deal | Allow 0 now |

## Clarifications and decisions
All three questions were auto-accepted under the unattended rule (recommended option).
- Q-1 (D-1): format is a `sessions` store in `tlh-trainer` v2 (additive), keyPath `sessionId`, one record per session, `put` after each hand.
- Q-2 (D-3): stored state is the next-hand state (`nextHand(table)`: post-replacement/top-up stacks, next button; `handsPlayed` = hand just completed), so restore needs no game logic.
- Q-3 (D-4): the session format never holds a hand. `parseSessionRecord` rejects any `hand`/`actions` property; `restoreSession` returns `hand: null` and never calls `applyAction`. A future live-hand story must add HandState/action validation (noted in docs).
- D-2: session update and hand record in one strict readwrite transaction over `['hands','sessions']`, before the next deal (atomic). D-5: upgrade creates `sessions` only if `oldVersion < 2`, never touches hands; formal migrations stay with E13. D-6: `resolveSessionConfig` makes partial overrides consistent, then validates; explicit contradictions throw. D-7: engine exports `assertChips` (existing stake/stack rules, unchanged messages).

## What was built
- `src/table/session-record.ts` (new, headless): `SessionRecord`, `sessionRecord`, `handWrite`, `parseSessionRecord`, `restoreSession`. Invariant: `restoreSession(sessionRecord(nextHand(t)))` deep-equals `nextHand(t)`.
- `src/table/session.ts`: `assertSessionConfig` (one user seat at `userSeat`, players = seats, seated button, known values), consistent `resolveSessionConfig`.
- `src/table/hand-record.ts`: `HandStore` gains `add(record, session?)`, `putSession`, `getSession`; `parseHandRecord` gains dense-array, name/length bounds, level-vs-game-type, seat-in-list, one-pair-per-seat and no-repeated-card checks.
- `src/storage/hand-store.ts`: DB v2, `sessions` store, atomic `add(record, session)`, validated `getSession`.
- `src/ui/table/useTableSession.ts`: start record at mount; `handWrite` + combined `add` at hand end, deal still waits for the write.
- `src/engine/{hand,deck,cards}.ts`: `assertChips`, sparse/non-object seats rejected with `Invalid hand config`, `echoValue` (never calls a hostile `toString`), `isReplayCode` rejects non-strings.
- E2E support updated to DB v2 (`e2e/support/hand-records.ts`, `records-harness.tsx`); `package.json` adds the kill spec to `e2e:slow`.
- Docs: new `docs/storage/sessions.md`; `docs/storage/hand-records.md` updated. No new dependency, no UI change.

## How it was verified
| SPEC | Covers | Verification | Result |
|---|---|---|---|
| SPEC-01, 05, 06 | AC#1, #3, #4 | `tests/storage/session-records.acceptance.test.ts` | PASS |
| SPEC-02 | AC#1, #2 | `e2e/session-records.spec.ts` (Chromium + WebKit, every push) | PASS |
| SPEC-03 | AC#2 | `e2e/session-kill.spec.ts` (opt-in, Chromium) | PASS |
| SPEC-04, 14 | AC#2 | atomic write, v1→v2 upgrade, VersionError at v3, validated reads | PASS |
| SPEC-07 to 12 | AC#5–#11 | `tests/table/session-restore.acceptance.test.ts` | PASS |
| SPEC-13 | AC#12 | `tests/table/hand-record-validation.acceptance.test.ts` | PASS |
| SPEC-15, 16, 17 | DoD | lint/typecheck/test, playtest, full e2e, CI, docs | PASS |

- `npm test`: 942 passed, 0 failed (214 files, 35 opt-in skipped). Coverage 97.13% lines overall; `session-record.ts` 93.93%. `npm run e2e`: 184 passed, 16 skipped, 0 failed. Playtest 10,000 hands seed 42: 0 invariant violations, output hash unchanged. CI run 45182223879: all 7 jobs green (at 71bece3, before the J-1-01 fix commit).
- Judge round 1: PASS 17/17. Mutation run killed 19 of 20 mutants; fuzzing (~2,350 hostile mutations) gave only RangeErrors; holdout runs (20 configs x 25 hands, 500 duplicate-write checks, independent kill at hand 5, 600 real hand records) all passed.
- J-1-01 (MEDIUM, fixed in-story): the survivor mutant was removal of the record-vs-config seat-kind check (REQ-025: stored session must not make a bot seat the user's). Added a test swapping user and bot identity in the record while config is unchanged; verified it fails when the check is deleted. Test file unlocked, strengthened, relocked.
- J-1-02 (LOW): `handsPlayed = MAX_SAFE_INTEGER` is accepted and the next write then fails closed. J-1-03 (LOW): with both a bad deck and bad stakes, `createHand` now reports the deck error first. Neither is tracked.

## Review
Round 1 (code and security): one MAJOR, no other blockers.
- MAJOR (open): the build commit 71bece3 accidentally included a byte-identical sync-conflict copy of the TASK-3.9 story doc (`backlog/docs/stories/doc-100 … 2.md`). It is outside the spec. This session may not delete files under `backlog/`, so the story is parked unmerged until the user deletes that file; then it merges. The file was not touched by this documentor.

### Non-blocking review notes
- MINOR: `object`, `whole`, `isoString` helpers in `session-record.ts` (and a third copy in `session.ts`) duplicate `hand-record.ts` ones, differing only in the error prefix. Not tracked.
- NIT (security): `handsPlayed`/`nextBotId` accepted up to MAX_SAFE_INTEGER; fails closed, no consumer yet (same as J-1-02).
- NIT: stake/stack rule extraction moved the deck check ahead of the stake check (same as J-1-03).
- NIT: redundant `nextStep(table) === 'done'` check before `completedHand`.
- NIT: needless `defaults` alias in `resolveSessionConfig`.

## How to try it
`npm run dev`, start a game, play two hands, reload mid hand 3, then DevTools → Application → IndexedDB → `tlh-trainer` → `sessions`: one record with `handsPlayed: 2`; `hands` has 2 records. Tests: `npm test`; `npm run build && npm run e2e -- e2e/session-records.spec.ts`; `npm run e2e:slow -- e2e/session-kill.spec.ts`.

## Run metrics
Questions 3 (all auto-accepted) · assumptions 8 · review rounds 1 · judge rounds 1 · gate runs 5 · escalations 0 · sendbacks 0 · changed lines about 4,780 added across 18 files (excluding doit/) .

## Known limitations and follow-ups
- Out of scope by design: Resume screen and "find the paused session" query (E02: TASK-2.6, TASK-2.14); user rebuy (TASK-3.11, `rebuys` stays 0); level schedule (TASK-5.4); busting out with 0 stacks (TASK-3.21/E05, relaxes A-8); 0-hand session discard (E10); write-failure message/Retry (TASK-13.3); migration framework (E13).
- [trainer] When a story first persists a live hand, add HandState and action validation before restore (owner: the story that persists it; documented in `docs/storage/sessions.md`).
- [trainer] Optionally cap `handsPlayed`/`nextBotId` below MAX_SAFE_INTEGER (J-1-02); low value, fails closed today (owner: TASK-2.6 Resume, when it first uses restore).
- Not tracked (infra, below the value bar): duplicated parse helpers (R1 MINOR); sync-conflict file prevention below.

## Lessons for the factory (proposals — not applied)
- iCloud/Finder "<name> 2.<ext>" sync-conflict copies appeared in the workspace (31 files), broke `tsc` and the gate, and one was committed in the build commit. Propose: the build step runs `git add` with explicit paths from changes.md (not `-A`), and the gate fails on any new `* 2.*` file; consider moving the repo outside iCloud-synced folders. [infra] It caused a real failure here (parked merge, `tsc` break).
