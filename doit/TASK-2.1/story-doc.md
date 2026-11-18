# TASK-2.1: Start a game from Home through Game Config

Status: Done (Judge and CI pending at time of writing) · Completed: 2026-11-18 · Epic: TASK-2 — Launch and set up a session · Milestone: m-0 · Requirements: REQ-002.1, REQ-002.2, REQ-006.1, REQ-060.3, REQ-061.3 · Branch: doit/TASK-2.1

## What was asked
The app no longer opens straight on the table. On load it shows Home: the TLH logo, the name "TLH Trainer" and a red New game control on a charcoal background. New game opens a Game Config screen showing the fixed first-use session (cash game, 6 players, $4/$8, you plus five TAG bots). Start game deals the first hand at the existing Table; Cancel and "← Home" go back to Home. Spec: doit/TASK-2.1/spec.md.

Screenshots for review (Chromium, 1280x720): `doit/TASK-2.1/home.png` and `doit/TASK-2.1/config.png`.

## Assumptions made without asking — please review
All are reversible. Full wording is in spec.md section 2.

| ID | Assumption | Why | To reverse |
|---|---|---|---|
| A-1 | Home, Game Config and Table are three in-app screens held in `App` state; page load always opens Home. | One entry point; no new dependency. | Router library or URL hash routes |
| A-2 | Screen changes add no browser-history entries. Browser Back leaves the app; reload opens Home (a mid-hand reload discards the hand, as before). | Nothing is persisted yet, so there is nothing to restore. | `history.pushState` plus `popstate` (follow-up F-3) |
| A-3 | Controls are native `<button>`s, not the storyboard's `<a href>`. "← Home" is styled as the storyboard link and is at least 44 px tall. | There are no URLs to link to; REQ-057.4 needs 44 px targets. | Anchors with `href="#"` |
| A-4 | After a screen change (not on first load), focus moves to the new screen's `<h1>`. | The clicked button unmounts, so focus would drop to `<body>`. | Leave focus on `<body>` |
| A-5 | No Inter web font; the storyboard's Google Fonts link is dropped and the existing `system-ui` stack is used. | REQ-058.1 forbids third-party requests. | Self-host Inter (needs approval) |
| A-6 | The New game subtitle is `#FFFFFF`, not the storyboard's `#FBE3E4`. | `#FBE3E4` on `#D7262E` is 4.09:1, below the AA 4.5:1 minimum; white is 4.99:1. | Darker red or larger bold subtitle |
| A-7 | Home keeps the subtitle "Set up a cash game or sit-and-go" although sit-and-go arrives later (TASK-2.4/E05). | Storyboard text is approved. | Shorten until TASK-2.4 |
| A-8 | The Home menu column keeps the storyboard width (max 508 px); the right "Last session" column is absent until TASK-2.16/2.17. | Matches the storyboard. | Full-width card |
| A-9 | The Home logo is `alt=""`, 64x64, 12 px radius, beside the `<h1>`. | The adjacent heading already names the app (storyboard uses `alt=""`). | `alt="TLH logo"` |
| A-10 | The page background becomes charcoal `#0E0F12` with text `#F2F3F5` on every screen, including around the table felt. | REQ-060.3; felt colour stays with TASK-3.16. | Charcoal on Home/Config only |
| A-11 | `SessionConfig` invariants are not validated in this story (players equals seat count, one user seat at `userSeat`, button among the seats). | The only producer is the default constant; the first loader must validate (F-4). | `assertSessionConfig` now |

## Clarifications and decisions
- **Q-1 Logo file and AC#2.** The requirements contradict themselves: Home and the card back could not both use the 512 px resized copy and also be the unchanged original. The user chose to keep the resized copy. AC#2 was reworded in Backlog through the CLI: Home shows the bundled logo derived only by resizing from brand/tlh-logo.jpg (the same file as the card back), and drawn at 64x64 it matches the original within an average of 4 per colour channel. REQ-061.3 is read as "the logo comes from brand/tlh-logo.jpg"; the requirement text is unchanged.
- **Q-2 SessionConfig shape.** Approved as plain data with no version field (the storage layer owns versioning, REQ-054): gameType `'cash'`, players 6, stake `{smallBet 4, bigBet 8}`, lineUp `'Custom'`, seats `DEFAULT_SEATS` (Ava 1, Ben 2, Cal 3, Dee 4, You 5, Eli 6; bots TAG), speed `'rapid'`, userSeat 5, button 6. Callers pass `Partial<SessionConfig>`, merged over the defaults.
- **Q-3 Edits to earlier stories' tests.** Approved exactly four edits, with no assertion removed or changed:
  1. `e2e/table.spec.ts` `openApp` clicks New game, then Start game.
  2. `e2e/action-bar.spec.ts` `openApp` does the same two clicks.
  3. `tests/ui/table.acceptance.test.tsx` renders `TableScreen` with `DEFAULT_SESSION_CONFIG` instead of `App`.
  4. `tests/unit/app.test.tsx` is rewritten to expect Home (not a locked file).
  The code reviewer confirmed the diff is exactly these four edits.
