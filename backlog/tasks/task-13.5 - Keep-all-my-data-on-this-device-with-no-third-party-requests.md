---
id: TASK-13.5
title: Keep all my data on this device with no third-party requests
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-1.18
  - TASK-10.1
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-13
priority: medium
type: feature
ordinal: 111000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want the app to send nothing about me anywhere, so that my practice and mistakes stay private on my Mac.

No analytics, telemetry, tracking or third-party requests; no fonts, scripts or styles from CDNs. The app asks for and stores no personal information (no name, email, account, location or contact field). A Content-Security-Policy (as a meta tag in index.html, because GitHub Pages cannot set headers) restricts scripts, styles, connections and workers to the app's own origin. Fit: Playwright network log over a full session shows only same-origin requests for app files.

## Requirements covered
- REQ-058 (Should): Privacy and security — TLH Trainer shall keep all user data on the device and make no network requests other than loading and updating the app's own files from its host.

Covers: REQ-058

## Notes
React style props are applied through the CSSOM and are not blocked by style-src 'self'; avoid inline <style> injection by libraries.

Plan key: E13-S09 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a full Playwright session (launch, Game Config, 30 hands with hints and reviews, Leave table and the Session Report), When the network log is read, Then every request is same-origin for an app file and none goes to any other host [REQ-058.1]
- [ ] #2 Given the built bundle and package.json, When they are scanned, Then they contain no analytics, telemetry or tracking library and no URL of a third-party host loaded at runtime [REQ-058.1]
- [ ] #3 Given the app source, When every form field in its UI components and every stored record type is listed by an automated scan, Then none asks for or holds a name, email, account, location or contact detail [REQ-058.2]
- [ ] #4 Given the built index.html, When its Content-Security-Policy is read, Then script-src, style-src, connect-src and worker-src allow only 'self' [REQ-058.3]
- [ ] #5 Given a test page of the built app that injects a script from another origin and fetches another origin, When it runs, Then both are blocked and a CSP violation is reported [REQ-058.3]
- [ ] #6 Given the CSP is in force, When a full session runs in Chromium and WebKit, Then no CSP violation is reported by the app's own files [REQ-058.3]
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
