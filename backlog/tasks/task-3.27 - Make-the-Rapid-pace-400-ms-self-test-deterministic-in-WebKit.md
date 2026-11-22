---
id: TASK-3.27
title: Make the Rapid-pace 400 ms self-test deterministic in WebKit
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-21T23:44:00Z'
updated_date: '2026-11-22T00:06:00Z'
labels:
  - follow-up
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-3.13
parent_task_id: TASK-3
priority: high
ordinal: 214000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Main CI #155 (run 44962301903, commit 3637e36) failed only on [webkit] e2e/rapid-pace.spec.ts:248 'the paused-clock pace check catches a 400 ms wait': meterBotAction returned null ('a bot is to act'), i.e. no bot was left to act before the user's turn. Branch CI for the same code (#154) and main #153 passed, so it's timing-dependent: the start-up loop advances the paused clock in 50 ms slices for up to 2,000 ms with every 0 ms wait stretched to 400 ms, so several bot actions (each awaiting a worker reply) can complete during start-up and use up the bots before the user's seat. Test-only flake from TASK-3.13 (locked file; owner TASK-3.13).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the fixed test, When it runs 50 times in a row in WebKit and Chromium locally (--repeat-each 50) and in one CI run, Then it passes every time and still fails if RAPID_BOT_DELAY_MS is set to 400 (proven by mutant)
- [ ] #2 Given the 400 ms self-test, When it starts, Then it advances the paused clock 1 ms at a time only until the deal shows, asserts exactly the two blinds are posted and seat 3 is to act, and the meter returns a time (not null) for the last bot before the user's turn even when that bot's reply lands between its checks
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. meterBotAction: check for a posted worker request before the 'user's turn / hand over' null return (fixes the race; also covers the every-push guard).
2. 400 ms self-test: start-up in 1 ms steps (cap 2,000 fake ms) until the deal shows; assert exactly 2 actions and seat 3 to act.
3. Verify: 50 runs per browser locally, one CI run, mutants (RAPID_BOT_DELAY_MS=400 fails the guard; unstretched timers fail the self-test), stress run with injected worker latency.

Full spec: doit/TASK-3.27/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC#1 rewritten by the user (Q-1): the original hypothesis was refuted; real cause is a check-order race in meterBotAction.
<!-- SECTION:NOTES:END -->