- **Q-4 Game Config text and layout.** Approved: "← Home" and h1 "New game"; a Session panel (Cash game; 6 (6-max); $4 / $8; Buy-in $160 (20 big bets); Rapid); an Opponents panel (Ava, Ben, Cal, Dee, Eli, each "Tight-aggressive"; "You — Seat 5"); Cancel and a red Start game at the bottom right.
- **Builder departures from the spec, judged sound by the code reviewer:**
  - `src/ui/useHeadingFocus.ts` was added although it is not in the spec's file list. It sets `tabIndex = -1` at focus time instead of rendering it, because the locked TASK-3.1 assertion `toContain('<h1>TLH Trainer</h1>')` needs a plain `<h1>`. Three screens share it.
  - The App unit test allows an optional leading `<link rel="preload" as="image">`, which React 19 adds to server output for the logo. Mutants in that test were still caught.
  - SPEC-02 asked to compare the card back's href ("same URL"). The built app renders no card back, so the test checks that the served Home logo bytes match the SHA-256 of `src/assets/tlh-logo.jpg`, that the app's JS references exactly one `.jpg` URL (the Home logo), and that the card gallery's `CardBack` logo decodes to the same bytes. Plus the 64x64 canvas mean difference of at most 4 against the brand original.

## What was built
Data flow: `App` holds the screen (`home`, `config`, or `table` with a config). Home's New game opens Game Config, which shows `DEFAULT_SESSION_CONFIG` read-only. Start game passes the config to `TableScreen`, which mounts the existing Table. The Table session, action bar and card display now read seats, button and user seat from the config instead of module constants. No router; nothing is stored.

User-visible change: playing another hand is now reload, New game, Start game, until TASK-2.14 adds a Home control on the Table (F-5).

Files (from changes.md; no new dependencies):
- `src/table/session.ts` — full `SessionConfig`, `DEFAULT_SESSION_CONFIG`, `resolveSessionConfig`; `seatSession(Partial<SessionConfig>)` uses config seats, button and user seat.
- `src/table/action-bar.ts` — user seat from `table.config.userSeat`.
- `src/ui/table/Table.tsx`, `src/ui/table/useTableSession.ts` — user hole cards from `config.userSeat`; accept `Partial<SessionConfig>`.
- `src/ui/table/TableScreen.tsx` (new) — `<main><h1>TLH Trainer</h1><Table/></main>`.
- `src/ui/home/HomeScreen.tsx` (new) — logo, `<h1>`, "Main menu" nav with the red New game button.
- `src/ui/config/GameConfigScreen.tsx` (new) — read-only summary, ← Home, Cancel, Start game.
- `src/ui/useHeadingFocus.ts` (new) — focus the `<h1>` after a screen change.
- `src/ui/App.tsx` — screen state. `src/ui/styles.css` — charcoal theme and screen styles, 44 px targets.
- Tests: `e2e/home.spec.ts`, `tests/ui/home.acceptance.test.tsx`, `tests/table/session-config.acceptance.test.ts`, `tests/table/session-config.test.ts` (new); the four Q-3 edits above.

## How it was verified
| SPEC item | Covers | Verification | Result |
|---|---|---|---|
| SPEC-01..06, 12 | AC#1-6, DoD#7/8 | `e2e/home.spec.ts` (Chromium and WebKit, 14 runs): launch, logo, theme, New game starts no session, Cancel/← Home store nothing, Start game deals; axe clean, fits 1280x720, same-origin | pass |
| SPEC-07, 08 | AC#1, 3, 5 | `tests/ui/home.acceptance.test.tsx` | pass |
| SPEC-09, 10 | AC#5, 6 | `tests/table/session-config.acceptance.test.ts`, `tests/table/session-config.test.ts` (worked example over 20 seeded hands, partial merge, JSON round-trip) | pass |
| SPEC-11 | AC#1, 5 | `tests/unit/app.test.tsx`, `tests/ui/table.acceptance.test.tsx` | pass |
| SPEC-13 | DoD#7 | `npm run e2e`: 60 passed | pass |
| SPEC-14 | DoD#1, 2, 4 | `npm run lint`, `npm run typecheck`, `npm test`: 63 files, 228 passed, 1 skipped | pass |
| SPEC-15 | DoD#5, 6 | `npm run playtest -- --hands 10000 --seed 42`: 0 invariant violations | pass |
| SPEC-16 | DoD#10, 11 | CI run and doc publication | pending (CI runs after this doc) |
| SPEC-17 | DoD#3, 9, 12 | Judge confirmation | pending (Judge runs after this doc) |

