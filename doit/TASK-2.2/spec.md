# Spec: TASK-2.2 — Choose how many players sit at the table

Status: READY (approved 2026-11-22)
Task: TASK-2.2 · Parent/epic: TASK-2 (Launch and set up a session) · Requirements: REQ-005, REQ-015 · Dream: limit-holdem-trainer

## 1. Summary
Game Config's read-only "Players at the table" row becomes a choice of 2 to 10 players (including the user),
labelled `2 (heads-up)`, `6 (6-max)` and `10 (full ring)` as in the Config storyboard. For 3, 4, 5, 7 and 8 players
the screen says advice will be approximate and names the reference size it uses. Start game seats the user plus
`size − 1` bots. The heads-up seat labels are fixed to match the engine's heads-up blinds (the button is the small
blind). Position names at every size, and review grading at 2 and 10 players, get tests.

## 2. Scope
- In scope:
  - `src/table/session.ts`: `TABLE_SIZES` (2..10) and a pure `configForPlayers(config, players)` that gives the
    seats, user seat and button for a chosen size (Q-4). At 6 it reproduces today's default seating exactly.
  - `src/ui/config/GameConfigScreen.tsx`: a `<select id="config-players">` in place of the read-only row (Q-1);
    the approximate-advice note (Q-2); the Opponents list follows the chosen size; Start game passes the
    chosen size's seats. Every entry of `TABLE_SIZE_NAMES` is used as an option label (AC#10).
  - `src/table/table-view.ts` `positionName`: heads-up labels, button = `Small blind`, other seat = `Big blind` (Q-3).
  - `src/ui/styles.css`: a style for the note.
  - Tests: new acceptance tests (unit and Playwright), unit edits, and the amended locked tests listed in Q-5.
- Not doing:
  - Line-up presets, per-seat styles, randomised seats or button (TASK-2.5, 2.8, 2.9, 2.13). Bots at every
    size are TAG, as today (Q-4).
  - Remembering the last chosen size (TASK-2.10, REQ-012). Nothing is stored (TASK-2.1 A-2).
  - The "approximate" label on hints and review entries (REQ-041, its own story). Only Game Config shows the note.
  - The storyboard's static help line ("Advice is tuned for heads-up, 6-max and full ring…"). AC#4 forbids an
    approximate notice at exact sizes, so the line is replaced by the per-size note.
  - The 10-seat table layout and vertical layout at 1280 × 720 (TASK-3.16). This story only checks that the
    seats are present and the header is right.
  - Engine, bots and advice code: no changes. Heads-up rules (TASK-1.11) and the heads-up and full-ring charts
    (TASK-7.6) are already done.
- Scope budget: files=15, lines=560

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The Game Config screen keeps the chosen size in local state, starting at `config.players`. While the chosen size equals `config.players` the screen shows and starts `config` as given; otherwise it uses `configForPlayers(config, size)`. Going 6 → 2 → 6 gives back the default seating exactly. | yes | It keeps a future pre-filled config (TASK-2.10) intact and keeps the default flow byte-identical, so the locked default-flow tests keep passing. | Always rebuild through `configForPlayers` (same result for the default config) |
| A-2 | `configForPlayers` keeps `gameType`, `stake`, `speed` and `lineUp` from the input config, and sets `players`, `seats`, `userSeat` and `button`. `lineUp` stays `'Custom'` for the default config (all TAG matches no preset), so replacement bots keep drawing from all four styles, as at 6 today (`src/table/session.ts:103`, `src/bots/lineup.ts:137`). | yes | Line-up names belong to TASK-2.5. | Reset `lineUp` to a preset |
| A-3 | The note is a `<p id="config-players-note" className="config-note">` inside the players `<dd>`, after the `<select>`, and the `<select>` has `aria-describedby="config-players-note"` only while the note shows. No live region. | yes | The note is next to the control it explains, and screen readers read it as the select's description. A live region would announce on every change, which is noisy for a 9-option list. | `role="status"` live region; a note under the field list |
| A-4 | AC#9 is proven at model level (vitest): sessions at 2 and 10 players, the user always checking or calling, run until a hand opens a review, and `reviewEntries` / `userReviewEntries` grade every decision with no throw. The browser review flow (TASK-9.1 e2e) stays at 6. | yes | `gradeView` is pure, and the review panel only renders `userReviewEntries` (`src/table/review.ts:61`). A browser run at 10 seats is slow and its layout belongs to TASK-3.16. | A Playwright review at 2 and 10 players |
| A-5 | `configForPlayers` throws `RangeError('Table size must be a whole number from 2 to 10')`, the same text as `seatLineUp` (`src/bots/lineup.ts:66`), for a size that is not an integer from 2 to 10. The UI can only pass `TABLE_SIZES` values. | yes | Matches existing guards. | Clamp the value |

