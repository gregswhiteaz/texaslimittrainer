# Fix brief — TASK-10.1 (orchestrator additions after review r1; no BLOCKER/MAJOR)

Fix exactly these. Strengthen only; never drop or loosen an assertion.

## 1. Leave can race the last hand's write (code review MINOR, src/ui/App.tsx:100)
leave() captures the pending-writes chain during the click, but the last hand's write joins the chain in a React effect that runs slightly later. A Leave in that gap lets endSession run first; the late write then rewrites the session without endedAt (report + resumable session). Fix so endSession always runs after every table write, including one queued by the final effect (e.g. read tableWritesSettled() after the Table has unmounted / in an effect of the `ending` screen, or make the session write refuse to overwrite an ended session — pick the simplest that is provably ordered). No setState inside effects (lint rule).

## 2. Test the pending-write path (code review MINOR, e2e/session-report.spec.ts:58)
Add an e2e that holds the last hand's write (hold the advice worker's grade reply or the hands add) until after Leave is clicked, then asserts: the report says 1 hand (the held hand is counted), the stored session has endedAt, and Home offers no Resume. Verify it fails if the ordering fix in item 1 is reverted (record in the build log), then restore.

## 3. Stored report buy-in tied to the stake (security MINOR, src/table/session-report.ts:~168)
parseSessionReport must reject a cash block whose buyIn ≠ buyIn(stake) (20 × bigBet): `throw invalid('cash.buyIn')`. Add a unit case.

## 4. NIT e2e/session-report.spec.ts:187
Advance the clock (page.clock.runFor(5000)) before the SPEC-10 "unfinished hand isn't stored" check, as SPEC-07/09 do.

npm run format, lint, typecheck, npm test, the full Playwright suite, then the gate.
