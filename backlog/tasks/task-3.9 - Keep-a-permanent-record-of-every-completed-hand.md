---
id: TASK-3.9
title: Keep a permanent record of every completed hand
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-23T15:30:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-3.4
  - TASK-1.15
  - TASK-6.7
  - TASK-6.8
  - TASK-7.12
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-100
parent_task_id: TASK-3
priority: high
type: chore
ordinal: 60000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want each completed hand saved on my device before the next hand is dealt, so that my review, report and progress are built from a complete and lasting history.

Enabler (persistence foundation; user-visible through E09 review, E10 report, E11 statistics). First story to use IndexedDB (folded into this slice; the schema version per store, REQ-054, is E13). A hand record is written when the hand ends and before the next hand is dealt. Record fields: session id, hand number, replay code, game type, stake or level, line-up name (preset or Custom, resolved by E06-S07), seats with bot id, name, style and starting stack, button seat, every action per seat per street with amount (full per-seat per-street history so the E07-S08 style-stat functions can run on records), board, cards shown at showdown, the user's hole cards, and pot awards. A replacement bot (E06-S08) has its own distinct id. User-decision advice fields are E03-S10. Hand records are never modified after they are written and are kept until Reset all data (E12); there is no automatic deletion. Each record also stores the date and time the hand completed (REQ-052.7).

## Requirements covered
- REQ-052 (Must): Local persistence — TLH Trainer shall store settings, last configuration, sessions, hand records and session reports in the browser's IndexedDB, writing each hand record when its hand ends.

Covers: REQ-052

## Notes
E13 adds schema versions and migrations (REQ-054) and the write-failure path (REQ-053.2); E12 Reset all data is the only deletion path; E10 must keep reports immutable too (REQ-052.5).

Plan key: E03-S09 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a hand completes, When the next hand is dealt, Then that hand's record is already readable from IndexedDB, and if the browser process is killed right after hand 12 ends, hand 12's record is stored after relaunch [REQ-052.1]
- [x] #2 Given a test build that delays the storage write by 2 s, When a hand completes, Then the next hand is not dealt until the write has completed [REQ-052.1]
- [x] #3 Given a test clock set to 2026-11-17 14:32:05 when a hand completes, When its record is read, Then it stores that completion date and time [REQ-052.7]
- [x] #4 Given a scripted $4/$8 hand that reaches showdown, When its record is read, Then it holds session id, hand number, replay code, game type, stake, line-up name, every seat's bot id, name, style and starting stack, button seat, board, cards shown at showdown, the user's hole cards and pot awards equal to the scripted values [REQ-052.2]
- [x] #5 Given a scripted hand, When its record is read, Then every action of every seat on every street is listed in order with its amount, and the E07-S08 style-stat functions computed from the records equal the values computed from the live hands [REQ-052.2]
- [x] #6 Given a bot busted and was replaced before hand 8, When hands 7 and 8 are read, Then that seat has a different bot id, name and starting stack in hand 8 [REQ-052.2]
- [x] #7 Given a stored hand record, When later hands complete or the session ends, Then the stored record is byte-identical and a write to an existing session id and hand number is rejected [REQ-052.5]
- [x] #8 Given 1,000 stored hand records dated 2 years ago, When the app is launched and a session is played, Then all 1,000 records are still stored [REQ-052.6]
- [x] #9 Given a hand completes, When the Table reports it, Then onHandComplete is called exactly once with the CompletedHand and a repeat completion for the same replay code is ignored, covered by a test
- [x] #10 Given two consecutive hands with the same replay code, When each completes, Then onHandComplete fires exactly once per hand, covered by a test
- [x] #11 Given the Table passes onHandComplete to useTableSession, When the parent re-renders with a new callback, Then a test shows the 1.5 s next-hand timer is not restarted (callback kept stable via a ref)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [x] #2 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [x] #3 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [x] #4 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [x] #5 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [x] #6 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [x] #7 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [x] #8 No new network requests beyond the app's own files [REQ-058.1]
- [x] #9 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [x] #10 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [x] #11 Story documentation is written and published to Backlog.md
- [x] #12 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. src/storage/: IndexedDB hand store (tlh-trainer v1, store hands, key [sessionId, handNumber]; add/get/count; parseHandRecord on read; strict durability).
2. handRecord builder from CompletedHand + session id, hand number, bot ids (TableState.botIds/nextBotId; replacement gets new id), completedAt.
3. useTableSession: write before deal (timer and Deal next wait for the write); onHandComplete via ref; failure stops dealing + console.error.
4. Tests: fake-indexeddb unit; Playwright harness (delay/fail seams in e2e/support only); reload every push; real kill opt-in; 1,000 aged records.
5. Docs.

Full spec: doit/TASK-3.9/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-3.1 follow-up (doc-21).

AC added from TASK-3.4 follow-up (doc-25).

AC added from TASK-9.1 follow-up (doc-26).

Build: IndexedDB hand store (src/storage/hand-store.ts, tlh-trainer v1 'hands'), handRecord/parseHandRecord, write-before-deal in useTableSession (failure stops dealing), bot ids; block 1 (TASK-3.1 botId re-pin) auto-accepted; e2e 182 pass (+2.3 s); kill test passes (Chromium, opt-in); SHA unchanged; gate PASS.

Review R1: 0 blocking; MINORs fixed in-story (strict durability test; docs wording on replay code); security MINORs → ACs on TASK-9.5 and TASK-3.10.

Judge R1 PASS 20/20 (own Playwright + fake-indexeddb checks: every field vs UI and replay rebuild; stats from records = live over 420 hands; slow write deals at max(1.5 s, write); failed write stops dealing; 10/11 mutants — hook ref masked by Table ref, LOW, not tracked).

Locked e2e/hand-records.spec.ts made timing-robust by TASK-1.55 (expect.poll on exact counts; count kept).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Every completed hand is now written to IndexedDB (tlh-trainer/hands, add-only, strict durability, validated on read) and the next hand is dealt only after the write finishes. A failed write stops dealing (console error; UI is TASK-13.3). onHandComplete fires once per hand and no longer restarts the timer. Verified: npm test 928 passed; e2e 182 passed (+2.3 s); opt-in Chromium kill test passed; playtest SHA unchanged; review 0 blocking. Assumptions to review: Q-1 format, Q-2 failure stops dealing, Q-3 fake-indexeddb dev dep, TASK-3.1 test re-pin (botId), A-1..A-10. Follow-ups: ACs on TASK-9.5 (never show cards from a replay code) and TASK-3.10 (cross-field validation on read).
<!-- SECTION:FINAL_SUMMARY:END -->