## 3. Current system
- Game Config: `src/ui/config/GameConfigScreen.tsx:33-42` holds `TABLE_SIZE_NAMES` `{2:'heads-up',6:'6-max',10:'full ring'}`
  and `playersLabel`; line 100 renders the read-only row `['players', 'Players at the table', playersLabel(config.players)]`;
  line 104 lists bots from `config.seats`; line 152 starts with `configForGameType(config, gameType, stake)`.
  The stake `<select>` at lines 78-93 is the pattern to copy (controlled `value`, `<label htmlFor>` in the `<dt>`).
  `.config-fields select` is already styled (`src/ui/styles.css:138`).
- App: `src/ui/App.tsx:26` always opens Game Config with `DEFAULT_SESSION_CONFIG`; `onStart` hands the config to
  `TableScreen`.
- Session: `src/table/session.ts:60-69` `USER_SEAT = 5`, `DEFAULT_BUTTON = 6`, `DEFAULT_SEATS` (Ava, Ben, Cal, Dee,
  You at 5, Eli at 6, all TAG); `SessionConfig.players` is documented as "2..10 including the user; equals
  seats.length" (line 80). `configForGameType` (line 126) carries `players, lineUp, seats, speed, userSeat, button`.
  `nextHand` moves the button clockwise over `seats` and uses `config.players` for replacements (lines 235-268).
  `seatSession` does not validate the config (A-11 of TASK-2.1).
- Engine: heads-up blinds and order are done (TASK-1.11, locked `tests/engine/heads-up.acceptance.test.ts`):
  with 2 seats the button posts the small blind.
- Header: `headerText` (`src/table/table-view.ts:64-68`) prints `${config.players} players`.
- Positions: `positionName` (`src/table/table-view.ts:97-123`, TASK-3.3 A-2 rule). For 2 seats it names the
  button `Button` and the other seat `Small blind`, which is wrong since TASK-1.11 (`doit/TASK-1.11/story-doc.md:57`).
  It is shown for the user's seat only (`table-view.ts:208`).
- Advice: `referenceSizeOf` (`src/advice/preflop.ts:57-62`): 2 → heads-up, 3–7 → 6-max, 8–10 → full-ring;
  `positionOf` handles 2..10 (lines 69-83). `gradeView` (`src/advice/grade.ts:144`) calls `recommend`.
  Review: `reviewEntries` / `userReviewEntries` (`src/table/review.ts:38-63`).
- Bot names: `BOT_NAMES` `Ava…Ivy`, 9 names for a 10-seat table (`src/bots/lineup.ts:7-17`).
- Tests: vitest (`npm test` = `vitest run --coverage`), acceptance files `*.acceptance.test.*`; SSR UI tests
  use `renderToString` (e.g. `tests/ui/game-config-stake.acceptance.test.tsx`). Playwright `npm run e2e`
  (Chromium + WebKit) against `vite preview` on `http://localhost:4173`; axe through
  `e2e/support/axe.ts::expectNoSeriousAxeViolations`; bot-driven waits must use `runUntil` / `runUntilMyTurn`
  from `e2e/support/paused-clock.ts` (TASK-1.52), with the clock installed and paused before `page.goto`
  (`e2e/home.spec.ts:212-214`); fixed deals through `stubReplayWords` (`e2e/support/table-harness-bundle.ts:117`).
- Existing code to reuse:
  - `src/advice/preflop.ts` `referenceSizeOf` → the size → reference-size mapping (do not duplicate the 3–7 / 8–10 ranges).
  - `src/bots/lineup.ts` `BOT_NAMES` → bot names in seat order.
  - `src/table/session.ts` `USER_SEAT`, `configForGameType`, `seatSession`, `dealHand`, `stepBot`, `nextStep`,
    `userActions`, `applyUserAction`, `completedHand`, `nextHand` → driving sessions in tests.
  - `src/table/review.ts` `reviewEntries`, `userReviewEntries`, `opensReview` → AC#9.
  - `src/engine/deck.ts` `replayCodeFromWords` and `tests/support/table-scenarios.ts` `SCENARIO_CODE` → fixed deals.
  - `e2e/game-type-choice.spec.ts:19-24` `openGameConfig`, `e2e/support/table-locators.ts`, `e2e/support/paused-clock.ts`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | The players choice is a native `<select>` labelled "Players at the table" with options `2 (heads-up)`, `3`, `4`, `5`, `6 (6-max)`, `7`, `8`, `9`, `10 (full ring)` | 9 radio buttons; a stepper | The Config storyboard draws exactly this select (`dreams/limit-holdem-trainer/storyboards/Config.dc.html:35-38`). Radios would break more locked tests (radio counts and `checked` lists in TASK-2.3/2.4 tests) | yes | user (Q-1) |
