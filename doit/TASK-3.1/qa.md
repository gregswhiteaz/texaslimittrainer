# Q&A — TASK-3.1

## Q-1 — What happens when the hand ends (D-3)
Asked 2026-11-18. Options: one hand per page load, buttons removed, final stacks and board stay, `Hand over` status, reload deals a new hand (Recommended) / "Deal next hand" button with carried stacks / auto-deal next hand immediately.
**Answer (user):** One hand per load (Recommended). TASK-3.4 adds the real result display and the 1.5 s auto-deal, and must settle stack carry-over and the engine's minimum-stack rule.

## Not asked (settled by requirements or storyboards, recorded as assumptions)
- Bot names and seating (A-1) come from the Table storyboard and TASK-3.3 AC#1/#3.
- No artificial bot delay (A-5): the glossary defines Rapid as "bots act without artificial delay", and Rapid is the default speed (REQ-012.2, REQ-050.1).
- In-memory CompletedHand record (A-7): TASK-3.9 owns the persisted format.
