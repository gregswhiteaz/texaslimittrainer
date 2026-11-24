# TASK-2.6: Resume a paused session from Home

Status: Done · Completed: 2026-11-23 · Epic: TASK-2 — Launch and set up a session · Milestone: m-1 · Requirements: REQ-002 (.4, .5), REQ-004 (.2, .3, .6) · Branch: doit/TASK-2.6

## What was asked
Home shows a "Resume session" entry only while a stored, not-ended session exists. It shows game type, table size, stake and hands played (for example `Cash · 6 players · $4/$8 · 132 hands · paused`). Choosing it opens the Table on that session under the same session id. The next hand is dealt with the stacks from the end of the last completed hand, and the abandoned hand is never counted. Stored data stays untrusted: unknown seat kinds or styles, missing bot names and counters near MAX_SAFE_INTEGER are rejected with a RangeError, and Home keeps working. 8 acceptance criteria, 12 Definition-of-Done items. Spec: doit/TASK-2.6/spec.md.

## Assumptions made without asking — please review
Q-1 and Q-2 were auto-accepted under the unattended rule (qa.md). A-1..A-9 are from spec.md. state.json counts 0 assumptions and 0 questions, but the spec lists 9 assumptions and qa.md records 2 questions.

| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| Q-1 | Ended-session format is an optional `endedAt` ISO string (absent or null = not ended). It is read-only in this story, and nothing writes it. Leave table still goes Home and the session stays paused until TASK-10.1. | yes | Persisted-format choice; TASK-10.1 owns ending sessions. | Change the field in `session-record.ts` and `docs/storage/sessions.md`. |
| Q-2 | Resume subtitle copy follows the storyboard (`Cash · 6 players · $4/$8 · 132 hands · paused`), with `1 hand` singular. Sit-and-go shows chip limits (`20/40`) until TASK-5.6 adds the level. | yes | User-visible copy. | Edit `resumeSummary` in `table-view.ts`. |
| A-1 | The paused session is the valid, not-ended session with the latest `updatedAt` (ties: `startedAt`, then `sessionId`). Older unended sessions are ignored. | yes | It is the session last played; needs no index or new write. | Mark older sessions ended (E10 behaviour). |
| A-2 | Each stored session is parsed on its own. An invalid one is skipped and logged (`Session record could not be read`), so one corrupt record cannot hide a valid one. | yes | AC#7: Home stays usable. | Reject the whole read on the first bad record. |
| A-3 | `MAX_SESSION_COUNT = 1_000_000_000` caps `handsPlayed` and `nextBotId`. `nextBotName` and `rebuys` are not capped. | yes | About 31 years at one hand per second. | Use `2**31-1` or `MAX_SAFE_INTEGER - 1`. |
| A-4 | Home renders without the entry first and adds it once the read settles. `<nav data-paused="loading\|none\|shown">`. A failed read logs and shows none. | yes | IndexedDB is async. | Block Home until the read settles. |
| A-5 | If `restoreSession` throws on click, App logs, stays on Home and hides the entry. | yes | The Table never mounts with invalid state. | Validate only at Home load. |
| A-6 | A resumed table writes no start record. Later hands use the existing `add(record, session)` path under the stored `sessionId` and `startedAt`. | yes | Rewriting would move `updatedAt` back to `startedAt`. | Re-put the record at mount. |
| A-7 | AC#3 (10 hands, close in hand 11) runs exactly in the headless test. The every-push browser spec plays 2 hands, reloads in hand 3 and resumes. The 25- and 132-hand cases are seeded records. | yes | 10 real browser hands per browser would add about 40 s to CI. | Add an opt-in 10-hand browser test. |
| A-8 | AC#4's hand count 25 shows as header `... Hand #26` and as `restoreSession(...).handNumber - 1 === 25`. Line-up name and speed are checked on restored state, since the Table does not display them. | yes | No hands-played or line-up display exists. | Add such a display. |
| A-9 | A 0-hand paused session shows "0 hands" and resumes at hand 1 under the same id. | yes | TASK-10.1 AC#7 treats it as paused until ended. | Hide 0-hand sessions. |