| D-2 | Approximate note text: `Advice will be approximate (based on 6-max).` or `Advice will be approximate (based on full ring).` | See Q-2 | Same "approximate (based on <reference size>)" phrasing that REQ-041.1 sets for hints and reviews | yes | user (Q-2) |
| D-3 | Heads-up position names: button seat `Small blind`, other seat `Big blind` | `Button` / `Big blind`; `Small blind (button)` | AC#11; the dealer disc already marks the button | yes | user (Q-3) |
| D-4 | Seating for a size n: user at seat `min(5, n)`, bots in the other seats in ascending order named `BOT_NAMES[0..n-2]`, all TAG; button = the seat after the user (`userSeat % n + 1`) | Mixed preset through `seatLineUp` now; user at seat 1 | n = 6 gives exactly `DEFAULT_SEATS`, `USER_SEAT` and `DEFAULT_BUTTON`, so every locked default-flow test keeps passing; presets are TASK-2.5 | yes | user (Q-4) |
| D-5 | Amend 5 locked tests (TASK-2.1, 2.3, 2.4) that count `<select>` elements or comboboxes on Game Config | Avoid a second control (impossible: any control breaks a count) | See Q-5 | yes | user (Q-5) |
| D-6 | The reference-size names come from `TABLE_SIZE_NAMES` of the reference size's own exact size: heads-up → `TABLE_SIZE_NAMES[2]`, 6-max → `[6]`, full-ring → `[10]` | A second name table | One source of names; keeps AC#10 true | no | n/a |

## 5. Design

### Files to create / modify
- `src/table/session.ts` — add `TABLE_SIZES` and `configForPlayers`.
- `src/table/table-view.ts` — heads-up branch in `positionName`; update its doc comment.
- `src/ui/config/GameConfigScreen.tsx` — players `<select>`, approximate note, Opponents follow the chosen size, Start game uses it.
- `src/ui/styles.css` — `.config-note` style (muted text, small margin; contrast ≥ 4.5:1 on the panel).
- `tests/table/table-size.acceptance.test.ts` — new: SPEC-05, 06, 07, 08, 09.
- `tests/ui/game-config-players.acceptance.test.tsx` — new: SPEC-01, 02, 03, 04.
- `e2e/players-choice.spec.ts` — new: SPEC-10, 11.
- `tests/table/session-config.test.ts` — unit: `configForPlayers` errors and field carry-over (SPEC-12).
- `tests/table/table-view.test.ts` — unit: update any 2-seat `positionName` expectation (SPEC-07).
- Locked, amended with approval (Q-5): `tests/ui/home.acceptance.test.tsx`, `tests/ui/game-config-stake.acceptance.test.tsx`,
  `tests/ui/game-config-game-type.acceptance.test.tsx`, `e2e/stake-choice.spec.ts`, `e2e/game-type-choice.spec.ts`.

### Components, interfaces and data
```ts
// src/table/session.ts
/** REQ-005.2: the players options, 2..10 including the user, ascending. Frozen. */
export const TABLE_SIZES: readonly number[];
/** `config` seated for `players` (D-4): seats 1..players ascending; the user ('You', kind 'user', style null)
 *  at min(USER_SEAT, players); bots named BOT_NAMES in ascending seat order, style 'TAG'; button = userSeat % players + 1.
 *  gameType, stake (cash only), speed and lineUp are kept. RangeError if players is not an integer 2..10 (A-5). */
export function configForPlayers(config: SessionConfig, players: number): SessionConfig;
```
- Invariants of the result: `players === seats.length`; seat numbers `1..players`; exactly one user seat at
  `userSeat`; `button ∈ 1..players`; bot names unique.
