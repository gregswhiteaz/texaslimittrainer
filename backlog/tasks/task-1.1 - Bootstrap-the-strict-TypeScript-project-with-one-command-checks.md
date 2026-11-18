---
id: TASK-1.1
title: Bootstrap the strict TypeScript project with one-command checks
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-18T00:47:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-0
dependencies: []
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-5
parent_task_id: TASK-1
priority: high
type: chore
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a project owner, I want a strict TypeScript toolchain where every check runs with one command, so that every later story can be built and verified the same way locally and in CI.

First story of the project (user asked that language, toolchain and test harness come first). Single language TypeScript (Q-1). Stack per vision: strict TypeScript, Vite, React, Vitest, fast-check, tsx for the Node playtest CLI, Playwright with @axe-core/playwright (axe) for accessibility checks, ESLint + Prettier. Rules engine, bots, advice and statistics live in modules that import no UI or browser-only code and are enforced by a lint rule. Coverage thresholds: line coverage >= 90% for engine/bots/advice/statistics and >= 70% overall. npm scripts: test, e2e, lint, typecheck, build. This story provisions axe so every M1 screen story can meet the global DoD item 'axe reports zero serious or critical violations' [REQ-057.1]. CI is added by E01-S02 immediately after this story; until then the checks are run locally. Actor 'project owner' = the single Learner in the role of the person who builds and maintains the trainer (requirements.md has only the Learner user class).

## Requirements covered
- REQ-057 (Should): Accessibility and usability — Every screen shall meet WCAG 2.1 AA contrast and control-labelling rules, and every grade or status shown in colour shall also be shown as text.
- REQ-059 (Must): Maintainability and testability — The codebase shall be strict TypeScript with the rules engine, bots, advice engine and statistics in modules that import no UI or browser-only code, and shall meet the coverage thresholds below.
- REQ-063 (Should): Test commands — The project shall provide npm scripts that run each check with one command.

Covers: REQ-057, REQ-059, REQ-063

## Notes
Golden-spot tests (E07) join `npm test` when they exist; PWA manifest/service worker (E13) extend `npm run build`. Suggested folders: src/engine, src/bots, src/advice, src/stats, src/ui, tools/playtest. Export a shared `expectNoSeriousAxeViolations(page)` helper for screen stories.

Plan key: E01-S01 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a clean checkout after `npm ci`, When `npm test` runs, Then Vitest executes the unit tests and the fast-check property tests and exits 0 [REQ-063.1]
- [x] #2 Given a clean checkout, When `npm run lint` and `npm run typecheck` run, Then ESLint with Prettier and `tsc` with `strict: true` report zero errors and both exit 0 [REQ-063.3, REQ-059.1, REQ-059.4]
- [x] #3 Given a source file with a type error, When `npm run typecheck` runs, Then it exits non-zero; Given a file violating an ESLint or Prettier rule, When `npm run lint` runs, Then it exits non-zero [REQ-059.1, REQ-059.4]
- [x] #4 Given a module under the engine, bots, advice or statistics folders that imports React, a DOM API or IndexedDB, When `npm run lint` runs, Then it reports an error naming the forbidden import and exits non-zero [REQ-059.2]
- [x] #5 Given line coverage below 90% for the engine, bots, advice or statistics modules, or below 70% overall, When `npm test` runs with coverage, Then it exits non-zero naming the threshold that was missed [REQ-059.3]
- [x] #6 Given a clean checkout, When `npm run build` runs, Then Vite writes the deployable static app to `dist/` and exits 0 [REQ-063.4]
- [x] #7 Given a clean checkout with Playwright browsers installed, When `npm run e2e` runs, Then a smoke test opens the built app in Chromium and in WebKit and both runs pass [REQ-063.2]
- [x] #8 Given `npm run e2e`, When the smoke test runs in Chromium and WebKit, Then it also runs an axe scan of the app's start page and passes only with zero serious or critical violations; Given a test page with an injected critical violation (an image without alt text), Then the axe check fails and `npm run e2e` exits non-zero [REQ-057.1]
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
1. Scaffold strict TypeScript + Vite + React project with exact-pinned deps and committed lockfile (Node >=22.12).
2. Vitest unit + fast-check property tests with coverage thresholds (>=90% headless folders, >=70% overall).
3. ESLint (typescript-eslint strict+stylistic) + Prettier check; headless-boundary rule forbidding React/DOM/IndexedDB/browser-only globals in src/engine, bots, advice, stats.
4. Placeholder start page; npm run build produces static dist/.
5. Playwright smoke + axe scan in Chromium and WebKit via vite preview; injected-violation check.
6. Audit gates: shipped deps no high/critical; all deps no critical.
7. Clean-checkout run of all scripts.

Full spec: doit/TASK-1.1/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: strict TS + Vite/React scaffold, Vitest+fast-check with coverage thresholds, ESLint/Prettier with headless-boundary rule, Playwright+axe in Chromium/WebKit, audit gates; 26 files; gate PASS. A-12: SPEC-07 passing sample adjusted for no-inferrable-types.

Judge round 1: PASS — 25/25 SPEC items; clean-clone chain passed; mutation probes confirmed tests fail when configs are broken. DoD #3/#6/#9/#12 not applicable to this story (per their own scope notes); #10 satisfied locally per its note. DoD #11 checked after documentation.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Bootstrapped the greenfield repo as a strict TypeScript + Vite + React project. Each check runs with one command and exits non-zero on failure: npm test (Vitest + fast-check, v8 coverage at 90% for headless folders and 70% overall), npm run lint (ESLint with typescript-eslint strict+stylistic, react-hooks and Prettier check), npm run typecheck (tsc strict), npm run build, and npm run e2e (Playwright on the built app in Chromium + WebKit, with an axe scan). A generated ESLint headless boundary (tools/lint/headless-boundary.js) forbids React, DOM/browser-only globals (1,146 names), IndexedDB and src/ui imports in src/engine, bots, advice and stats. The shared expectNoSeriousAxeViolations(page) helper is in e2e/support/axe.ts. 26 new files, 4,260 lines (mostly package-lock.json), all deps exact-pinned. Why: every later story builds and verifies the same way, and the CI story (TASK-1.7) only has to call these scripts.

Verification: Judge round 1 PASS on 25/25 SPEC items. npm test 15/15 (8 files), e2e 10 passed, the injected a11y violation fails with image-alt (critical), the clean-clone full chain passes in 12.4 s, the Judge's mutation probes show each toolchain test fails when its config breaks, and the exhaustive 4,584-combination boundary probe had 0 misses. Gate run 1 PASS. Review round 1: 0 blocking. Not fixed: MINOR CR-1-01 (sandbox loses spawn error/timeout cause), MINOR CR-1-02 (build test inherits the Vitest env), NIT CR-1-03 (duplicate write logic and import order).

User decisions: Q-1 approved the supporting deps. Q-3 (superseding Q-2) keeps Vitest 5.1.0 and tolerates the dev-only high picomatch advisory GHSA-fc5q-39xc-vjpf; gates are npm audit --omit=dev --audit-level=high = 0 and all-deps --audit-level=critical = 0. Assumptions A-1..A-12 (incl. A-12: SPEC-07 fixed probe uses `export const x = 1;`) are listed in doc-5 for user review.

Risks/follow-ups (no tasks created): set the Vite base path for GitHub Pages in TASK-1.18; CI in TASK-1.7 needs `npx playwright install --with-deps chromium webkit` and Node >=22.12; tsx belongs to TASK-1.6; revisit the picomatch advisory when a fix ships. Story doc: doc-5.
<!-- SECTION:FINAL_SUMMARY:END -->
