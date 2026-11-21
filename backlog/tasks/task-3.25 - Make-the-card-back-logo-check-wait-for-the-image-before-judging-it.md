---
id: TASK-3.25
title: Make the card-back logo check wait for the image before judging it
status: To Do
assignee: []
created_date: '2026-11-21T14:36:00Z'
labels:
  - follow-up
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-1.17
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
- [ ] #1 Given the card gallery is opened for each logo mutant, When the mutant is applied, Then the test first waits for the logo element and fails loudly if it is missing (no silent ?. no-op), and the broken-image case is judged only after the image has finished decoding or failed
- [ ] #2 Given the fixed test, When it runs 50 times in a row in WebKit and Chromium locally and in one CI run, Then it passes every time, and each of the three mutants still produces exactly its expected problem list
<!-- AC:END -->
