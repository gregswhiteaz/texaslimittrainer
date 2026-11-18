---
id: TASK-13.12
title: Install TLH Trainer to the Dock from Chrome or Safari
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-1.18
  - TASK-4.4
  - TASK-2.12
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-13
priority: medium
type: feature
ordinal: 134000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to install TLH Trainer as an app in my Dock, so that I can open it in its own window like any other Mac app.

Adds a web app manifest (name 'TLH Trainer', short_name, start_url and scope under the GitHub Pages base path from E01-S18, display standalone, charcoal background_color, theme colour from the brand) and app icons generated at build time from brand/tlh-logo.jpg (e.g. 192, 512 and maskable PNGs plus a 180 px apple-touch-icon). Safari (macOS Sonoma or later) installs via File > Add to Dock, which reads the page title, the apple-touch-icon link and the manifest; the Dock app opens in its own window. Chrome installs from the address-bar install control. The generated icons are added to the image-asset allow-list of E04-S03 so the build check passes and still rejects any other image (kept in this story because generating the icons is what requires the allow-list change). Installing itself cannot be automated in Playwright, so the two install paths are confirmed by a recorded manual check on macOS in addition to the automated manifest and meta-tag checks.

## Requirements covered
- REQ-060 (Should): Compatibility and look — TLH Trainer shall run and install as a PWA in the latest two major versions of Chrome and Safari on macOS at window sizes of 1280 × 720 and larger, using the branded dark theme.
- REQ-061 (Should): Legal and content — TLH Trainer shall use play money only and shall contain only strategy text and data written for this project.
- REQ-063 (Should): Test commands — The project shall provide npm scripts that run each check with one command.
- REQ-067 (Should): Table, chips and dealer button art — TLH Trainer shall draw the table felt, rail, chips and dealer button in code, using the TLH logo as the only image asset.

Covers: REQ-060, REQ-061, REQ-063, REQ-067

Plan key: E13-S06 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given `npm run build`, When the manifest in the output is validated, Then it has name "TLH Trainer", start_url and scope under the deployed base path, display standalone and icons of 192 and 512 px [REQ-060.2, REQ-063.4]
- [ ] #2 Given the built app served over HTTPS in Chromium, When it has loaded, Then the browser reports it installable (the beforeinstallprompt event fires) [REQ-060.2]
- [ ] #3 Given the built app loaded in WebKit, When its document head is read, Then it has the title "TLH Trainer", an apple-touch-icon link to the 180 px icon generated from the logo and a link to the manifest [REQ-060.2, REQ-060.3, REQ-063.4]
- [ ] #4 Given the app is added to the Dock from Safari on macOS, When it is launched from the Dock, Then it opens in its own window without browser tabs or address bar, named 'TLH Trainer' with the TLH logo icon (recorded manual check) [REQ-060.2, REQ-060.3]
- [ ] #5 Given the app is installed from the latest Chrome on macOS, When it is launched from the Dock, Then it opens in its own window without browser tabs or address bar, named 'TLH Trainer' with the TLH logo icon (recorded manual check) [REQ-060.2, REQ-060.3]
- [ ] #6 Given the generated icons, When they are compared with brand/tlh-logo.jpg, Then each is derived from the logo (resized and padded only) and the manifest and apple-touch-icon reference them [REQ-060.3, REQ-061.3]
- [ ] #7 Given `npm run build`, When the image-asset check runs, Then the logo and the generated icons pass and any other image file still fails naming the file [REQ-067.3]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Manual install checks (Safari Add to Dock and Chrome install on macOS) recorded in the story notes with browser versions and a screenshot of each standalone window [REQ-060.2]
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