- `GameConfigScreen` gains `const [players, setPlayers] = useState(config.players)` and
  `const seated = players === config.players ? config : configForPlayers(config, players)` (A-1). The Opponents
  list and the `You · Seat n` row read `seated`; Start game calls `onStart(configForGameType(seated, gameType, stake))`.
- Players field: `['players', <label htmlFor="config-players">Players at the table</label>, playersChoice]`, where
  `playersChoice` is `<select id="config-players" value={String(players)} onChange=…>` with one
  `<option value="n">` per `TABLE_SIZES` entry whose text is `playersLabel(n)` (a single string, so SSR emits no
  `<!-- -->`), followed by the note when it applies. The `<select>` sits before the stake `<select>` in the DOM.
- `playersNote(players): string | null` (module-private in the screen): `null` when `players` is 2, 6, 9 or 10;
  otherwise `Advice will be approximate (based on ${name}).` where `name` is the D-6 name of
  `referenceSizeOf(players)`.

### Rules and algorithms
- Seating (D-4), worked examples (`seat:name`, U = user):
  - 2: `1:Ava, 2:U`, button 1 → Ava is button and small blind, the user is big blind.
  - 3: `1:Ava, 2:Ben, 3:U`, button 1.
  - 4: `1:Ava, 2:Ben, 3:Cal, 4:U`, button 1.
  - 5: `1:Ava … 4:Dee, 5:U`, button 1.
  - 6: `1:Ava, 2:Ben, 3:Cal, 4:Dee, 5:U, 6:Eli`, button 6 — deep-equals `DEFAULT_SEATS`, `USER_SEAT`, `DEFAULT_BUTTON`.
  - 10: `1:Ava … 4:Dee, 5:U, 6:Eli, 7:Fay, 8:Gus, 9:Hal, 10:Ivy`, button 6.
- Note mapping (REQ-005.3/005.4): 2, 6, 9, 10 → no note; 3, 4, 5, 7 → `Advice will be approximate (based on 6-max).`;
  8 → `Advice will be approximate (based on full ring).`
- `positionName` for `seats.length === 2`: button → `Small blind`, the other seat → `Big blind`. For 3..10 the
  TASK-3.3 A-2 rule is unchanged. Expected names for seats `1..n` with the button at seat n:
  - 2: `Big blind, Small blind`
  - 3: `Small blind, Big blind, Button`
  - 4: `Small blind, Big blind, Cutoff, Button`
  - 5: `Small blind, Big blind, Hijack, Cutoff, Button`
  - 6: `Small blind, Big blind, Under the gun, Hijack, Cutoff, Button`
  - 7: `Small blind, Big blind, Under the gun, Under the gun +1, Hijack, Cutoff, Button`
  - 8: `…, Under the gun, Under the gun +1, Under the gun +2, Hijack, Cutoff, Button`
  - 9: `…, Under the gun … Under the gun +3, Hijack, Cutoff, Button`
  - 10: `…, Under the gun … Under the gun +4, Hijack, Cutoff, Button`

### Error handling and configuration
- `configForPlayers`: `RangeError('Table size must be a whole number from 2 to 10')` for non-integer, < 2 or > 10.
- The `<select>` `onChange` ignores a value that is not in `TABLE_SIZES` (cannot happen from the UI).
- Defaults: 6 players, as today.

## 6. Behaviour specification

### SPEC-01: The players options are exactly 2 to 10, with the size names, 6 selected
- Verifies: AC#1, AC#7, AC#10, DoD#1
- Behaviour: Given `GameConfigScreen` rendered (`renderToString`) with `DEFAULT_SESSION_CONFIG`, When the markup
  is read, Then the `<dt>` list still reads `Game type, Players at the table, Stakes (small bet / big bet), Buy-in, Speed`;
  the players `<dd>` holds `<select id="config-players">` with `<label for="config-players">Players at the table</label>`;
  its option values are `['2','3','4','5','6','7','8','9','10']` and texts
  `['2 (heads-up)','3','4','5','6 (6-max)','7','8','9','10 (full ring)']`; only `6 (6-max)` is selected; no
  read-only players text remains. `TABLE_SIZES` equals `[2,3,4,5,6,7,8,9,10]` and is frozen. Every value of
  `TABLE_SIZE_NAMES` (`heads-up`, `6-max`, `full ring`) appears in an option text.
- Verification: acceptance `tests/ui/game-config-players.acceptance.test.tsx::players options are exactly 2 to 10 with heads-up, 6-max and full ring labels and 6 selected`

