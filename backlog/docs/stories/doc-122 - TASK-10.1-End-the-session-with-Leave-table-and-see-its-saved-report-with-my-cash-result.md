---
id: doc-122
title: >-
  TASK-10.1: End the session with Leave table and see its saved report with my
  cash result
type: other
created_date: '2026-11-24T18:01:00Z'
updated_date: '2026-11-24T18:01:00Z'
---
# TASK-10.1: End the session with Leave table and see its saved report with my cash result

Status: Done · Completed: 2026-11-24 · Epic: TASK-10 — Read the session report · Milestone: m-1 · Requirements: REQ-004 (004.5), REQ-007 (007.3), REQ-044 (044.1, 044.7, 044.8), REQ-052 (052.1, 052.5) · Branch: doit/TASK-10.1

## What was asked
Leave table (Table header and bust dialog) now ends the session instead of pausing to Home. The app waits for any running hand write, then saves `endedAt` and a never-modified Session Report in one IndexedDB transaction, and opens the Session Report screen: header line (game type, players, stake, hands) plus cash tiles Result, BB/100 and Rebuys. A session with 0 completed hands is deleted: no report, Home opens. Spec: doit/TASK-10.1/spec.md.

## Assumptions and decisions made without asking — please review
Q-1..Q-3 and the build notes were auto-accepted under the unattended rule (qa.md).

