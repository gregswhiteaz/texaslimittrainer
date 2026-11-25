---
id: TASK-6.26
title: >-
  Tidy after same-style bot replacement (dead Replay option, stale comments,
  style justifications)
status: To Do
assignee: []
created_date: '2026-11-25T05:57:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-6.25
references:
  - doc-130
parent_task_id: TASK-6
priority: low
ordinal: 241000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-6.25 review and judge (doc-130). Since replacements keep their style, src/playtest/cli.ts replacedStylesOption can no longer print anything in a real run; runner.ts PlaytestOptions.lineUp comment still says a replacement is drawn from the preset; rock.json CO raise justification omits the added AJo (offsuit); maniac.json fold-to-call justification ends with an unclear clause; tests/bots/replacement.acceptance.test.ts tally() still loops 10,000 replay codes though style no longer depends on the code.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a playtest run, When its Replay line is built, Then no dead replaced-styles branch remains in src/playtest/cli.ts and its cli test is updated without removing a check of live behaviour
- [ ] #2 Given runner.ts and the Rock and Maniac style files, When read, Then the lineUp comment says replacements keep their style, the Rock CO raise justification names AJo, and the Maniac fold-to-call justification is one clear sentence
- [ ] #3 Given tests/bots/replacement.acceptance.test.ts, When it runs, Then the same-style checks hold over a small fixed set of codes with the same check count
<!-- AC:END -->
