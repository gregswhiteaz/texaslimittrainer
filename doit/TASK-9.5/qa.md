# TASK-9.5 — Questions and answers (autopilot, 2026-11-24; user's unattended rule)

## Q-1 — Shown cards in the review: a list between the header and the decisions, one line per opponent who showed, "Ben showed" + two drawn cards + " · Pair of kings"
**Answer: auto-accepted (recommended)** — user-visible copy/UX listed for review.

## Spec Detective notes
- A-1..A-6 accepted. No locked-test edits needed (A-6 checked).

## Build note — SPEC-04 search scope
SPEC-04 literally searches the panel for cards of every seat not in record.shown.shown, which includes the user (who mucked in REVIEW_DEE_MUCKS) — but the header always shows the user's own cards. Search is applied to opponent seats only.
**Answer: auto-accepted (recommended)** — recorded deviation.