### SPEC-02: 3, 4, 5 and 7 players show the approximate note naming 6-max
- Verifies: AC#2, DoD#1
- Behaviour: Given `GameConfigScreen` rendered with `configForPlayers(DEFAULT_SESSION_CONFIG, n)` for n in 3, 4, 5, 7,
  When the markup is read, Then `n` is the selected option, the players `<dd>` contains
  `<p id="config-players-note" …>Advice will be approximate (based on 6-max).</p>` exactly once, and the select carries
  `aria-describedby="config-players-note"`.
- Verification: acceptance `tests/ui/game-config-players.acceptance.test.tsx::3, 4, 5 and 7 players say advice is approximate based on 6-max`

### SPEC-03: 8 players shows the approximate note naming full ring
- Verifies: AC#3, DoD#1
- Behaviour: Given the screen rendered with `configForPlayers(DEFAULT_SESSION_CONFIG, 8)`, When read, Then the note
  text is exactly `Advice will be approximate (based on full ring).` and the select is described by it.
- Verification: acceptance `tests/ui/game-config-players.acceptance.test.tsx::8 players says advice is approximate based on full ring`

### SPEC-04: 2, 6, 9 and 10 players show no approximate note; Opponents follow the size
- Verifies: AC#4, AC#7, DoD#1
- Behaviour: Given the screen rendered with `configForPlayers(DEFAULT_SESSION_CONFIG, n)` for n in 2, 6, 9, 10 (and
  `DEFAULT_SESSION_CONFIG`), When read, Then the markup contains neither `config-players-note`, `aria-describedby`
  on the players select, nor the word `approximate`. For every n in 2..10 the Opponents list has exactly n − 1
  bot rows (`Seat s · name · Tight-aggressive`, ascending seats) and the `You` row reads `Seat min(5, n)`.
- Verification: acceptance `tests/ui/game-config-players.acceptance.test.tsx::2, 6, 9 and 10 players show no approximate note and list size minus 1 opponents`

### SPEC-05: Each size seats the user and size − 1 bots, and the header shows the size
- Verifies: AC#5, AC#7, DoD#1
- Behaviour: Given `configForPlayers(DEFAULT_SESSION_CONFIG, n)` for each n in 2..10, When `seatSession` takes it and
  the first hand is dealt with `SCENARIO_CODE`, Then `config.players === n`, `seats.length === n`, exactly one seat is
  `kind 'user'` at `min(5, n)` named `You`, n − 1 seats are TAG bots named `BOT_NAMES[0..n-2]` in ascending seat
  order, the button is `userSeat % n + 1`, the hand deals in n players, `tableView(table).seats` has n entries and
  `tableView(table).header` is `Cash · ${n} players · $4/$8 · Hand #1`. For n = 6 the config deep-equals
  `DEFAULT_SESSION_CONFIG`. The same holds for a sit-and-go config (`Sit-and-go · ${n} players · 20/40 · Hand #1`).
- Verification: acceptance `tests/table/table-size.acceptance.test.ts::every size from 2 to 10 seats the user and size minus 1 bots with the size in the header`

### SPEC-06: Heads-up, the button posts the small blind and the other player the big blind
- Verifies: AC#6, AC#11, DoD#1
- Behaviour: Given `seatSession(configForPlayers(DEFAULT_SESSION_CONFIG, 2))` dealt with `SCENARIO_CODE`, When the first
  hand is read, Then `hand.button` is 1, the first action record is `small-blind` by seat 1 for 2 and the second
  `big-blind` by seat 2 for 4, and seat 1 acts first. `tableView` shows seat 1 (Ava) `isButton: true` with action
  `Small blind $2`, and the user (seat 2) action `Big blind $4` and position `Big blind`. After `nextHand` and the
  next deal, the button is seat 2, the user posts `small-blind` 2 and the user's position is `Small blind`.
- Verification: acceptance `tests/table/table-size.acceptance.test.ts::heads-up the button posts the small blind and is labelled Small blind`

### SPEC-07: Position names at every size follow the requirements' naming
- Verifies: AC#8, AC#11, DoD#1
- Behaviour: Given seats `1..n` with the button at seat n, When `positionName` is called for each seat, Then the names
  are exactly the §5 lists for n = 2..10 (one assertion per size). Also, for each n, the user's
  `tableView(...).seats` position on a dealt `configForPlayers(DEFAULT_SESSION_CONFIG, n)` session equals
  `positionName(userSeat, seats, button)` and is one of the §5 names. Any existing 2-seat expectation in the unit
  file `tests/table/table-view.test.ts` is updated to `Big blind` / `Small blind`.
