# Q&A — TASK-3.5

## Q-1 — Card face design (D-1)
Asked 2026-11-18. Options: big corner rank + big suit, SVG paths, '10' (Recommended) / centred stacked / 'T' for tens / system-font text.
**Answer (user):** Big corner rank + big suit (Recommended) — 60×84 CSS px, face #FAFAF7 with 1 px #A7AEB8 border, rank top-left ~28 px drawn height, one large suit (30 px) bottom-right, ranks and suits as SVG paths (no <text>, no fonts), ten shown as "10", accessible names "Ace of spades" … "Face-down card".

## Q-2 — Suit colours (D-2)
Asked 2026-11-18. Options: storyboard colours (Recommended) / brand red / brighter green-blue.
**Answer (user):** Storyboard colours (Recommended) — red #B42318, black #111111; four-colour clubs #1D6B35, diamonds #1D4ED8.

## Q-3 — Card back (D-3)
Asked 2026-11-18. Options: black + red frame + logo (Recommended) / navy fill / silver frame.
**Answer (user):** Black + red frame + logo (Recommended) — #000000 fill, 2 px #D7262E inset frame, full logo centred 52×52.

## Q-4 — Where cards are shown before the table exists (D-4)
Asked 2026-11-18. Options: test-only gallery inside e2e (Recommended) / hidden page in app / gallery on start page.
**Answer (user):** Test-only gallery (Recommended) — rendered only in e2e via the in-test Vite build; nothing new ships; TASK-3.1 is the first in-app use.

## D-5 — Component interface (classified assume by the orchestrator, not asked)
Internal React props are reversible and low-impact, so recorded as an assumption: `PlayingCard({ card, deck? })`, `CardBack()`, `DeckColoursContext` (default two-colour, prop overrides), fixed size, code in src/ui/cards/.
