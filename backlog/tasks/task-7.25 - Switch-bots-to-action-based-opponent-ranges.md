---
id: TASK-7.25
title: Switch bots to action-based opponent ranges
status: Done
assignee: []
created_date: '2026-11-22T21:02:00Z'
updated_date: '2026-11-28T00:14:00Z'
labels:
  - follow-up
  - feature
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-7.5
references:
  - doc-86
parent_task_id: TASK-7
priority: medium
ordinal: 219000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.5 (doc-86, Q-1 (A)). TASK-7.5 gave only the user's hints and review the action-range model; bots still compute postflop equity against every unseen combo. REQ-029.2 intends bots to request advice with the typical-player basis. Switching changes bot decisions and needs the user's approval to re-baseline locked tests measured in TASK-7.5: TASK-7.3 tests/advice/postflop.acceptance.test.ts AC#1 (1,081 combos), TASK-6.3 tests/bots/calling-station.acceptance.test.ts Example B, likely TASK-9.1 review grades, plus a new playtest SHA (today 442dbf55…08fbc).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given any bot deciding after the flop, When it asks the advice engine, Then equity is computed against action-based opponent ranges (ACTION_RANGE_ADVICE), with no bot style or parameter reaching the engine
- [x] #2 Given the locked tests that pin every-unseen-combo results (TASK-7.3 postflop AC#1, TASK-6.3 Example B, TASK-9.1 review grades if affected), When the user approves re-baselining, Then each is updated with the approval recorded and test-integrity clean for its owner
- [x] #3 Given a 10,000-hand default playtest after the switch, When it runs, Then it reports zero invariant violations, the new output SHA is recorded, and per-style VPIP/PFR stay inside their documented bands
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TASK-7.32 (doc-129) switched every bot to action-based opponent ranges (BOT_ADVICE) and verified it (100k all-TAG 6-max inside healthy ranges). This task appears superseded — user to confirm before closing.

Closed 2026-11-28 as done by TASK-7.32 (user approved closing instead of a full doit cycle). Evidence: AC#1 — every bot style (tag.ts:73, rock.ts:27, maniac.ts:28, calling-station.ts:42) spreads BOT_ADVICE = { opponentRanges: 'actions' } (src/bots/tag.ts), typical-player basis, no observed stats or bot parameters reach the engine (REQ-029.2). AC#2 — the affected locked tests were re-baselined in TASK-7.32 with recorded justification; npm test is green on main. AC#3 — 10,000-hand default playtest (seed 42) on main 7b69111f: 0 invariant violations, output sha256 d4d84efb02d49242…; per-style bands are judged over 100,000 hands (decision-2) and the style-band checks pass on main.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Already delivered by TASK-7.32: all four bot styles use action-based opponent ranges (BOT_ADVICE) with the typical-player basis. Verified on main 7b69111f: bots spread BOT_ADVICE, tests green, 10k playtest 0 violations (sha256 d4d84efb02d49242…). Closed without a separate build.
<!-- SECTION:FINAL_SUMMARY:END -->
