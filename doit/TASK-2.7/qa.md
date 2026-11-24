# TASK-2.7 — Questions and answers (autopilot, 2026-11-24; user's unattended rule)

## Q-1 — Confirmation dialog copy: heading "End your paused session?"; "Starting a new game ends this paused session:"; the Home summary line (e.g. "Cash · 6 players · $4/$8 · 4 hands · paused"); "Its Session Report will be saved." or "It has no completed hands, so no report is saved."; buttons "Cancel" and "End session and start"
**Answer: auto-accepted (recommended)** — user-visible copy listed for review.

## Spec Detective notes
- A-1 accepted and listed for review: on Confirm, every other valid unended session is also ended (with hands → endedAt = its own updatedAt + saved report; 0 hands → removed, no report — same rule as TASK-10.1 AC#7); invalid records untouched; an older-session failure is logged and does not block the start. No played hand is discarded.
- A-2..A-6 accepted. No locked-test edits needed.

## Block 1 — locked e2e/next-hand.spec.ts:221 (owner TASK-3.4)
Its second page shared the first page's storage, so Start game (correctly) showed the end-session dialog. The fresh page now runs in its own browser context (closed at the end). No assertion changed. Unlocked under TASK-3.4; orchestrator edit.
**Answer: auto-accepted (recommended)** — cross-story locked edit listed for review.

## Build note — focus return on WebKit
WebKit does not focus a clicked button, so after Cancel/Escape focus went to body; GameConfigScreen keeps a ref to Start game and focuses it when the dialog closes (A-2).