- Verification: acceptance `tests/table/table-size.acceptance.test.ts::position names at 2 to 10 seats follow the Button, blinds, Cutoff, Hijack, Under the gun rule`

### SPEC-08: Review grades every user decision at 2 and 10 players
- Verifies: AC#9, DoD#1
- Behaviour: Given a session from `configForPlayers(DEFAULT_SESSION_CONFIG, n)` for n = 2 and n = 10, When hands are
  dealt with fixed replay codes (`replayCodeFromWords([0x9e3779b9, n, k, 0])`, k = 1, 2, …), bots act through
  `stepBot`, and the user checks when legal, otherwise calls, Then within at most 20 hands a completed hand has
  `opensReview(hand) === true` with at least one postflop decision; for that hand `reviewEntries(hand)` and
  `userReviewEntries(hand)` do not throw, each returns one entry per user decision, and each entry's grade equals
  `gradeView(decision.view, decision.action.type)` (`reviewEntries`) and has a `GRADE_LABELS` label.
- Verification: acceptance `tests/table/table-size.acceptance.test.ts::review grades every user decision at 2 and 10 players`

### SPEC-09: Start game hands over the chosen size, game type and stake together
- Verifies: AC#5, AC#7, DoD#1
- Behaviour: Given the screen's start logic, When the chosen size is n and the user starts a cash game at $10/$20 or a
  sit-and-go, Then the started config equals `configForGameType(configForPlayers(DEFAULT_SESSION_CONFIG, n), gameType, stake)`
  (for n = 6, `configForGameType(DEFAULT_SESSION_CONFIG, …)`). Checked in the browser by SPEC-10 (header and seats)
  and at model level here by `configForGameType(configForPlayers(...))` keeping `players`, `seats`, `userSeat`, `button`.
- Verification: acceptance `tests/table/table-size.acceptance.test.ts::the chosen size survives the game type and stake choice`

### SPEC-10: In the browser each size starts a table with that many players
- Verifies: AC#1, AC#2, AC#3, AC#4, AC#5, AC#7, DoD#1, DoD#7, DoD#8
- Behaviour: Given the app at `/` with a paused clock, When the user opens New game, Then the combobox labelled
  `Players at the table` lists `2 (heads-up)` … `10 (full ring)` with `6 (6-max)` selected and no note. Selecting
  each label in turn shows the note `Advice will be approximate (based on 6-max).` for 3, 4, 5, 7,
  `Advice will be approximate (based on full ring).` for 8, and no note for 2, 6, 9, 10; the Opponents list has
  size − 1 rows. For each size 2..10: select it, Start game, then the header reads
  `Cash · ${n} players · $4/$8 · Hand #1`, the `Seats` list has n items with exactly one `li[data-user]`; Leave table
  returns Home. axe reports zero serious or critical violations on Game Config with 7 players (note showing) and on the
  table at 2 and 10 players. Every request goes to `http://localhost:4173`. Runs in Chromium and WebKit.
- Verification: acceptance `e2e/players-choice.spec.ts::each table size from 2 to 10 starts with that many players and the right advice note`

