# TASK-8.6: Keep observed opponent stats across Resume

Status: Done · Completed: 2026-11-26 · Epic: TASK-8 (Ask for a hint) · Milestone: m-1 · Requirements: REQ-052.3, REQ-022 · Branch: doit/TASK-8.6

## What was asked
After Resume, a bot watched for 45 hands read "typical player" again, because the observed style counts lived only in a hook ref (doc-114 Q-3). AC#1: observed counts survive Resume, so hints and stored decisions keep using them. AC#2: malformed stored counts reject the record with a RangeError naming the field. Spec: doit/TASK-8.6/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| Q-1 | Persisted format (auto-accepted, recommended option a): optional `observed: [{botId, hands, vpipHands, pfrHands}]` on the session record, whole numbers, written in the same transaction as each hand record, no DB version bump (stays v5). | yes | Additive optional field; older records still load | Pick (b) percentages, (c) all 8 counts, or (d) rebuild from hands; needs a format change |
| A-1 | A record with no `observed` resumes with empty counts (start records, sessions saved before this story). | yes | Same pattern as `endedAt` | Rebuild counts from hand records when absent |
| A-2 | Only seated bots with at least 1 observed hand get an entry, ascending seat order. A replaced busted bot's counts are dropped. | yes | Bot ids are never reused | Keep every bot id ever seen |
| A-3 | `observed` must be absent or an array; `null` rejected; extra entry properties ignored; order not validated. | yes | Matches the parser's existing leniency rule | Accept null; reject extras |
| A-4 | Each entry also needs `hands <= handsPlayed` and `pfrHands <= vpipHands`. | yes | Always true for real data; catches corruption beyond the AC#2 list | Only the AC#2 checks |
| A-5 | `restoreObserved` fills the other five `StyleCounts` fields with 0; only handsDealt, voluntary, preflopRaised are read. | yes | `ObservedCounts` type kept because locked tests use it | Persist all 8 counts |
| A-6 | The hook counts the finished hand synchronously, stores it in the ref and passes the same object to `handWrite`. | yes | Stored record and next hint use identical counts | Recompute in the write's `.then` |
| A-7 | The 45-hand browser check seeds 45 headless hands and a session record; the live write path is proven separately with 3 live hands across Home to Resume. | yes | 45 live hands would add minutes per browser | Run 45 live hands in the opt-in slow group |

## Clarifications and decisions
- Q-1: persisted format, auto-accepted option (a) by autopilot (see table above; listed for review).
- D-1: format as in Q-1. D-2: `restoreObserved(record)` is separate from `restoreSession`; `ResumedSession` gains optional `observed`; `TableState` is unchanged (locked restore tests deep-equal it).
- D-3: `sessionRecord(table, meta, counts?)` and `handWrite(table, meta, decisions?, counts?)` write `observed` only when given (even as `[]`); the start record passes none.
- D-4: a malformed `observed` rejects the whole record through `parseSessionRecord`, then the existing `findPausedSession` to `rejected` to `console.error` path, so Home skips it.

## What was built
- `src/table/session-record.ts`: `SessionRecordObserved` type, optional `SessionRecord.observed`, write support in `sessionRecord`/`handWrite`, validation in `parseSessionRecord`, new `restoreObserved(record)`.
- `src/ui/table/useTableSession.ts`: `ResumedSession.observed?` seeds the observed ref; counts are computed before the hand write and passed to `handWrite`.
- `src/ui/App.tsx`: `resume` passes `observed: restoreObserved(record)`, inside the existing try/catch.
- `src/table/session.ts`: doc comment only.
- Docs: `docs/storage/sessions.md` (field, validation, Resume note, stale "version 4" corrected to 5), `docs/ui/hint.md`.
- Tests: `tests/table/observed-resume.acceptance.test.ts`, `tests/table/observed-record.acceptance.test.ts`, `tests/table/observed-record.test.ts`, `e2e/observed-resume.spec.ts`; `tests/table/observed-snapshot.test.ts` retitled (comment/title only).
- No new dependencies, no DB version bump.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | acceptance: restored counts equal counts before pause | PASS | Snapshots deep-equal after JSON round trip; holdout 12-hand seed also identical |
| SPEC-02 | AC#1 | acceptance: resumed hint and stored decision use restored counts | PASS | Hint basis text, stored decision snapshot, graded basis |
| SPEC-03 | AC#1 | e2e: resumed hint uses the 45 hands observed | PASS | Chromium + WebKit |
| SPEC-04 | AC#2 | acceptance: malformed observed rejected naming the field | PASS | RangeError names the field |
| SPEC-05 | AC#2 | e2e: malformed record skipped, Home usable | PASS | Chromium + WebKit; independent live run too |
| SPEC-06 | AC#1 | unit: write rules | PASS | |
| SPEC-07 | AC#1 | unit: restore rules | PASS | |
| SPEC-08 | AC#1 | e2e: counts saved with each hand, carried through Home and Resume | PASS | |
| SPEC-09 | AC#1, AC#2 | full command set | PASS | npm test 1447 passed, 0 failed (322 files; 6 files and 48 tests skipped, opt-in groups); lint, typecheck, build exit 0; Playwright 16/16 in both browsers |

- Gates: build-1 PASS, fix-2 PASS. Judge round 1: PASS (9/9), integrity check clean, diff limited to the spec's files.

## Review
No blocking findings (code and security reviewers, round 1).

### Non-blocking review notes
- MINOR (fixed by orchestrator): redundant sparse-hole check in `observedField`; dropped, since `object()` rejects a hole with the same `observed[i]` message and the judge confirmed it is still rejected.
- NIT (left): the play-45-hands-and-write loop is duplicated in three locked test files (`observed-record.acceptance.test.ts`, `observed-resume.acceptance.test.ts`, `e2e/observed-resume.spec.ts`).

## How to try it
- `npm test`
- `npx playwright test e2e/observed-resume.spec.ts e2e/resume.spec.ts e2e/session-records.spec.ts e2e/hint-observed.spec.ts`
- By hand: play a few hands, go Home, Resume, ask for a hint; the basis line keeps the observed hand count.

## Run metrics
Questions 1 (auto-accepted) · assumptions logged 7 (A-1..A-7) · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · changed lines about 805 (budget 650; files 11 as scoped).

## Known limitations and follow-ups
- Known limitation A-1: sessions paused before this shipped have no `observed`, so they show "typical player" once after their next Resume; counts are saved from then on.
- Changed lines (about 805) exceeded the 650 scope budget, mostly tests and e2e; no action proposed.
- [trainer] Optional: extract the duplicated 45-hand setup helper shared by the three observed-resume test files into `tests/support` (NIT above). Owner: none known; below the value bar unless the tests grow.

## Lessons for the factory (proposals — not applied)
- The scope budget (650 lines) was exceeded by about 24 percent with no problem flagged; consider counting test files separately from source when budgeting.
