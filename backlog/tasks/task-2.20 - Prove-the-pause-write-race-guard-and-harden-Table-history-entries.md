---
id: TASK-2.20
title: Prove the pause write-race guard and harden Table history entries
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-24T03:18:00Z'
updated_date: '2026-11-25T20:07:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-2.14
references:
  - doc-108
parent_task_id: TASK-2
priority: medium
ordinal: 231000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-2.14 (doc-108). No test exercises tableWritesSettled(): removing the A-2 guard leaves every test green (code review MINOR writes-settled-race-untested). The Table history key is ${performance.timeOrigin}:${counter}, which Playwright's fake clock reuses across loads, so only one SPEC-07 case runs on the real clock (NIT history-key-clock-derived). After Back then Forward on the Table, the next Back on Home lands on the app's stale entry and needs a second Back to leave (NIT forward-then-back-stays-on-home).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a sessions-store write held open by an init script, When the user chooses Home (and, separately, browser Back) while it is held, Then Home shows the previous hand count only after the write is released and the shown count equals the stored handsPlayed; removing the tableWritesSettled wait makes this test fail
- [x] #2 Given the Table history entry key, When it is created, Then it does not depend on the clock (e.g. crypto.getRandomValues like newSessionId) and every SPEC-07 Back/Forward case of TASK-2.14 runs under the paused Playwright clock
- [x] #3 Given Back then Forward on the Table, When the user presses Back on Home, Then one Back leaves the app (no visible no-op step), with a Chromium and WebKit test
- [x] #4 Given a page reload on the Table followed by Resume (real clock, Chromium and WebKit), When the user presses browser Back, Then Home opens (from TASK-3.11 judge J-1-01, where Back stayed on the Table)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Table history key becomes a random 32-hex id (fixes duplicate keys after reload under a faked clock)
2. Landing on a Table entry pushed this page load while no Table is shown steps off it once
3. Race test: hold the start-record write with a test-only init script, finish hand 1, choose Home/Back; Home must show the right hand count (fails without the guard)
4. Locked e2e/history.spec.ts case (5) runs under the paused clock; docs

Full spec: doit/TASK-2.20/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-3.11 follow-up (judge J-1-01, doc-109).

Build: random 32-hex Table history key; step off this load's stale Table entry on popstate; race tests hold the start-record write (fail without the Home guard — verified); history.spec case (5) under the paused clock. Full e2e 371 pass; repeat-each=3 clean; gate PASS.

Judge r1 PASS 8/8: guard removal makes both held-write tests fail (0 hands vs 1); 18 real Back/Forward flows on the production preview in Chromium/WebKit (Home control, Back/Forward/Resume, held write, reload, rebuy, leave table, error Return Home) — paused counts match IndexedDB, no stale Table entry traps navigation; full e2e 371 pass. CI 45689683518 green.
<!-- SECTION:NOTES:END -->
