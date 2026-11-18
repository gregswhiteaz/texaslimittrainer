---
id: TASK-3.5
title: Read big-index cards drawn in code
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-18T20:51:00Z'
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
  - doc-20
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
- [x] #1 Given all 52 card faces, When each is rendered, Then it shows its rank and a large suit symbol and contains no illustration image [REQ-066.1]
- [x] #2 Given a card rendered at the size used for the user's hole cards and the board at a 1280 x 720 window, When its rank characters are measured, Then each is at least 24 CSS px tall [REQ-066.2]
- [x] #3 Given two-colour deck mode, When all 52 faces are rendered, Then hearts and diamonds are red and spades and clubs are black [REQ-066.3]
- [x] #4 Given four-colour deck mode, When all 52 faces are rendered, Then clubs are green, diamonds blue, hearts red and spades black [REQ-066.3]
- [x] #5 Given a card back is rendered, When it is shown, Then it shows the TLH logo [REQ-066.4]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Playwright visual snapshot of all 52 faces in both deck modes and of the card back [REQ-066.1, REQ-066.3, REQ-066.4]
- [x] #2 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [x] #3 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [x] #4 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [x] #5 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [x] #6 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [x] #7 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [x] #8 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [x] #9 No new network requests beyond the app's own files [REQ-058.1]
- [x] #10 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [x] #11 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [x] #12 Story documentation is written and published to Backlog.md
- [x] #13 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. src/ui/cards/card-art.ts: SVG path data for 13 rank glyphs (ten as '10') and 4 suits, colour tables (two- and four-colour per Q-2), accessible labels.
2. src/ui/cards/PlayingCard.tsx: PlayingCard({card, deck?}) 60x84 big-index face (rank top-left ~28 px, large suit bottom-right), CardBack() black with red frame and logo (Q-3), DeckColoursContext (two-colour default, prop overrides).
3. src/assets/tlh-logo.jpg: 512 px, JPEG q80, imported via Vite.
4. Tests: unit (all 52 faces, colours, labels, invalid card RangeError), e2e test-only gallery (Q-4) in Chromium and WebKit at 1280x720 measuring rank height >= 24 px, colours, logo on back, axe clean; macOS-only pixel baselines.

Full spec: doit/TASK-3.5/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: src/ui/cards/{card-art.ts,PlayingCard.tsx} (original SVG path glyphs, colours per Q-2, back per Q-3, DeckColoursContext), src/assets/tlh-logo.jpg (512 px, 52 KB), test-only e2e gallery (Q-4), macOS pixel baselines; e2e 24 passed (Chromium + WebKit). Gate build #1 failed the line budget only because the doit tool counted newline bytes in new binary files (JPEG/PNG); tool fixed to skip binaries; gate PASS. Review screenshot: doit/TASK-3.5/gallery.png.

CI run 44393724120 (head 04048e3): success first push (E2E 22 passed, visual skipped on Linux per A-4). Judge round 1: PASS 13/13; 104 faces painted colours verified by canvas sampling in Chromium and WebKit; logo decodes and is visible; production bundle has no card/gallery code. Follow-ups (Step 6a): created TASK-3.20 (painted-colour and logo-visibility checks in CI, Linux baselines, glyph-fit test); ACs added to TASK-12.7 (deck setting wiring), TASK-3.3 (small back marker), TASK-2.12 (reuse logo), TASK-13.12 (icons from logo). Skipped: NIT double validation (harmless).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added standalone React SVG cards: PlayingCard (52 big-index faces, two- and four-colour decks, 60x84 px) and CardBack with the TLH logo (512 px JPEG, first shipped image asset), in src/ui/cards/. Nothing is wired into the app yet; TASK-3.1/3.3/12.7 consume it. Verified: Vitest markup tests, Playwright Chromium+WebKit at 1280x720 (rank/suit >= 24 px, colours, axe, no network), 6 macOS visual baselines (skipped on Linux CI); lint, typecheck, npm test and e2e pass; code and security review round 1 had no blocking findings; judge and CI pending. Assumptions to review: A-1..A-8 (card size, logo derivative, macOS-only baselines, interface). Look: doit/TASK-3.5/gallery.png. Follow-ups: path-level colour and logo-visibility e2e gaps (need cards.spec.ts unlocked), Linux baselines, deck setting wiring (TASK-12.7), small back marker (TASK-3.3), logo reuse (TASK-2.12, E13).
<!-- SECTION:FINAL_SUMMARY:END -->
