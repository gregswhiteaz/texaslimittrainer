---
id: TASK-1.3
title: Deal every hand from a seeded shuffle with a replay code
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-18T04:09:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-0
dependencies:
  - TASK-1.7
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-1
priority: high
type: feature
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want every hand dealt from a fairly shuffled deck identified by a replay code, so that dealing is realistic and any hand can be reproduced exactly.

Standard 52-card deck shuffled with Fisher-Yates driven by a seeded PRNG. The per-hand seed comes from crypto.getRandomValues in the browser and the Node crypto module headlessly; the seed is recorded as the hand's replay code. Same replay code produces the same deck order; full-hand replay (same replay code + seats + stacks + button + actions -> same cards in the same order) is proven in E01-S07 once the hand engine exists. (Hiding the replay code until the hand ends and showing it in Hand Review are E03/E09.)

## Requirements covered
- REQ-013 (Must): Deck, shuffle and replay code — For every hand, the engine shall shuffle a standard 52-card deck with a Fisher–Yates shuffle driven by a pseudo-random generator seeded from a cryptographically secure random source, and shall record that seed as the hand's replay code.

Covers: REQ-013

## Notes
Use a small, well-known seedable PRNG (e.g. a 128-bit xoshiro/sfc variant) so replay is stable across browsers and Node.

Plan key: E01-S03 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given any of 10,000 seeds, When a deck is shuffled, Then it contains each of the 52 cards exactly once [REQ-013.1]
- [ ] #2 Given 100,000 seeded shuffles, When the position of the first card is tabulated, Then a chi-square uniformity test passes at p > 0.01 [REQ-013.1]
- [ ] #3 Given a new hand in the browser, When its seed is drawn, Then the seed comes from crypto.getRandomValues; Given a new hand in Node, Then the seed comes from the Node crypto module [REQ-013.2]
- [ ] #4 Given the same replay code, When the deck is shuffled twice, Then both decks have identical card order [REQ-013.3]
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
1. src/engine/seeded-random.ts: add mixState128 (two SplitMix32-finaliser passes, bijective, non-zero state for valid codes) and Xoshiro128.nextIntUnbiased (Lemire with rejection); keep existing outputs unchanged and forbidden strings out.
2. src/engine/deck.ts: ReplayCode (32 lowercase hex, 128-bit), newReplayCode() via globalThis.crypto.getRandomValues(Uint32Array(4)) (redraw all-zero), replayCodeFromWords, isReplayCode, shuffledDeck(code) = Durstenfeld Fisher–Yates over [0..51], index 0 dealt first.
3. Tests: 10,000-seed permutation property, 100,000-shuffle chi-square (two tabulations), golden decks and mix vectors, determinism, Node crypto source.
4. e2e/replay-seed.spec.ts: in-memory Vite bundle injected into the preview page; recorder on crypto.getRandomValues; Chromium + WebKit.

Full spec: doit/TASK-1.3/spec.md
<!-- SECTION:PLAN:END -->
