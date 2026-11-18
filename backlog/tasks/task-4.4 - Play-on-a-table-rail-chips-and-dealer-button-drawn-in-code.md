---
id: TASK-4.4
title: Play on a table, rail, chips and dealer button drawn in code
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-3.16
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-4
priority: medium
type: feature
ordinal: 131000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a player, I want to play on a table drawn in the TLH brand style, so that the table looks like a real, on-brand card room without licensed art.

Table felt, rail, chips and dealer button are drawn in code (SVG/CSS). Felt: green with a subtle texture; rail: dark. Chips use the logo colours red, navy and silver. Brand palette (REQ-067.4): felt base #2F6B4F, rail #24543E, chip red #D7262E, chip navy #1F3A6E, chip silver #C9CED6. 'Subtle texture' is measured on a 200 x 100 px felt sample with no cards, chips or text: mean colour within 6 of #2F6B4F per RGB channel, per-channel standard deviation between 1 and 8, and no pixel more than 24 from #2F6B4F in any channel. The only image asset in the app is the TLH logo (brand/tlh-logo.jpg) and icons generated from it (E13 generates app icons). Builds on the branded layout of E03-S16. The approved table snapshot is a deliverable of this story.

## Requirements covered
- REQ-067 (Should): Table, chips and dealer button art — TLH Trainer shall draw the table felt, rail, chips and dealer button in code, using the TLH logo as the only image asset.

Covers: REQ-067

## Notes
Card faces and backs are already code-drawn (E03-S05); this story covers the remaining table art. Keep the five hex values in the theme tokens (E03-S16) so tests read one source; values are fixed by REQ-067.4.

Plan key: E04-S03 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the Table screen at 1280 x 720 in Chromium and WebKit, When a 200 x 100 px felt sample with no cards, chips or text is captured, Then its mean colour is within 6 of #2F6B4F on each RGB channel [REQ-067.1, REQ-067.4]
- [ ] #2 Given the same 200 x 100 px felt sample, When its pixels are measured, Then each RGB channel has a standard deviation of at least 1 and at most 8, and no pixel differs from #2F6B4F by more than 24 on any channel [REQ-067.1, REQ-067.4]
- [ ] #3 Given the Table screen, When the rail around the felt is sampled, Then its colour is #24543E, its relative luminance is at most 0.08 and lower than the felt's [REQ-067.1, REQ-067.4]
- [ ] #4 Given every chip denomination drawn at the table, When its fill and edge colours are read, Then each is #D7262E (red), #1F3A6E (navy) or #C9CED6 (silver), and the three colours together appear across the chip set [REQ-067.2, REQ-067.4]
- [ ] #5 Given the Table screen, When the dealer button, chips, felt and rail are inspected, Then each is drawn as SVG or CSS in code and none loads an image file [REQ-067.3]
- [ ] #6 Given `npm run build`, When the build output is scanned for image files (png, jpg, jpeg, gif, webp, svg, ico, avif), Then the only ones present are the TLH logo and icons generated from it [REQ-067.3]
- [ ] #7 Given an image file other than the logo is added to the source tree, When the image-asset check runs in `npm test`, Then it fails naming the file [REQ-067.3]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Approved baseline snapshots of the Table screen at 1280 x 720 (6-max, mid-hand with chips in front of seats and the dealer button) are committed for Chromium and WebKit after the user reviews them, and the visual test compares against them in `npm test` [REQ-067.1, REQ-067.2, REQ-067.4]
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
