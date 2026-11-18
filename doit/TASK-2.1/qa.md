# Q&A — TASK-2.1

## Q-1 — Which logo file Home uses and what AC#2 checks (requirements contradiction)
Asked 2026-11-18. Options: keep the 512 px resized copy for Home and card back and reword AC#2 to "derived from brand/tlh-logo.jpg (resized only)" (Recommended) / ship the original unchanged for both / ship both files.
**Answer (user):** Keep resized copy, reword AC (Recommended). AC#2 was reworded through the backlog CLI: Home shows the bundled logo derived only by resizing from brand/tlh-logo.jpg (the same file as the card back), and drawn at 64x64 it matches the original within an average of 4 per colour channel. REQ-061.3 is read as "the logo comes from brand/tlh-logo.jpg"; the requirements text itself is unchanged.

## Q-2 — SessionConfig shape (public interface, later persisted)
Asked 2026-11-18. Options: approve the plain-data shape with defaults (Recommended) / add a version field now.
**Answer (user):** Approve (Recommended): gameType 'cash', players 6, stake {smallBet 4, bigBet 8}, lineUp 'Custom', seats DEFAULT_SEATS (Ava 1, Ben 2, Cal 3, Dee 4, You 5, Eli 6; bots TAG), speed 'rapid', userSeat 5, button 6. Callers take Partial<SessionConfig> merged over the defaults. No version field; the storage layer handles versioning (REQ-054).

## Q-3 — Edits to earlier stories' tests
Asked 2026-11-18. Options: add the two clicks and point the unit test at TableScreen (Recommended) / a shipped skip-to-table hook.
**Answer (user):** Add the two clicks (Recommended). Exactly these edits, with no assertion removed:
1. e2e/table.spec.ts openApp: click New game, then Start game.
2. e2e/action-bar.spec.ts openApp: the same two clicks.
3. tests/ui/table.acceptance.test.tsx: render TableScreen with DEFAULT_SESSION_CONFIG instead of App.
4. tests/unit/app.test.tsx: rewritten to expect Home (this file is not locked).

## Q-4 — Game Config text and layout
Asked 2026-11-18. Options: approve the §5 read-only layout (Recommended) / 'TAG' labels / buttons only.
**Answer (user):** Approve (Recommended): "← Home" and h1 "New game"; a Session panel (Cash game; 6 (6-max); $4 / $8; Buy-in $160 (20 big bets); Rapid); an Opponents panel (Seats 1–4 and 6: Ava, Ben, Cal, Dee, Eli, each "Tight-aggressive"; "You — Seat 5"); Cancel and a red Start game at the bottom right.
