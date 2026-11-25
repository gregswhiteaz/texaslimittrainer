# TASK-2.20: Prove the pause write-race guard and harden Table history entries

Status: Done · Completed: 2026-11-25 · Epic: TASK-2 — Launch and set up a session · Milestone: m-1 · Requirements: REQ-004.9 (via TASK-2.14) · Branch: doit/TASK-2.20

## What was asked
TASK-2.14 made Home wait for running table writes before reading the paused session, but no test proved it (doc-108 MINOR). This story adds e2e tests that hold the session start-record write open, makes the Table history key random instead of clock-derived, runs every TASK-2.14 Back/Forward case under the paused Playwright clock, and makes one Back on Home leave the app after Back then Forward. Spec: doit/TASK-2.20/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Key is 16 CSPRNG bytes as 32 hex chars, via a local helper in App.tsx (same body as `newSessionId`). | yes | AC names `crypto.getRandomValues`; uniqueness, not secrecy. | Export and reuse `newSessionId`, or use `crypto.randomUUID()`. |
| A-2 | The race is reproduced by holding the start-record put (the only `sessions`-only readwrite transaction) of a new game. | yes | Holding the hand write itself would not fail without the guard (IndexedDB orders the later read after it). | Delay the advice worker reply (does not hold a sessions write). |
| A-3 | The hold keeps the transaction alive with a chain of `count()` requests until released. | yes | Data stays truly uncommitted; no app code touched; no timers, so the paused clock cannot interfere. | Defer `oncomplete` handlers (weaker). |
| A-4 | New tests live in `e2e/pause-history.spec.ts` and run on every push. | yes | Each case plays at most one hand; suite stays fast. | Move into locked specs. |
| A-5 | "This load's own Table entry" is a module-level `lastTableKey`, so it survives the App remount in Return Home. | yes | At most one entry pushed by this load can exist. | A `useRef` (lost on remount) or a Set of keys. |

## Clarifications and decisions
No questions asked (qa.md: autopilot, no ask items). Decisions, auto-accepted as recommended, for review:
- D-3 (AC#3): when no Table is shown and Back or Forward lands on this load's own Table entry, the app calls `history.back()` once to step off it. Entries from an earlier load (after a reload) are not stepped off, because stepping back from them can cross into the previous document and reload the page.
- D-4 (AC#2): locked `e2e/history.spec.ts` (TASK-2.14) case (5) now runs under the paused clock (drops `{ pausedClock: false }` and its timeOrigin comment). No assertion removed or loosened.
- D-1: guard proven with Playwright and real IndexedDB, not fake-indexeddb. D-2: key format is 32 lowercase hex chars; history state shape `{ tlhTable: key }` unchanged.

## What was built
- `src/ui/App.tsx` — random Table key; module-level `lastTableKey` set in `openTable`; popstate with no Table shown and the state's key equal to `lastTableKey` calls `history.back()` once. The timeOrigin counter is removed.
- `e2e/support/hold-writes.ts` — test-only init script `holdSessionsWrite` (wraps `IDBDatabase.prototype.transaction`, holds the first armed `sessions`-only readwrite transaction) plus `armSessionsHold`, `sessionsHoldState`, `releaseSessionsHold`. Imports nothing from `src/`; not in the production build (security review checked `dist/`).
- `e2e/pause-history.spec.ts` — new spec: Home control and browser Back wait for the held write; key is 32 hex chars and differs across loads under the paused clock; Back, Forward, one Back leaves the app; reload + Resume + Back opens Home on the real clock.
- `e2e/history.spec.ts` — case (5) under the paused clock (D-4).
- `docs/ui/navigation.md` — random key, Forward step-off, reload note, Home waits for table writes, test list. After the judge (J-1-01) the orchestrator qualified the Forward bullet for the reload case.
- No new dependencies. `tableWritesSettled`, `track`, `useTableSession.ts` and `hand-store.ts` are unchanged.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01, 02 | AC#1 | e2e Home control and browser Back wait for a held write; subtitle `1 hand` equals stored `handsPlayed` | PASS | pause-history.spec.ts |
| SPEC-03 | AC#1 | Guard removed locally: 2 failures (`0 hands`); restored: 2 passes | PASS | build-log.md |
| SPEC-04 | AC#2 | key matches `/^[0-9a-f]{32}$/`, differs across loads | PASS | pause-history.spec.ts |
| SPEC-05 | AC#2 | history.spec.ts case (5) under paused clock | PASS | history.spec.ts |
| SPEC-06 | AC#3 | Back, Forward, one Back reaches `about:blank` | PASS | pause-history.spec.ts |
| SPEC-07 | AC#4 | reload + Resume + Back on real clock opens Home | PASS | pause-history.spec.ts |
| SPEC-08 | all | lint, typecheck, `npm test`, `npm run e2e` | PASS | judge/round-1.json |

- Judge round 1: PASS 8/8. `npm test` 1410 passed; full Playwright (Chromium and WebKit) 371 passed, 19 skipped, 0 failed; run command 14/14; 18 extra judge flows on the production preview passed.
- Gates: 2 runs, both PASS.

## Review
Round 1, code and security: no blocking findings. Security found no reachable issue (back() can only chain through entries carrying the 128-bit key, so it cannot loop).

### Non-blocking review notes (deliberately not fixed)
- NIT `docs/ui/navigation.md:forward-step-off-claim-after-reload` — the Forward bullet read as universal; after a reload leaving takes two Backs. Fixed afterwards by the orchestrator as J-1-01.
- NIT `scope-budget-lines-overrun` — 328 changed lines against a budget of 320, mostly the copied history.spec helpers and the SPEC-07 body.

## How to try it
- `npm run build && npx playwright test e2e/pause-history.spec.ts e2e/history.spec.ts`
- By hand: `npm run dev`, start a game, Back, Forward, then one Back leaves the app.

## Run metrics
Questions 0 · assumptions 5 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · changed lines 328 (budget 320).

## Known limitations and follow-ups
- [trainer] After a reload on the Table, entries from the earlier load stay in history, so leaving takes an extra Back (pre-existing, outside the ACs; D-3 deliberately leaves them). Decide whether to track a task to remove or step off those entries without reloading the page. Owning task: none known (TASK-2 epic).
- Not tracked (infra, below the value bar): scope budget overrun of 8 lines; it caused no failure.

## Lessons for the factory (proposals — not applied)
- None from failures. Minor: the line budget was slightly under-estimated for a spec that mandates copying helpers into a new e2e file.