### SPEC-11: In the browser a 2-player table posts heads-up blinds
- Verifies: AC#6, AC#11, DoD#1, DoD#7
- Behaviour: Given a paused clock and `stubReplayWords` with words under which the button bot does not fold preflop
  (the builder picks them and pins the same code in SPEC-06's model check), When the user selects `2 (heads-up)` and
  starts, and `runUntilMyTurn` returns, Then the dealer disc is on seat 1 (Ava), the user (seat 2) shows position
  `Big blind` and stack `$156` (posted $4), seat 1 has acted before the user, and the header reads
  `Cash · 2 players · $4/$8 · Hand #1`. All waits use `runUntil` / `runUntilMyTurn` from `e2e/support/paused-clock.ts`.
- Verification: acceptance `e2e/players-choice.spec.ts::a heads-up table puts the small blind on the button`

### SPEC-12: configForPlayers rejects bad sizes and keeps the other settings
- Verifies: AC#7, DoD#1
- Behaviour: Given `configForPlayers`, When called with 1, 11, 2.5 or NaN, Then it throws `RangeError` with message
  `Table size must be a whole number from 2 to 10`. Called on a sit-and-go config it returns a sit-and-go config
  without `stake`; on a cash $10/$20 config it keeps the stake; `speed` and `lineUp` are kept.
- Verification: unit `tests/table/session-config.test.ts::configForPlayers rejects bad sizes and keeps game type, stake, speed and line-up`

### SPEC-13: Earlier stories' tests still pass, with the default flow unchanged
- Verifies: DoD#1, DoD#7
- Behaviour: Given the change and the Q-5 amendments, When the full unit and browser suites run, Then all pass,
  including locked `e2e/home.spec.ts`, `tests/table/session-config.acceptance.test.ts`, `e2e/table-display.spec.ts`,
  `e2e/review.spec.ts` and the engine heads-up tests, with their expected values unchanged.
- Verification: integration `npm test && npm run e2e`

### SPEC-14: Lint, typecheck, tests, coverage and headless boundary
- Verifies: DoD#2, DoD#4, DoD#5
- Behaviour: Given the change, When the checks run, Then lint (incl. the headless-boundary rule and prettier),
  typecheck and the tests pass with zero errors, and coverage is ≥ 90% for engine/bots/advice/statistics and ≥ 70%
  overall. `src/table/session.ts` imports nothing from `src/ui`.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-15: Playtest stays clean at 2, 6 and 10 seats
- Verifies: DoD#6
- Behaviour: Given engine, bots and advice are untouched, When the 10,000-hand playtest runs at sizes 2, 6 and 10,
  Then each reports zero invariant violations.
- Verification: command `npm run playtest -- --hands 10000 --seed 42 --size 2 && npm run playtest -- --hands 10000 --seed 42 && npm run playtest -- --hands 10000 --seed 42 --size 10`

### SPEC-16: CI green and story documentation published
- Verifies: DoD#10, DoD#11
- Behaviour: Given branch `doit/TASK-2.2` is pushed, When CI runs, Then every job is green. The story document for
  TASK-2.2 is published to Backlog.md.
- Verification: manual CI run on branch `doit/TASK-2.2` and `backlog doc list --plain`

### SPEC-17: Not-applicable DoD items
- Verifies: DoD#3, DoD#9, DoD#12
- Behaviour: Given the golden-spot suite (E07-S14) and the offline service worker (E13-S07) do not exist yet, and this
  story adds no chart, range or strategy text (the note only names a reference size), When judged, Then these
  items are N/A.
- Verification: manual Judge confirms no `tests/advice/*golden*` suite and no service worker exist, and the diff adds no strategy content

## 7. Edge cases
- Boundary sizes 2 and 10: SPEC-05, 06, 07, 08, 10, 11. Heads-up label flip after the button moves: SPEC-06.
- Size 6 must equal today's default (no regressions in locked tests): SPEC-05, SPEC-13.
- Switching sizes back and forth (6 → 2 → 6): A-1; covered by SPEC-10 (selecting each size in turn ends on the
  default rows when 6 is re-selected — the builder asserts the 6-player rows once more at the end).
- Changing game type or stake after choosing a size: SPEC-09.
- Invalid size from code: SPEC-12. Invalid size from the UI: cannot occur (fixed option list).
- Sit-and-go at small sizes: SPEC-05 (header). Elimination to heads-up mid-session is TASK-1.11 / REQ-020, unchanged.
- Concurrency, permissions, dependency failure: N/A — a synchronous client-side form with no I/O.

## 8. Security considerations
- Trust boundaries: the only input is a `<select>` with fixed options; `onChange` accepts only `TABLE_SIZES` values,
  and `configForPlayers` range-checks. No text input, no storage, no network (SPEC-10 checks same-origin requests).
- authn/authz, secrets, injection, logging: N/A — no server, no user text, React escapes all output.
- New dependencies: none. Randomness: none added (seating is deterministic; random seats are TASK-2.13).

## 9. Non-functional
- Accessibility: the select has a visible `<label>`; the note is linked by `aria-describedby`; axe zero serious or
  critical violations (SPEC-10); the note text meets 4.5:1 contrast (axe colour-contrast rule).
- Layout: the screen keeps no horizontal overflow at 1280 × 720 (existing `e2e/game-type-choice.spec.ts` overflow check
  keeps passing).
- Performance: `configForPlayers` is O(n ≤ 10); no measurable cost.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run build && npm run preview` then open `http://localhost:4173` (or `npm run dev`)
- New tests: `tests/ui/game-config-players.acceptance.test.tsx` → SPEC-01..04; `tests/table/table-size.acceptance.test.ts`
  → SPEC-05..09; `e2e/players-choice.spec.ts` → SPEC-10, SPEC-11; `tests/table/session-config.test.ts` → SPEC-12;
  `tests/table/table-view.test.ts` → SPEC-07 unit update. Amended (locked, Q-5): see Q-5. Browser: `npm run e2e`.
- E2E notes for the builder: select with `page.getByLabel('Players at the table').selectOption({ label: '7' })`. Copy
  `openGameConfig` from `e2e/game-type-choice.spec.ts:19-24` and the paused-clock setup from `e2e/home.spec.ts:212-214`
  (install and pause the clock, and call `stubReplayWords`, before `page.goto`). Never wait on bot play with
  `waitForTimeout` or raw `clock.runFor` loops; use `runUntil` / `runUntilMyTurn`. Count seats with
  `page.getByRole('list', { name: 'Seats' }).getByRole('listitem')`.
- Judge scenario: `npm run build && npm run preview`, open `http://localhost:4173` at 1280×720 in Chrome and Safari.
  New game → "Players at the table" shows `6 (6-max)`, no note, five opponents. Pick `7` → note
  `Advice will be approximate (based on 6-max).`, six opponents. Pick `8` → `… (based on full ring).` Pick `9`, `10`,
  `2 (heads-up)` → no note. With 2: Start game → header `Cash · 2 players · $4/$8 · Hand #1`, Ava has the dealer
  disc and posts `Small blind $2`, you are `Big blind`; play to the next hand → you have the button and your position
  reads `Small blind`. Leave table → New game → 10 → Start → 10 seats, header `Cash · 10 players …`; play a hand to a
  review and check it opens. Switch to Sit-and-go with 4 players → header `Sit-and-go · 4 players · 20/40 · Hand #1`.

## 11. Open questions
- None. Q-1..Q-4 were auto-accepted as recommended. Q-5 was approved by the user: the 5 locked tests listed under
  Q-5 detail may be amended, but only their select/combobox count and selection lines.

## 12. Clarifications log
See `doit/TASK-2.2/qa.md`.

### Q-5 detail: locked tests to amend (approved by the user, Q-5; only the dropdown count/selection lines change)
| File (owner) | Line(s) | Today | Change |
|---|---|---|---|
| `tests/ui/home.acceptance.test.tsx` (TASK-2.1) | 80-84 | controls `['<input ', '<input ', '<select ']` | `['<input ', '<input ', '<select ', '<select ']` (players select, then stake select). The `['Players at the table', '6 (6-max)']` row already passes through its `<select>` branch. |
| `tests/ui/game-config-stake.acceptance.test.tsx` (TASK-2.3) | 32-35, 46-48, 53, 66 | exactly one `<select>`, `selects(html)[0]` is the stake | pick the stake select by `id="config-stake"`; expect two selects, ids `['config-players', 'config-stake']`; line 46 list gains `['config-players', ['6 (6-max)']]` first |
| `tests/ui/game-config-game-type.acceptance.test.tsx` (TASK-2.4) | 63 | `not.toContain('<select')` | `not.toContain('config-stake')` is already asserted on line 64; replace line 63 with "the only `<select>` is `config-players`" |
| `e2e/stake-choice.spec.ts` (TASK-2.3) | 50, 102 | `getByRole('combobox')` count 1 | count 2 (players + stake) |
| `e2e/game-type-choice.spec.ts` (TASK-2.4) | 56 | `getByRole('combobox')` count 0 in sit-and-go | `stakeSelect(page)` count 0 and `getByRole('combobox')` count 1 (players) |

Locked tests checked and **unchanged**: `e2e/home.spec.ts`, `tests/table/session-config.acceptance.test.ts` (default config
unchanged), `tests/ui/table-display.acceptance.test.tsx` and `e2e/table-display.spec.ts` (6-seat positions unchanged),
header strings `Cash · 6 players …` in `e2e/next-hand.spec.ts`, `e2e/review.spec.ts`, `tests/table/next-hand.acceptance.test.ts`,
`tests/table/stakes.acceptance.test.ts`, `tests/table/game-type.acceptance.test.ts` (default size unchanged),
`tests/engine/heads-up.acceptance.test.ts` (engine unchanged), `tests/advice/table-sizes.acceptance.test.ts` (advice unchanged).
