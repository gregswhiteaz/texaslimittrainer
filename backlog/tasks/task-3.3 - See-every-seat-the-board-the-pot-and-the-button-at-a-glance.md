---
id: TASK-3.3
title: See every seat, the board, the pot and the button at a glance
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-19T00:02:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-0
dependencies:
  - TASK-3.1
  - TASK-3.5
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-3
priority: high
type: feature
ordinal: 18000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to read the whole table state at a glance, so that I can follow the hand and read the situation before I act.

Each bot seat shows name, style label (hiding labels via Settings is E12, REQ-021.2), stack, chips put in on the current street, last action and a card-back marker while it holds cards. The user's seat (always drawn at the bottom centre whatever its seat number, REQ-010.3) shows both hole cards face up, stack and position name (e.g. Cutoff, Button, Small blind, Big blind, Under the gun, Hijack at 6-max). The board shows dealt cards and empty placeholders for undealt ones. The pot total is shown (separate side pots are E03-S07). The dealer button marker sits at the button seat; the seat to act is highlighted. The header shows game type, players, stake and hand number (e.g. "Cash · 6 players · $4/$8 · Hand #133") and a Leave table control. The replay code must not appear anywhere before the hand ends (E09 shows it in the review).

## Requirements covered
- REQ-010 (Should): User seat and starting dealer button — When a session starts, TLH Trainer shall seat the user at a seat chosen at random and place the dealer button at a seat chosen at random.
- REQ-013 (Must): Deck, shuffle and replay code — For every hand, the engine shall shuffle a standard 52-card deck with a Fisher–Yates shuffle driven by a pseudo-random generator seeded from a cryptographically secure random source, and shall record that seed as the hand's replay code.
- REQ-021 (Must): Table display — The Table screen shall show, for every seat, the player name, style label (unless hidden in Settings), stack, chips put in on the current street, last action and whether the player still holds cards, together with the board, the pot total, the dealer button and which player is to act.

Covers: REQ-010, REQ-013, REQ-021

## Notes
E05 adds the SNG level in the header in place of the stake. E04 adds chip art, chips in front of seats, avatars and the action log on top of these seat fields. E10 wires Leave table to end the session and open the Session Report (REQ-004.5).

Plan key: E03-S03 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a scripted 6-max $4/$8 hand on the flop where bot Ben (Calling station) has $146 and bet $4, When the table is shown, Then Ben's seat shows "Ben", "Calling station", "$146", "$4" put in this street, last action "Bet $4" and a card-back marker [REQ-021.1]
- [ ] #2 Given a bot that has folded, When the table is shown, Then its seat shows last action "Folded" and no card-back marker [REQ-021.1]
- [ ] #3 Given the user holds seat 5 of 6 in the cutoff with $184 and, in a second session, seat 1, When each table is drawn, Then the user's seat is at the bottom centre in both and in the first shows both hole cards face up, "$184" and the position name "Cutoff" [REQ-010.3, REQ-021.3]
- [ ] #4 Given the preflop, flop, turn and river of a scripted hand, When the board is shown, Then it shows 0, 3, 4 and 5 dealt cards respectively and an empty placeholder for each undealt card up to 5 [REQ-021.4]
- [ ] #5 Given a scripted hand at each street, When the table is shown, Then the pot total equals the chips collected from previous streets plus the current-street amounts and the dealer button marker is at the button seat [REQ-021.5, REQ-021.6]
- [ ] #6 Given a scripted hand, When each player becomes the player to act, Then exactly that player's seat is highlighted [REQ-021.7]
- [ ] #7 Given hand 133 of a 6-player $4/$8 cash session, When the table is shown, Then the header reads game type "Cash", "6 players", "$4/$8" and "Hand #133" and offers a Leave table control [REQ-021.8]
- [ ] #8 Given a hand in progress at every street, When the Table screen's text and accessible names are searched, Then the hand's replay code appears nowhere [REQ-013.4]
- [ ] #9 Given a bot seat holding face-down cards, When the table renders, Then the seat shows a smaller CardBack marker that still shows the logo and passes axe
- [ ] #10 Given the full seat and header display, When a player acts or is to act, Then the last action and the player to act are shown as visible text, and the TASK-3.1 data-street/data-to-act/data-action-count test hooks are replaced where visible text covers them
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [ ] #2 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [ ] #3 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [ ] #4 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [ ] #5 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [ ] #6 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [ ] #7 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [ ] #8 No new network requests beyond the app's own files [REQ-058.1]
- [ ] #9 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [ ] #10 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [ ] #11 Story documentation is written and published to Backlog.md
- [ ] #12 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. src/table/session.ts: BotStyle 'TAG' | 'Calling station' | 'Maniac' | 'Rock' (Q-1); TableState.handNumber (1, not incremented yet); GameConfig STYLE_LABELS widened.
2. src/table/table-view.ts (headless view model from the user's PlayerView only): per-seat name, style label, stack, 'This street $X', last action in past tense or 'Waiting' (Q-2), card-back flag; user seat with hole cards and position name; board with placeholders; pot = completed pots + street contributions; dealer seat; seat to act; header 'Cash · 6 players · $4/$8 · Hand #N'.
3. src/ui/table: seats clockwise from the user with the user at bottom centre (Q-3), red border + 'To act' badge, 'D' dealer disc, small CardBack marker (30x42), Leave table returns Home (Q-4); no replay code anywhere in the DOM.
4. Cross-story test edits (D-5): the 8 listed in spec §5; data-to-act replaced by visible 'To act'; data-street and data-action-count kept.
5. Tests: view-model unit and acceptance tests; e2e scene harness for scripted states (storyboard hand, user at seat 1, hand 133) in Chromium + WebKit; replay-code absence; axe; fits 1280x720.

Full spec: doit/TASK-3.3/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-3.5 follow-up (doc-20).

AC added from TASK-3.1 follow-up (doc-21).

Cross-story change (orchestrator D-5 on precedent, AC#10): exactly the 8 test edits listed in spec §5 D-5 across e2e/table.spec.ts, e2e/action-bar.spec.ts, e2e/home.spec.ts and tests/ui/table.acceptance.test.tsx. No other assertion may be removed or weakened.

Build: src/table/table-view.ts (headless view model from the user's PlayerView only), BotStyle union (Q-1), handNumber, TableView split, seats clockwise from user at bottom centre, To act badge + D disc (Q-3), past-tense seat text (Q-2), small CardBack 30x42, Leave table -> Home (Q-4); 8 D-5 test edits only; e2e 74 passed Chromium + WebKit; playtest 0 violations; gate PASS. Screenshots: doit/TASK-3.3/table-scene.png, table-live.png.
<!-- SECTION:NOTES:END -->