## Clarifications and decisions
- Q-1 and Q-2 were auto-accepted as the recommended options (see above). No user-facing questions were asked (0 per state.json).
- Spec Detective notes: old unended sessions accumulate until TASK-2.7 enforces one paused session. `nextBotName` and `rebuys` caps are not in the ACs and were not added.
- The build paused before the judge while TASK-1.56 fixed an unrelated CI test-timing timeout. main was then merged into the branch (`9d84cec`) and the pipeline resumed.

## What was built
Flow: Home reads `HandStore.pausedSession()` (one readonly `getAll` on `sessions`, then `findPausedSession`, which parses each value on its own and picks the latest not-ended one). Home shows the entry. On click, App calls `restoreSession(record)`, then mounts the Table with a `resume` option. `useTableSession` takes the initial table, session id and start time from it and writes no start record. Later hands are stored under the same session id.

- `src/table/session-record.ts` — optional `endedAt` (parsed, never written), `MAX_SESSION_COUNT` cap, `PausedSession`, `findPausedSession(values)`.
- `src/table/table-view.ts` — `limitsText(config)` extracted from `headerText` (output unchanged), `resumeSummary(record)`.
- `src/table/hand-record.ts` and `src/storage/hand-store.ts` — `pausedSession()` on the `HandStore` interface and the IndexedDB store.
- `src/ui/home/HomeScreen.tsx`, `src/ui/styles.css` — optional `paused`/`onResume` props, Resume entry, `data-paused`, `.menu-secondary`.
- `src/ui/App.tsx`, `src/ui/table/TableScreen.tsx`, `src/ui/table/useTableSession.ts` — paused-session read, Resume handler, `resume` option.
- Tests: `tests/support/session-play.ts` (headless play helpers), `tests/table/resume.acceptance.test.ts`, `tests/storage/resume.acceptance.test.ts`, `tests/ui/home-resume.acceptance.test.tsx`, `e2e/resume.spec.ts`, plus `seedStoredSessions` in `e2e/support/hand-records.ts` and a forward in `records-harness.tsx`.
- `docs/storage/sessions.md` — `endedAt`, the cap, the paused-session rule, the Resume flow.

No new dependencies. `src/engine`, `src/bots`, `src/advice` and `src/stats` are unchanged.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01, 10 | AC#1, AC#2 | Vitest: subtitle text; Home shows entry only with a paused session | PASS | tests/table, tests/ui acceptance |
| SPEC-02, 09 | AC#2 | Vitest: only stored, valid, not-ended sessions; ordering and `endedAt` parsing | PASS | tests/storage, tests/table |
| SPEC-03, 05 | AC#3, AC#5 | Vitest with fake-indexeddb: 10 hands, relaunch, hand 11 from end-of-hand-10 stacks; no abandoned-hand record; stats equal hands 1-10 | PASS | tests/storage/resume.acceptance.test.ts |
| SPEC-04 | AC#4 | Vitest: 9-player $10/$20 Custom restored with line-up, seats, stacks, count, button moved on | PASS | tests/table/resume.acceptance.test.ts |
| SPEC-06, 07, 08 | AC#7, AC#8 | Vitest: per-record validation; unknown kind/style/missing name rejected before line-up code (spies on real functions); counters near MAX_SAFE_INTEGER rejected | PASS | acceptance tests |
| SPEC-11..13 | AC#1-3, 6, 7 | Playwright Chromium + WebKit with axe: reload mid-hand, resume, same session id; seeded sessions; invalid record leaves Home usable | PASS | e2e/resume.spec.ts, 6/6 |
| SPEC-14..16 | DoD | lint, typecheck, test, coverage, boundary, docs | PASS | judge round 1 |

- Judge round 1 (PASS, 16/16): `npm run lint && npm run typecheck && npm test` gave 995 passed, 0 failed (41 skipped, pre-existing opt-in). Coverage was 96.8% lines overall, 97.99% for table, 94.23% for storage. The judge also ran the spec section 10 manual scenario on the built preview (9-player game, 3 hands, tab closed in hand 4). Home showed `Cash · 9 players · $4/$8 · 3 hands · paused` and Resume showed Hand #4. The stored session was byte-identical after mount, and hands were [1,2,3] then [1,2,3,4] under one sessionId. It passed in Chromium and WebKit.
- Integrity: PASS. The only reported item (postflop-ranges assertions 31 to 21) came from the TASK-1.56 merge, and `git diff main..HEAD -- tests/advice` is empty. Locked tests are unchanged.
- Gate runs: build PASS, fix-2 PASS, fix-3 FAIL, fix-4 PASS. The fix-3 failure was environmental: "coverage report directory already in use by another" vitest process. Rerunning passed.
- No judge failures and no send-backs.

