---
id: TASK-2.6
title: Resume a paused session from Home
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-26T00:07:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-2.1
  - TASK-3.10
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-107
parent_task_id: TASK-2
priority: high
type: feature
ordinal: 65000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to resume the session I left unfinished, so that short practice sittings add up without losing progress.

A session that has not been ended (via Leave table, E10) is the paused session; closing the app or reloading leaves it paused and does not end it (the Table-header Home control, REQ-004.9, is E02-S15). Session state is saved after every completed hand by E03-S11 and an unfinished hand is never written. Home shows Resume session only while a paused session exists, with its game type, table size, stake and hands played (e.g. "Cash · 6 players · $4/$8 · 132 hands"). Resume restores game type, table size, stake, line-up (name and seat styles), seats (bot ids and names), stacks, dealer button position, hand count and speed, and deals the next hand with stacks as they were before the abandoned hand began. SNG level restore (also REQ-004.3) is verified by E05-S03 once sit-and-go exists. The abandoned hand is not counted anywhere: hand count, hand records, stats.

## Requirements covered
- REQ-002 (Must): Home screen menu — The Home screen shall offer New game, Statistics and Settings, and shall offer Resume session only while a paused session exists.
- REQ-004 (Must): Pause, resume and end a session — When the user goes Home or closes the app during a session, TLH Trainer shall keep that session as a paused session that can be resumed at the start of the next hand; when the user chooses Leave table, it shall end the session and open the Session Report.

Covers: REQ-002, REQ-004

## Notes
E05: the SNG-level resume AC (E05-S03) should also tag REQ-004.3. Leaving the table with Leave table ends the session (E10), after which Resume must not show.

Plan key: E02-S08 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a paused 6-player $4/$8 cash session with 132 completed hands, When Home is shown, Then it shows Resume session with Cash, 6 players, $4/$8 and 132 hands [REQ-002.4]
- [x] #2 Given storage with no session or only ended sessions, When Home is shown, Then Resume session is not shown [REQ-002.5]
- [x] #3 Given 10 completed hands and the app closed in the middle of hand 11, When the app is relaunched and the user chooses Resume session, Then the Table deals a new hand numbered 11 with every stack equal to its value at the end of hand 10 [REQ-004.2]
- [x] #4 Given a paused 9-player $10/$20 Custom session with button at seat 7 after hand 25, When it is resumed, Then the table shows the same game type, table size, stake, line-up name, bot names and styles in the same seats, stacks and hand count 25, and the next hand's button is the seat that follows seat 7 under the button rules [REQ-004.3]
- [x] #5 Given the app was closed in the middle of hand 11, When stored hand records and the style stats computed from them are read after resuming, Then no record of the abandoned hand exists and the stats equal those of hands 1 to 10 [REQ-004.6]
- [x] #6 Given a resumed session, When further hands complete, Then they are stored under the same session id with hand numbers continuing from 11 [REQ-004.2]
- [x] #7 Given a stored session whose seats include an unknown seat kind, an unknown bot style or a missing bot name, When it is loaded to resume, Then it is rejected with a clear error (not passed to resolveLineUpName/lineUpSessionConfig or the table), and Home stays usable
- [x] #8 Given a stored session whose handsPlayed or nextBotId is at or near Number.MAX_SAFE_INTEGER, When Resume restores it, Then it is rejected with a RangeError (cap below MAX_SAFE_INTEGER) rather than producing an unsafe hand number
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
1. Session store: pausedSession() reads all sessions, skips invalid ones (logged), picks the latest not-ended (optional endedAt) session
2. parseSessionRecord: cap handsPlayed/nextBotId at 1,000,000,000 (RangeError)
3. Home: Resume session entry (second, secondary style) with subtitle 'Cash · 6 players · $4/$8 · 132 hands · paused'; data-paused loading|none|shown; hidden on read failure
4. App: Resume restores the session (restoreSession) and opens the Table with a resume option keeping the stored session id; no new start record
5. Tests: unit/acceptance for selection, caps, invalid records, AC#3 kill-at-hand-11 in fake-indexeddb; Playwright resume flow in Chromium and WebKit with axe

Full spec: doit/TASK-2.6/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-6.7 security review MINOR (lineUpSessionConfig trusts seat kind/style)

AC added from TASK-3.10 judge J-1-02.

Build: findPausedSession + HandStore.pausedSession, endedAt (read-only), MAX_SESSION_COUNT cap, Home Resume entry with resumeSummary subtitle, App restore + resume option keeping the stored session id; npm test 994 passed, e2e 190 passed; gate PASS

Review r1: 0 blocking (security MINOR next-bot-name-uncapped; code MINOR seed-sessions duplicate, NIT unreachable Error wrap). Paused before judge: branch CI 45306421540 fails only on tests/advice/postflop-ranges.test.ts timing out under coverage (not this story); resuming after fix story TASK-1.56 merges.

Judge r1 PASS 16/16; CI 45310957352 green on 9d84cec.

Follow-ups: TASK-2.14 AC added (nextBotName cap). Already owned: SNG level in Resume subtitle (TASK-5.6 AC#1-2), Leave table ends session/endedAt (TASK-10.1 AC#9), one unended session (TASK-2.7 AC#4). Not tracked (test harness, below value bar): duplicated e2e seed helper, unreachable Error wrap.

Locked e2e/resume.spec.ts unlocked for TASK-10.1 D-4 (Leave table ends the session; expectation replaced, not loosened).

Locked e2e/resume.spec.ts unlocked for TASK-11.1 Q-4 (Home menu gains Statistics; counts re-pinned, check added).

Locked test(s) unlocked for TASK-12.1 Q-5 (Settings added to Home, route list and play-money walk; e2e DB helpers at v4).

Locked test(s) unlocked for TASK-7.18 Q-3: one vi.setConfig({ testTimeout: 30_000 }) line added after the global testTimeout was removed; no assertion touched.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Home now shows 'Resume session' (game type, table size, stake, hands played) only while a stored, valid, not-ended session exists. Choosing it restores the table under the same session id and deals the next hand from the end-of-last-hand stacks; the abandoned hand is never counted or stored. Stored sessions are validated per record: unknown seat kind/style, missing bot name, and handsPlayed/nextBotId above 1e9 are rejected with RangeError and Home stays usable. Verified: judge round 1 PASS 16/16, 995 tests pass, coverage 96.8%, Playwright resume.spec 6/6 (Chromium+WebKit, axe), manual preview scenario. Review to assume: Q-1 (optional endedAt, read-only) and Q-2 (subtitle copy) auto-accepted, plus A-1..A-9 in the story doc. Risks/follow-ups: Leave table only pauses until TASK-10.1; unended sessions accumulate until TASK-2.7; nextBotName is uncapped (security MINOR); minor e2e helper duplication.
<!-- SECTION:FINAL_SUMMARY:END -->
