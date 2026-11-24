# TASK-9.7 — Questions and answers (autopilot, 2026-11-24)

No ask items. A-1..A-8 accepted. User-visible copy/UX listed for review: badge text "N Major, M Minor" / "All correct" (A-2), button with aria-label "Open hand review: <text>" (A-3), worst-grade colour, placed where Deal next hand goes (A-4). Auto-open is a non-persisted prop (default on) until TASK-12.6 adds the Settings toggle (A-1).

## Build note — badge clear on hand change
The spec named a useEffect; the lint rule react-hooks/set-state-in-effect rejects setState in an effect, so the badge is cleared during render when the hand number changes (badgeHandNumber state). Same A-6 behaviour.
**Answer: auto-accepted (recommended)** — recorded deviation.