## Review
Round 1, code and security: no BLOCKER or MAJOR findings. All 16 code-review SPEC items passed on correctness and test strength.

### Non-blocking review notes (deliberately not fixed)
- security MINOR `src/table/session-record.ts:next-bot-name-uncapped` — `nextBotName` is validated only as a safe integer >= 0. A stored value near MAX_SAFE_INTEGER passes `parseSessionRecord`, gets offered and restored. The next bot bust then throws RangeError inside `nextHand`, mid-session. Only a local actor with write access to the origin's IndexedDB can trigger it, and it gives no privilege gain. Fix: `whole(record.nextBotName, 'nextBotName', 0, MAX_SESSION_COUNT)` plus a SPEC-08 rejection case. This follows qa.md, which did not add the cap because the ACs did not name the field.
- code MINOR `e2e/support/hand-records.ts:seed-sessions-duplicates-seed-records` — `seedStoredSessions` copies `seedStoredRecords` almost line for line. Only the store name and put vs add differ. The reviewer also noted that `page.evaluate` functions must be self-contained, so accepting the copy is valid.
- code NIT `src/table/session-record.ts:non-error-wrap-in-findPausedSession` — the `new Error(String(error))` branch never runs, because `parseSessionRecord` only throws Error instances. Push `error as Error`, or leave it.

## How to try it
- `npm run lint && npm run typecheck && npm test`
- `npx vitest run tests/table/resume.acceptance.test.ts tests/storage/resume.acceptance.test.ts tests/ui/home-resume.acceptance.test.tsx`
- `npx playwright test e2e/resume.spec.ts`
- By hand: `npm run build`, start a New game, play a few hands, close the tab mid-hand, reopen, and choose Resume session on Home.

## Run metrics
Questions asked: 0 to the user (2 auto-accepted) · assumptions logged: 9 in the spec (state.json shows 0) · review rounds: 1 · judge rounds: 1 · gate runs: 4 (1 environmental FAIL) · escalations: 0 · send-backs: 0 · changed lines: 1234.

## Known limitations and follow-ups
- Interim behaviour: Leave table only pauses the session (goes Home, Resume still shows) until TASK-10.1 ends sessions with a saved report. Nothing writes `endedAt` yet.
- Unended sessions accumulate: every Start game leaves one behind until TASK-2.7 enforces at most one paused session. Resume picks the latest.
- Follow-up [trainer]: cap `nextBotName` at `MAX_SESSION_COUNT` in `parseSessionRecord` and add a rejection case to the SPEC-08 tests. Candidate owner: TASK-2.7 or a small hardening task.
- Follow-up [trainer]: show the SNG level in the Resume subtitle instead of chip limits. Owner: TASK-5.6.
- Follow-up [trainer]: wire Leave table to set `endedAt` and open the Session Report. Owner: TASK-10.1.
- Follow-up [trainer]: have TASK-2.7 end or replace older unended sessions. Owner: TASK-2.7.

Not tracked (infra, below the value bar):
- Merge `seedStoredSessions` and `seedStoredRecords` in e2e support into one store-name function (MINOR). Test-helper duplication that causes no failure.
- Simplify the unreachable `new Error(String(error))` branch in `findPausedSession` (NIT).

## Lessons for the factory (proposals — not applied)
- The build stopped for an unrelated CI timeout (TASK-1.56) and needed a main merge and a resume. The pipeline could record "paused for unrelated blocker" in state.json so the stage and time lost are visible.
- Gate fix-3 failed only because another vitest process held the coverage directory. The gate could detect or wait for a concurrent vitest run, or use a per-run coverage directory, to avoid a wasted run.
- state.json shows `questions: 0` and `assumptions: 0` although qa.md has 2 auto-accepted questions and the spec has 9 assumptions. The counters should be updated when the spec is approved.
