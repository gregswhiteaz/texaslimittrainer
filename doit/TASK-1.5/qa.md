# Q&A — TASK-1.5

## Q-1 — Public interface of the seat view (D-1)
Asked 2026-11-18. Options: plain-data view per spec §5 (Recommended) / opaque engine-only branded view.
**Answer (user):** Approve (Recommended) — plain serialisable `PlayerView` per §5, no brand; `SeatPolicy` synchronous; `actWith` driver included; `result` excluded.

## Q-2 — Source of "cards shown at earlier showdowns" (D-2)
Asked 2026-11-18. Options: caller passes it in (Recommended) / store in hand state / current hand only.
**Answer (user):** Caller passes it in (Recommended) — `earlierShowdowns` parameter, oldest first, default `[]`, passed by reference; `showdownOf(completedState)` builds entries; mucked cards never included; hand.ts unchanged.
