# TASK-9.10 — Questions and answers (autopilot, 2026-11-26)

## Q-1 — What the user sees once the hand ends after a grade failed mid-hand
Recommended (A): the documented write-failure rule — result stays on screen, no review panel, no next hand dealt (Deal next hand does nothing), Leave table and Home work, Resume re-deals that hand number, no error screen; consistent with store failures; TASK-13.3 later adds the message + Retry. Alternatives: (B) error screen at hand end; (C) error screen mid-hand (contradicts AC#1).
**Answer: auto-accepted (recommended)** — listed for review. Follow-up: TASK-13.3 must know a write can fail because grading failed (Retry must re-request grades).
