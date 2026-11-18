---
id: TASK-3.5
title: Read big-index cards drawn in code
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-18T20:21:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-0
dependencies:
  - TASK-1.1
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-3
priority: high
type: feature
ordinal: 14000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want big-index cards drawn in code, so that I can read every card instantly even at Rapid speed.

All cards are SVG drawn in code in a big-index style: rank plus a large suit symbol, no face-card illustrations. Rank characters at least 24 CSS px tall at 1280 x 720. Two-colour deck: hearts and diamonds red, spades and clubs black. Four-colour deck (the Settings toggle REQ-050.4 is E12): clubs green, diamonds blue, hearts red, spades black. Card backs show the TLH logo (dreams/limit-holdem-trainer/brand/tlh-logo.jpg, the only image asset). Built first in M1 as a standalone card component (no table needed) so the tracer E03-S01 and the seat display E03-S03 can show cards.

## Requirements covered
- REQ-066 (Must): Card rendering — TLH Trainer shall draw all playing cards in code as SVG in a big-index style showing a large rank and suit, with a card back that shows the TLH logo.

Covers: REQ-066

Plan key: E03-S05 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given all 52 card faces, When each is rendered, Then it shows its rank and a large suit symbol and contains no illustration image [REQ-066.1]
- [ ] #2 Given a card rendered at the size used for the user's hole cards and the board at a 1280 x 720 window, When its rank characters are measured, Then each is at least 24 CSS px tall [REQ-066.2]
- [ ] #3 Given two-colour deck mode, When all 52 faces are rendered, Then hearts and diamonds are red and spades and clubs are black [REQ-066.3]
- [ ] #4 Given four-colour deck mode, When all 52 faces are rendered, Then clubs are green, diamonds blue, hearts red and spades black [REQ-066.3]
- [ ] #5 Given a card back is rendered, When it is shown, Then it shows the TLH logo [REQ-066.4]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Playwright visual snapshot of all 52 faces in both deck modes and of the card back [REQ-066.1, REQ-066.3, REQ-066.4]
- [ ] #2 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [ ] #3 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [ ] #4 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [ ] #5 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [ ] #6 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [ ] #7 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [ ] #8 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [ ] #9 No new network requests beyond the app's own files [REQ-058.1]
- [ ] #10 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [ ] #11 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [ ] #12 Story documentation is written and published to Backlog.md
- [ ] #13 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. src/ui/cards/card-art.ts: SVG path data for 13 rank glyphs (ten as '10') and 4 suits, colour tables (two- and four-colour per Q-2), accessible labels.
2. src/ui/cards/PlayingCard.tsx: PlayingCard({card, deck?}) 60x84 big-index face (rank top-left ~28 px, large suit bottom-right), CardBack() black with red frame and logo (Q-3), DeckColoursContext (two-colour default, prop overrides).
3. src/assets/tlh-logo.jpg: 512 px, JPEG q80, imported via Vite.
4. Tests: unit (all 52 faces, colours, labels, invalid card RangeError), e2e test-only gallery (Q-4) in Chromium and WebKit at 1280x720 measuring rank height >= 24 px, colours, logo on back, axe clean; macOS-only pixel baselines.

Full spec: doit/TASK-3.5/spec.md
<!-- SECTION:PLAN:END -->
