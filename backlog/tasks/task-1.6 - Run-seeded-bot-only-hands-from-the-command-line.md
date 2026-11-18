---
id: TASK-1.6
title: Run seeded bot-only hands from the command line
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:21:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-0
dependencies:
  - TASK-1.5
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-1
priority: high
type: feature
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a project owner, I want to run seeded bot-only hands of the production engine from the command line, so that I can prove the game works without clicking through hands.

Headless playtest CLI on Node via tsx: `npm run playtest -- --hands <n> --seed <s> --size <players>`; default 6-max $4/$8 cash table. Uses the production engine and PlayerView-based seat policies. The same seed and options must produce identical output. Line-up preset, style checks (REQ-027.5), advice determinism check (REQ-036) and bot BB/100 reporting (REQ-062.3) are added by E06/E07 once bots and advice exist. The runner can replay a recorded hand from its replay code, seats, stacks, button and actions (REQ-013.3). Actor 'project owner' = the single Learner in the role of the person who builds and maintains the trainer (requirements.md has only the Learner user class). Interim M1 behaviour (until E01-S10, and until E01-S16 for stacks, in M2): every seat starts each hand with the $160 cash buy-in (20 big bets at $4/$8, REQ-007.1), which exceeds the $96 the most one player can put into a capped hand ($16 preflop + $16 flop + $32 turn + $32 river), so no all-in can arise; and seat policies never make a fifth bet on a street, so the 4-bet cap invariant holds before the engine enforces it. The runner resets every seat to the $160 buy-in before each hand in M1.

## Requirements covered
- REQ-013 (Must): Deck, shuffle and replay code — For every hand, the engine shall shuffle a standard 52-card deck with a Fisher–Yates shuffle driven by a pseudo-random generator seeded from a cryptographically secure random source, and shall record that seed as the hand's replay code.
- REQ-056 (Must): Reliability and invariants — The engine shall complete 1,000,000 headless hands across all table sizes, game types and line-ups with zero invariant violations, and the app shall recover from an unexpected error without losing completed hands.
- REQ-062 (Must): Headless playtest CLI — The project shall provide a command-line playtest runner that plays seeded bot-only hands with the production engine, checks invariants after every action and reports results.

Covers: REQ-013, REQ-056, REQ-062

## Notes
Until E06 bots exist, seats use a seeded random-legal-action policy (RNG from replay code + seat) that never makes a fifth bet on a street. Before each hand every seat is reset to the $160 buy-in; from E01-S16 on the runner keeps real stacks and restores only busted cash seats to $160. E06 owns bot replacement for the real app (REQ-007.5).

Plan key: E01-S07 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given `npm run playtest -- --hands 10000 --seed 42`, When it runs, Then it plays 10,000 hands at a 6-max $4/$8 table with the production engine, prints a report with hands played and the invariant-violation count, and exits 0 [REQ-062.1]
- [ ] #2 Given `--size n` for each n from 3 to 10, When the playtest runs, Then every hand is dealt to exactly n players [REQ-062.1]
- [ ] #3 Given the same seed and options, When the playtest is run twice, Then the two outputs are byte-identical [REQ-062.4]
- [ ] #4 Given seeds 42 and 43 with otherwise identical options, When both runs complete, Then the dealt replay codes differ [REQ-062.4]
- [ ] #5 Given a hand recorded by a playtest run (replay code, seats, stacks, button and actions), When the hand is replayed through the engine, Then every seat receives the same hole cards and the board shows the same cards in the same order [REQ-013.3]
- [ ] #6 Given the M1 seeded random-move seat policy and a street that already has 4 bets (bet plus three raises, the big blind counting as the first bet preflop), When the policy chooses an action, Then it chooses only call or fold and never bet or raise, so `npm run playtest -- --hands 10000 --seed 42` records no street with more than 4 bets [REQ-056.1]
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
