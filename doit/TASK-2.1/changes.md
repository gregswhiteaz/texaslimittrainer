# Changes — TASK-2.1

- `src/table/session.ts` — modified: full plain-data `SessionConfig` (`GameType`, `LineUpName`, `Speed`, players, stake, line-up, seats, speed, user seat, button), first-use `DEFAULT_SESSION_CONFIG`, `resolveSessionConfig` (partial merged over defaults); `seatSession(Partial<SessionConfig>)` seats `config.seats`, `dealHand` uses `config.button`, user-seat checks and `completedHand.userSeat` use `config.userSeat` (D-2, D-4).
- `src/table/action-bar.ts` — modified: `userActionBar` reads the user seat from `table.config.userSeat`.
- `src/ui/table/Table.tsx` — modified: user hole cards from `table.config.userSeat`.
- `src/ui/table/useTableSession.ts` — modified: `config?: Partial<SessionConfig>` (defaults applied by `seatSession`).
- `src/ui/table/TableScreen.tsx` — created: `<main><h1>TLH Trainer</h1><Table config /></main>`, heading focused on mount (A-4).
- `src/ui/home/HomeScreen.tsx` — created: Home (logo from `src/assets/tlh-logo.jpg`, `<h1>`, "Main menu" nav with the red New game button) (D-1, A-6..A-9).
- `src/ui/config/GameConfigScreen.tsx` — created: read-only Game Config summary of the config (Q-4 layout), ← Home / Cancel / Start game (D-6).
- `src/ui/useHeadingFocus.ts` — created (not in the spec's file list): shared hook used by the three screens to focus their `<h1>` after a screen change (A-4). It sets `tabIndex = -1` on the element at focus time instead of rendering `tabIndex`, because the locked TASK-3.1 assertion `toContain('<h1>TLH Trainer</h1>')` on `TableScreen` markup requires a plain `<h1>`.
- `src/ui/App.tsx` — modified: `home → config → table` screen state, Cancel / ← Home back to Home with heading focus; no router, nothing stored (A-1, A-2, D-3).
- `src/ui/styles.css` — modified: charcoal page theme (`#0E0F12` / `#F2F3F5`), Home and Game Config styles from the storyboards, visually-hidden helper, 44 px button targets.
- `e2e/home.spec.ts` — created: SPEC-01..SPEC-06, SPEC-12 (Chromium and WebKit).
- `tests/ui/home.acceptance.test.tsx` — created: SPEC-07, SPEC-08.
- `tests/table/session-config.acceptance.test.ts` — created: SPEC-09.
- `tests/table/session-config.test.ts` — created: SPEC-10 (worked example over 20 seeded hands, partial merge, JSON round-trip).
- `tests/unit/app.test.tsx` — modified (D-5 item 4): App opens on Home.
- `e2e/table.spec.ts` — modified (D-5 item 1): two clicks (New game, Start game) added to `openApp`; nothing else.
- `e2e/action-bar.spec.ts` — modified (D-5 item 2): the same two clicks in `openApp`; nothing else.
- `tests/ui/table.acceptance.test.tsx` — modified (D-5 item 3): renders `<TableScreen config={DEFAULT_SESSION_CONFIG} />` instead of `<App />`; assertions unchanged.
- `doit/TASK-2.1/home.png` — created: review screenshot of Home (Chromium, 1280x720); not shipped.
- `doit/TASK-2.1/config.png` — created: review screenshot of Game Config (Chromium, 1280x720); not shipped.

No new dependencies.
