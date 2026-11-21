---
id: TASK-3.25
title: Make the card-back logo check wait for the image before judging it
status: Done
assignee:
  - '@claude'
created_date: '2026-11-21T14:36:00Z'
updated_date: '2026-11-21T16:30:00Z'
labels:
  - follow-up
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-1.17
documentation:
  - doc-65
parent_task_id: TASK-3
priority: high
ordinal: 211000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.17 (judge J-2-01). The locked e2e test e2e/cards.spec.ts:215 'logo check fails when the logo is hidden or does not load' is flaky on WebKit in CI: 2 of 3 attempts on doit/TASK-1.17 (runs 44892551075, 44893582074 attempt 1) reported ['missing'] instead of ['not decoded'] for the broken-image mutant; it passed 20/20 locally and on main CI #125. 'missing' means logoProblems found no image[data-part="logo"] element at all, so the mutation/check likely races the gallery render (openCardGallery waits for any card-back image, then page.evaluate's setAttribute uses ?. and silently no-ops). The user asked for it to be fixed (2026-11-21). Owners of the locked file: TASK-3.5, TASK-3.20, TASK-3.23 — strengthen-only edits.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the card gallery is opened for each logo mutant, When the mutant is applied, Then the test first waits for the logo element and fails loudly if it is missing (no silent ?. no-op), and the broken-image case is judged only after the image has finished decoding or failed
- [x] #2 Given the fixed test, When it runs 50 times in a row in WebKit and Chromium locally and in one CI run, Then it passes every time, and each of the three mutants still produces exactly its expected problem list
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. openCardGallery: wait with locator.waitFor (real polling) and decode the logo at 512x512 in an awaited evaluate; throw otherwise.
2. Locked e2e/cards.spec.ts (Q-1): before each mutant assert one logo, mutate via logo.evaluate, assert the attribute changed; expectations unchanged.
3. New e2e/card-gallery-open.spec.ts: late-render regression (500 ms) and undecodable-logo rejection.
4. AC#2: --repeat-each 50 in Chromium and WebKit (100 passed) + one green branch CI run.

Full spec: doit/TASK-3.25/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Q-1 (user): strengthen-only edit to locked e2e/cards.spec.ts approved; unlocks recorded under TASK-3.5, 3.20, 3.23.

Build: openCardGallery polls via locator.waitFor + decode check; strengthen-only logo mutation edit (Q-1); new card-gallery-open.spec.ts (late-render regression fails on old helper in both browsers); AC#2 repeat-each 50: 100 passed; npm run e2e 104 passed; gate PASS.

Judge R1 PASS 4/4 (AC#2: repeat-each 50 = 100 passed; branch CI #131 green attempt 1). Follow-ups (Step 6a): none — SPEC-02 matcher MINOR is test-harness, below the value bar (not tracked).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed a flaky WebKit e2e: openCardGallery passed an async predicate to waitForFunction, which Playwright 1.65.1 evaluates once without polling (test-helper bug; product CardBack is static, src/ untouched). It now polls for the logo and awaits its 512x512 decode; the locked mutation test in e2e/cards.spec.ts got a strengthen-only edit (count check, locator mutation, attribute check; Q-1 approved); new e2e/card-gallery-open.spec.ts reproduces the late-render race (fails on old helper). Verified: repeat-each 50 on both browsers = 100 passed; npm test, e2e (104), lint, typecheck clean; branch CI run on 303f566 in progress, see judge. Assumptions A-1..A-4 to review. Follow-up risk: SPEC-02 matcher is loose (below value bar).
<!-- SECTION:FINAL_SUMMARY:END -->