| ID | Item | Reversible? | Why | To reverse |
|---|---|---|---|---|
| Q-1 | New write-once `reports` store (DB v2 to v3, keyed by session id, add-only). Report and session `endedAt` written in one transaction. A 0-hand session record is deleted. | Hard once users have v3 data (the upgrade only adds a store) | Write-once by key gives AC#6; one transaction means no ended session without a report | New DB version that drops the store |
| Q-2 | Leave table mid-hand ends the session at the last completed hand; the unfinished hand is dropped (until TASK-10.2's dialog). | yes | One code path; keeps locked Leave-at-Hand-1 tests passing | TASK-10.2 |
| Q-3 | Report has a `Back to Home` button now; TASK-11.6 adds View statistics beside it. | yes | Otherwise the only exit is reload | Remove the button |
| D-4 | Five cross-story locked e2e tests re-pinned: `e2e/rebuy.spec.ts` (TASK-3.11), `e2e/bust-continue.spec.ts` (TASK-9.2) bust-dialog Leave now opens the report (-$160, -153.8, 0, 13 hands); `e2e/resume.spec.ts` (TASK-2.6) pauses via Home button; `e2e/next-hand.spec.ts` (TASK-3.4) expects focused `Session report` h1; `e2e/home-control.spec.ts` (TASK-2.14) store names `['hands','reports','sessions']`. | yes | Each asserted the old pause-to-Home behaviour | Revert the edits |
| Build notes | Unlocked `tests/table/hand-record.test.ts` opened the DB at literal v2 (now `DB_VERSION`); `tests/storage/hand-store.test.ts` "newer database" uses `DB_VERSION + 1`; `docs/storage/hand-records.md` version line updated. No assertion changed. | yes | v3 made literal 2 throw `VersionError` | n/a |
| A-1 | Report values come only from the stored session record (handsPlayed, user stack, rebuys, config). | yes | Session record is written in the same transaction as each hand | Count hand records |
| A-2 | Formats: `+$46`, `-$40`, `$0`; BB/100 `+2.7`, `-5.0`, `0.0`; Rebuys plain integer. | yes | Matches ACs and storyboard | Edit formatters |
| A-3 | Sit-and-go also ends on Leave; its report has `cash: null` and shows only the header line. | yes | REQ-004.5 applies to all games | Finishing position is TASK-10.12 / TASK-5.11 |
| A-4 | Blank busy `ending` screen between click and end; second Leave ignored. | yes | A 0-hand end must not flash a report heading | n/a |
| A-5 | `endSession` failure logs `Session could not be ended` and opens Home; session stays paused and resumable. | yes | Nothing lost | Error message on screen |
| A-6 | `ending` and `report` screens add no history entry; browser Back on the report leaves the app. | yes | TASK-2.14 rule | Push a Report entry |
| A-7 | `<h1>Session report</h1>` focused on mount; tiles as `<dl class="report-kpis">`. | yes | Storyboard title | n/a |
| A-8 | Hands text `1 hand` / `N hands`, reusing `GAME_LABEL` and the limits rule. | yes | AC#8 reads hands from this line | Hands tile |
| A-9 | `endedAt` is the time `endSession` is called after writes settle. | yes | `updatedAt` already holds the last hand's time | Use last hand's `completedAt` |

## What was built
- `src/table/session-report.ts` (new, headless): `SessionReport`, `sessionReport`, `bbPer100` (integer-only, half away from zero, never -0), `parseSessionReport` (also rejects a cash buy-in other than 20 big bets), `signedDollars`, `signedTenths`, `reportView`, `SessionEnder`.
- `src/storage/hand-store.ts`: DB v3 with `reports`; `endSession(sessionId, endedAt)` and `getReport(sessionId)` on `openHandStore`/`sharedHandStore`.
- `src/ui/report/ReportScreen.tsx` (new), `src/ui/App.tsx` (`ending` and `report` screens, `leave(sessionId)`), `Table.tsx`/`TableScreen.tsx` (`onLeave` gets the session id), `useTableSession.ts` (returns `sessionId`), `table-view.ts` (exports `GAME_LABEL`), `styles.css`.
- Ordering: `endSession` runs from an effect of the `ending` screen, after the Table's final effects, so the last hand's write is already queued when the app waits for it.
- Docs: `docs/storage/reports.md` (new), `docs/storage/sessions.md`, `docs/ui/navigation.md`, `docs/storage/hand-records.md`.
- Example: 214 hands, 1 rebuy, final stack $366 at $4/$8 gives `+$46`, `+2.7`, `1`.

## How it was verified
| SPEC | Covers | Verification | Result |
|---|---|---|---|
| 01, 02, 06 | Result, BB/100, rounding, sit-and-go, validation | `tests/table/session-report.acceptance.test.ts` (+ `session-report.test.ts`) | pass |
| 03, 04, 12 | Save and relaunch, write-once, v2 upgrade | `tests/storage/session-end.acceptance.test.ts` | pass |
| 05 | Screen markup | `tests/ui/report-screen.acceptance.test.tsx` | pass |
| 07, 09, 10, 11, 14 | Live Leave, Hand Review after hand 12, seeded long session, 0 hands, Back to Home | `e2e/session-report.spec.ts` | pass |
| 08 | Bust-dialog Leave | `e2e/rebuy.spec.ts`, `e2e/bust-continue.spec.ts` | pass |
| 13 | Lint, typecheck, suite, golden, playtest, CI | gates (7 runs, last PASS) | pass |

Extra e2e from review: `e2e/session-end-order.spec.ts` (Leave with a pending hand write) and `e2e/session-end-retry.spec.ts` (failed end, then Leave again). Judge round 1: PASS, 14/14, all AC and DoD proven (judge/verdict-1.json).

## Review
Three rounds. r1: no blockers, MINORs on the pending-write wait not being forced by any test and on `tableWritesSettled()` being read before the last hand's write was tracked (a few-millisecond race), plus an unvalidated buy-in. The orchestrator's fix: end from an effect of the `ending` screen, a pending-write e2e (verified to fail against the old code), and `parseSessionReport` checking buy-in against the stake. r2: MAJOR in that fix: the StrictMode guard keyed on session id never reset, so after a failed end a second Leave of the resumed session hung on the blank ending screen. Fixed by keying the guard on the ending screen object, with a retry e2e. r3: clean (code and security).

### Non-blocking review notes (deliberately not fixed)
- MINOR (code r1): `src/table/session-report.ts` duplicates private validation helpers that exist elsewhere (reviews/round-1/code.json).
- A strengthen-only NIT in the hook-locked `e2e/session-report.spec.ts` was applied by the orchestrator after `unlock TASK-10.1`.

## How to try it
`npm run dev`, start a game, play 3 hands, choose Leave table, read the report line and tiles, reload (Home shows no Resume). Leave during hand 1 goes Home with no report. Tests: `npm test`, `npx playwright test e2e/session-report.spec.ts e2e/rebuy.spec.ts e2e/bust-continue.spec.ts`.

## Run metrics
Questions 3 (auto-accepted) · assumptions 9 · review rounds 3 · judge rounds 1 · gate runs 7 · escalations 0 · changed 1572 lines / 28 files (budget 1300 / 23).

## Known limitations and follow-ups
- [trainer] Leave-table confirm dialog mid-hand, auto-fold and recording the forced-fold hand: TASK-10.2 (until then mid-hand Leave drops the unfinished hand).
- [trainer] Hand-record-based report sections (error rates etc.): start at TASK-10.4.
- [trainer] View statistics button on the report: TASK-11.6 (Back to Home exists already).
- [trainer] Hint counts on the report: TASK-10.7.
- [trainer] Sit-and-go finishing position on the report: TASK-10.12 / TASK-5.11.
- [trainer] Dedupe the private validation helpers in `src/table/session-report.ts` with the existing ones (code MINOR r1). No owning task known.
- Scope was over budget (1572 lines / 28 files vs 1300 / 23), mostly from the two review-added e2e files and the re-pinned locked tests.

Not tracked (infra, below the value bar): none.

## Lessons for the factory (proposals — not applied)
- The spec read `tableWritesSettled()` synchronously in the click handler; review r1 found the race and the fix then introduced the r2 MAJOR. Proposal: spec template for "wait for pending writes" flows should require an e2e that holds the write and one that retries after a failed end.
- A guard keyed on an id (instead of an instance) was a one-round cost; add "guards must reset on every user action" to the code-review checklist.
- Scope budget did not count re-pinned locked tests and review-added e2e; estimate them in the spec.