Gates: build-1 PASS and fix-2 PASS (956 changed lines, 18 files). Locked acceptance tests: `e2e/home.spec.ts`, `tests/ui/home.acceptance.test.tsx`, `tests/table/session-config.acceptance.test.ts`. Judge rounds: none yet (pending).

## Review
Round 1, code and security reviewers: no BLOCKER or MAJOR findings; all 17 SPEC items passed correctness and test-strength. Both reviewers' round-1 outputs are clean. Checks the reviewers made on the visuals: the Session panel's heading is visually hidden, as spec section 5 says (the storyboard has no visible Session heading either); the "← Home" link is `#FF6B70` at 6.93:1 on `#0E0F12`, while `#D7262E` is used only as a background behind white text (4.99:1). Security: no new external requests, no storage, URL or network reads, no new dependencies; bot hole cards are never rendered.

Size: 956 changed lines in 18 files against a budget of 700 / 16 (warn, not a failure).

### Non-blocking review notes (deliberately not fixed)
- MINOR: the first-load Home must not move focus (A-4), but no test asserts it. A mutant removing the `!enabled ||` guard in `useHeadingFocus.ts` left all Home tests passing.
- MINOR: the Table's user-cards seat is untested. The mutant `p.seat === 5` in `Table.tsx:16` survives, because only the default seat 5 is rendered.
- MINOR (code and security): the shallow `Partial` merge can produce an inconsistent config. For example `userSeat: 2` makes a bot seat the user, so that bot's cards would show face up, which breaks REQ-025. Not reachable today, since the only config source is the default constant. Validate when a stored config is first loaded (F-4).
- NIT: `stacks` taken from `DEFAULT_SEATS` instead of `config.seats` is not caught (equivalent mutant for the worked example).
- NIT: the "heads-up" and "full ring" table-size labels and the label fallback in `GameConfigScreen.tsx` are unreachable while players is fixed at 6 (they come from the storyboard).

## How to try it
`npm run build && npm run preview`, then open http://localhost:4173 at 1280x720. Home shows the logo, "TLH Trainer" and a red New game. New game opens the fixed session; Cancel or ← Home returns. Start game seats Ava, Ben, Cal, Dee, Eli and You at $160 and deals. Reload returns to Home. Checks: `npm run lint && npm run typecheck && npm test`, `npm run e2e`.

## Run metrics
Questions asked 4 · assumptions logged 11 · review rounds 1 (0 blocking findings) · judge rounds 0 so far (pending) · gate runs 2 · escalations 0 · changed lines 956 across 18 files.

## Known limitations and follow-ups
Game Config is read-only; hands cannot be replayed without reload until TASK-2.14. Follow-ups, one line each with the owner (the orchestrator turns these into tasks or ACs):
- TASK-2.2, 2.3, 2.4, 2.5, 2.11: replace the read-only Game Config rows with selectors writing the same `SessionConfig` fields; TASK-2.4 widens `GameType` to cash/sit-and-go without `stake` for sit-and-go (F-1).
- TASK-2.13: draw `userSeat` and `button` per session start and replace "You — Seat 5" with the storyboard's random-seat text (F-2).
- TASK-2.14 or TASK-2.6: decide browser Back/forward behaviour once sessions persist (history entries per screen; Back from the Table pauses to Home) (F-3).
- TASK-2.6 or TASK-3.10: add `assertSessionConfig` (players 2-10 equals seat count, one user seat at `userSeat`, button among seats, known vocabularies) and fail closed with a RangeError when a stored config is loaded (F-4; covers the MINOR merge finding).
- TASK-2.14: add the Table header Home control, the only way back to Home from the Table until then (F-5).
- TASK-2.16 and TASK-2.17: add the Home right column (last-session snapshot or first-use message) and drop the fixed 508 px menu width if needed (F-6).
- Pin by test (owner: TASK-2.1 follow-up AC or TASK-2.2): Home first load does not move focus; Table renders the user's cards at a non-default `userSeat`; `stacks` come from `config.seats`.
- Remove the unreachable heads-up / full-ring labels or cover them when TASK-2.2 adds the player-count selector.

## Lessons for the factory (proposals — not applied)
- The spec shipped `<h1 tabIndex={-1}>` that contradicted a locked earlier-story assertion (`<h1>TLH Trainer</h1>`); the builder had to invent a hook outside the file list. The spec writer should grep locked tests for markup assertions on any element the spec changes.
- The SPEC-02 "card back same URL" check assumed the built app renders a card back, which it does not. The spec should confirm a check's target exists in the running app before locking it.
- Size came in at 956 lines / 18 files against 700 / 16. Screen-state plus theme plus session-config refactor in one story is large; consider splitting the SessionConfig change from the screens when the spec is sized.
