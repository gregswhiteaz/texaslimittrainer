# Spec: TASK-2.5 — Choose a line-up preset for the bots

Status: READY (approved 2026-11-22)
Task: TASK-2.5 · Parent/epic: TASK-2 (Launch and set up a session) · Requirements: REQ-009, REQ-012 · Dream: limit-holdem-trainer

## 1. Summary
Game Config's Opponents panel gets a line-up preset choice (Mixed, Tough, Soft), with Mixed chosen on first use.
The bot rows come from the E06-S06 line-up module (`seatLineUp`) for the chosen preset and table size. They are
listed clockwise from the user and show each bot's name and style. Start game builds the session through
`lineUpSessionConfig` (E06-S07), so the table seats exactly the listed bots and the session's line-up name is the
preset. The default table changes from five TAG bots to the Mixed line-up. Some locked tests that play hands at
the default table must change (section 4, D-3).

## 2. Scope
- In scope:
  - `src/table/session.ts`: a pure `configForLineUp(config, players, preset)` that seats the chosen size with the
    preset's line-up, and `botsClockwise(config)` that orders the bot seats for display.
  - `src/ui/config/GameConfigScreen.tsx`: the preset radio group in the Opponents panel. Rows come from
    `configForLineUp` and are listed clockwise from the user. Start game passes that config.
  - `src/ui/styles.css`: spacing for the preset group inside the Opponents panel (it reuses `.config-choice`).
  - New tests (unit, acceptance and Playwright), and amendments to the locked tests listed in D-3 / Q-2 / Q-3.
- Not doing:
  - Per-seat style changes, the per-seat style control and the "Custom" outcome from editing (REQ-009.2/009.3,
    their own story). In this story every bot's style is the preset's, so the session's line-up name is always
    the chosen preset.
  - Randomise line-up (REQ-009.5, TASK-2.9) and a random user seat or button (TASK-2.13). The user stays at seat
    `min(5, players)` and the button is the seat after the user (TASK-2.2 D-4).
  - Remembering the last configuration (REQ-012.1, TASK-2.10). Nothing is stored. "Fresh install" means Game
    Config opened with `DEFAULT_SESSION_CONFIG`, which is what `App` always does today (`src/ui/App.tsx:26`).
  - Changing `DEFAULT_SESSION_CONFIG`, `DEFAULT_SEATS` or `seatSession()` defaults. They stay all-TAG / `Custom`
    (D-1), so model-level tests and the table harness are unaffected.
  - Engine, bot policy and advice code: no changes. `lineup.ts` is reused as it is.
- Scope budget: files=18, lines=700

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Game Config's starting preset is `config.lineUp` when that is Mixed, Tough or Soft, otherwise Mixed. `DEFAULT_SESSION_CONFIG.lineUp` is `'Custom'`, so a fresh Game Config shows Mixed. | yes | Gives Mixed on first use (REQ-012.2) and lets TASK-2.10 pre-fill a remembered preset with no change here. It also lets render-only unit tests show Tough or Soft by passing a config. | Always start at Mixed |
| A-2 | The rows (and the config Start game passes) are always rebuilt by `configForLineUp(config, players, preset)`. The given `config.seats` are not shown as they are. This replaces TASK-2.2 A-1. | yes | Rows must follow the preset at every size, including 6. | Keep `config` as given while preset and size are unchanged (would show all-TAG bots under "Mixed") |
| A-3 | Bot names come from `seatLineUp`: bot k clockwise from the user is `BOT_NAMES[k-1]` (`src/bots/lineup.ts:82`). At 6 players the bot at seat 6 is now Ava, and seats 1–4 are Ben, Cal, Dee and Eli. | yes | The story says to use the E06-S06 module, which TASK-6.7 locked. Names stay unique (AC#5). | Keep TASK-2.2's ascending-seat naming (would need a second naming rule) |
| A-4 | The "You" row stays last in the Opponents list, after the bot rows, as today (`GameConfigScreen.tsx:184-187`). | yes | Keeps the existing row markup and its locked tests' `You` row assertions. | Put the user first |
| A-5 | A TAG row shows the existing label `Tight-aggressive` (`GameConfigScreen.tsx:32`, Config storyboard). AC#1's "TAG" refers to the style, not the label text. | yes | The storyboard and TASK-2.2 already use this label. | Show "TAG" |

## 3. Current system
- Game Config: `src/ui/config/GameConfigScreen.tsx`. `STYLE_LABELS` is at :31-36. `seated` is at :81 (TASK-2.2
  A-1: `config` as given at its own size, otherwise `configForPlayers`). The game-type radiogroup pattern
  (`role="radiogroup"`, `aria-labelledby`, `.config-choice` labels) is at :84-99. The Opponents panel lists
  `seated.seats` bots in ascending seat order, then the `You` row (:174-189). Start game passes
  `configForGameType(seated, gameType, stake)` (:198).
- Session: `src/table/session.ts`. `USER_SEAT = 5` and `DEFAULT_BUTTON = 6` are at :60-61, and `DEFAULT_SEATS`
  (all TAG, Eli at seat 6) at :62-69. `DEFAULT_SESSION_CONFIG.lineUp = 'Custom'` is at :103. `configForGameType`
  keeps `lineUp` (:131). `configForPlayers` (:142-155) puts the user at `min(5, n)`, sets the button to the seat
  after the user and keeps `lineUp`. session.ts already imports runtime values from `../bots/lineup` (:26), and
  lineup.ts imports only types from session.ts (lineup.ts:1), so adding imports creates no runtime cycle.
- Line-up module: `src/bots/lineup.ts`. `seatLineUp(preset, size, userSeat)` is at :60-85: Mixed cycles TAG,
  Calling station, Maniac, Rock; Tough is a Maniac at k=1 only when size ≥ 3; Soft alternates Calling station and
  Rock. `resolveLineUpName` is at :103. `lineUpSessionConfig(base, preset, seats)` is at :113-129: it throws
  `RangeError('Button must be a seat at the table')` when `base.button ∉ 1..seats.length`, and the user is named
  'You'. `LINE_UP_PRESETS` is at :5.
- Bots really play their style. `pendingBot` reads the seat's style (`session.ts:318`), and the advice worker
  calls `decideBot(view, style, …)` (`src/table/advice-service.ts:40,62`). So changing the default line-up
  changes bot actions at the default table.
- The table shows each seat's style (`src/ui/table/Table.tsx:74`, `data-part="style"`).
- Tests: vitest (`npm test`, coverage). Game Config unit tests render with `renderToString` and parse the HTML
  (`tests/ui/game-config-players.acceptance.test.tsx:15-38`). Playwright runs `e2e/*.spec.ts` in Chromium and
  WebKit (`playwright.config.ts`). The bounded helpers are `runUntil` / `runUntilMyTurn` and
  `installPausedClock` in `e2e/support/paused-clock.ts`. Replay words are pinned with `stubReplayWords`
  (`e2e/support/table-harness-bundle.ts`).
- Playtest CLI supports `--lineup <mixed|tough|soft>` and `--size` (`src/playtest/cli.ts:45`).
- Existing code to reuse:
  - `src/bots/lineup.ts` → `seatLineUp`, `lineUpSessionConfig`, `LINE_UP_PRESETS`, `LineUpPreset` (do not
    re-implement the preset rules or naming).
  - `src/table/session.ts` → `configForPlayers` (user seat and button), `configForGameType`.
  - `GameConfigScreen.tsx` game-type radiogroup and `.config-choice` CSS → the preset control.
  - `e2e/support/paused-clock.ts`, `e2e/support/axe.ts` (`expectNoSeriousAxeViolations`), and the locators in
    `e2e/players-choice.spec.ts` (`opponents`, `playersSelect`) as the pattern for the new spec.

### Prototype measurement (scratch worktree, 2026-11-22)
The measurement used a minimal change: Game Config builds Mixed seats via `seatLineUp` + `lineUpSessionConfig`.
Results:
- vitest `tests/ui tests/table`: 2 of 137 fail, both in Game Config rows: `tests/ui/home.acceptance.test.tsx`
  ("five TAG bots") and `tests/ui/game-config-players.acceptance.test.tsx` (2/6/9/10 rows). Only displayed
  names and styles changed. All model and table tests pass, because `DEFAULT_SESSION_CONFIG` is untouched.
- Playwright Chromium (every-push set): 8 failed, 65 passed. The failures by kind:
  - Names/labels only (same seat, same amount): `e2e/home.spec.ts:213` and `e2e/table.spec.ts:159` (seat-name
    list), `e2e/players-choice.spec.ts:94` (Opponents rows), and `e2e/next-hand.spec.ts:259` ("Ava wins $8" →
    "Ben wins $8", still seat 1 winning $8).
  - Results change, because the bots now act differently:
    - `e2e/action-bar.spec.ts:130`: on the flop the user faces a bet (Fold / Call / Raise) instead of
      Check / Bet $4.
    - `e2e/action-bar.spec.ts:207`: 3 buttons instead of 2.
    - `e2e/next-hand.spec.ts:221`: "Ben wins $10 · Two pair…" → "Cal wins $50 · Two pair…". Same seat 2 and same
      hand, but a bigger pot.
    - `e2e/review.spec.ts:332`: same winner change. The pinned review entries/grades, badge colours and hand-2
      stacks after it will also differ.
- The slow e2e group (`npm run e2e:slow`) was stopped before it finished, because the 200-hand test runs for up
  to an hour, so its failures so far are unknown. By reading the code: `e2e/responsive-table.spec.ts` seats
  `DEFAULT_SESSION_CONFIG` through the advice harness, so D-1 leaves it unaffected. `e2e/rapid-pace.spec.ts`
  starts via Game Config but asserts timing and minimum gap counts only, so a failure there is not expected. The
  builder runs `npm run e2e:slow` first and classifies any failure by the D-3 rule.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Only Game Config applies the preset. `DEFAULT_SESSION_CONFIG` / `DEFAULT_SEATS` / `seatSession()` stay all-TAG with `lineUp: 'Custom'`. | Make `DEFAULT_SESSION_CONFIG` the Mixed line-up | Game Config is the only way a user starts a session, so AC#1 holds. Changing the default would also change every model test, harness e2e and playtest that seats the default config. The prototype shows none of those break with D-1. | yes | user (Q-3, approved with the design as reported) |
| D-2 | The preset control is a radio group in the Opponents panel, above the rows. Wording is in Q-1. | `<select>`; a `<dt>` row in the Session field list | Same pattern as Game type. Placing it outside the `<dl>` keeps the locked `dts(...)` field-list assertions unchanged. Placing it outside `<ul class="config-seats">` keeps the `seatRows` `<li>` parsers unchanged. Visible group label "Line-up", options "Mixed", "Tough", "Soft". | yes | Q-1 (auto-accepted, recommended) |
| D-3 | Locked-test impact. (a) Name/label/row-order edits that the story causes are routine (auto-approved, listed in Q-2). (b) Edits that change expected chips, winners, bot actions or grades need the user (Q-3). | Avoid result changes by keeping an all-TAG default (violates AC#1); move result tests to the table harness (big rewrite) | This is the autopilot rule for routine locked-test edits. | yes | Q-2 auto-approved (routine); user (Q-3) |
| D-4 | `configForLineUp` lives in `src/table/session.ts`, next to `configForPlayers`. | Put it in `lineup.ts` (it would need runtime imports from session.ts, creating a cycle) | No import cycle; it can be unit-tested without the UI. | no | n/a |

## 5. Design

### Files to create / modify
- `src/table/session.ts` — add `configForLineUp` and `botsClockwise`.
- `src/ui/config/GameConfigScreen.tsx` — preset state and radio group; rows from `configForLineUp`, ordered by
  `botsClockwise`; Start game uses the same config.
- `src/ui/styles.css` — spacing for `.config-lineup` (the preset group in the Opponents panel).
- `tests/ui/game-config-lineup.acceptance.test.tsx` — new (render-level AC#1, AC#2, AC#4, AC#5).
- `tests/table/lineup-config.acceptance.test.ts` — new (model-level AC#3, AC#5, AC#6, AC#7).
- `tests/table/lineup-config.test.ts` — new (unit: errors, kept fields, clockwise order).
- `e2e/lineup-choice.spec.ts` — new (browser flows AC#1, AC#2, AC#3, AC#4, AC#6, axe, network).
- Locked-test amendments (D-3):
  - routine: `tests/ui/home.acceptance.test.tsx`, `tests/ui/game-config-players.acceptance.test.tsx`,
    `e2e/players-choice.spec.ts`, `e2e/home.spec.ts`, `e2e/table.spec.ts`
  - mixed (name edit at :259, result edit at :221): `e2e/next-hand.spec.ts`
  - result edits (Q-3): `e2e/action-bar.spec.ts`, `e2e/review.spec.ts`
  - possibly `e2e/rapid-pace.spec.ts` / `e2e/responsive-table.spec.ts`, depending on the slow-group run

### Components, interfaces and data
- `configForLineUp(config: SessionConfig, players: number, preset: LineUpPreset): SessionConfig` in session.ts:
  - `sized = configForPlayers(config, players)`. This throws the same `RangeError` for a bad size.
  - Returns `lineUpSessionConfig(sized, preset, seatLineUp(preset, players, sized.userSeat))`.
  - Result: `players`, `userSeat = min(5, players)`, `button = (userSeat % players) + 1` (always a seat, AC#7),
    `seats` from the line-up (user named 'You'), and `lineUp = preset`. `gameType`, `stake` (cash) and `speed`
    are kept from `config`. An unknown preset throws `RangeError('Unknown line-up preset: …')`, as
    `seatLineUp` does.
- `botsClockwise(config: SessionConfig): readonly SessionSeat[]` in session.ts: the bot seats ordered by
  `(seat - userSeat + players) % players` ascending, i.e. first bot clockwise from the user first. Pure.
- GameConfigScreen:
  - `const [preset, setPreset] = useState<LineUpPreset>(isPreset(config.lineUp) ? config.lineUp : 'Mixed')` (A-1).
  - `const seated = configForLineUp(config, players, preset)`.
  - Opponents panel, in order:
    1. `<h2 id="config-opponents">Opponents</h2>`.
    2. The preset group: `<div role="radiogroup" aria-labelledby="config-lineup" className="config-choice config-lineup">`
       with the visible group label `<span id="config-lineup">Line-up</span>` (Q-1). It contains one
       `<label><input type="radio" name="line-up" value={p} checked={preset === p} onChange=…/>{p}</label>` per
       `LINE_UP_PRESETS` entry.
    3. `<ul className="config-seats">` with one `<li>` per `botsClockwise(seated)` entry (markup unchanged:
       `Seat n`, name, style label), then the `You` row.
  - Start game: `onStart(configForGameType(seated, gameType, stake))`.

### Rules and algorithms
Worked examples at the default user seat `min(5, n)` (`seat:name style`, listed clockwise as on screen):
- Mixed, 6: `6:Ava TAG, 1:Ben Calling station, 2:Cal Maniac, 3:Dee Rock, 4:Eli TAG`; You seat 5; button 6 (AC#1).
- Tough, 9: `6:Ava Maniac, 7:Ben TAG, 8:Cal TAG, 9:Dee TAG, 1:Eli TAG, 2:Fay TAG, 3:Gus TAG, 4:Hal TAG` (8 rows);
  You seat 5; button 6 (AC#2).
- Soft, 4: user seat 4, `1:Ava Calling station, 2:Ben Rock, 3:Cal Calling station`; button 1 (AC#3).
- Tough, 2: user seat 2, `1:Ava TAG`; button 1 (AC#4).
- Any preset, 10: names Ava…Ivy at seats 6..10, 1..4, all distinct (AC#5).
- Soft, 6: `6:Ava Calling station, 1:Ben Rock, 2:Cal Calling station, 3:Dee Rock, 4:Eli Calling station`; the session's
  `lineUp = 'Soft'` (AC#6).
- Changing size or preset re-derives every row. No previous row is kept.

### Error handling and configuration
- The UI can only pass `TABLE_SIZES` values and `LINE_UP_PRESETS` values, so `configForLineUp` never throws from
  the screen (AC#7). Bad direct inputs throw the `RangeError`s above.
- Defaults: preset Mixed (A-1). Nothing is persisted.

## 6. Behaviour specification

### SPEC-01: A fresh Game Config selects Mixed and lists the Mixed styles clockwise from the user
- Verifies: AC#1, DoD#1
- Behaviour: Given `DEFAULT_SESSION_CONFIG`, When Game Config renders, Then exactly one preset radio is checked
  and it is `Mixed`. The preset options are `Mixed`, `Tough`, `Soft` in that order. The Opponents rows are
  `[Seat 6, Ava, Tight-aggressive]`, `[Seat 1, Ben, Calling station]`, `[Seat 2, Cal, Maniac]`,
  `[Seat 3, Dee, Rock]`, `[Seat 4, Eli, Tight-aggressive]`, then `[You, Seat 5]`.
- Verification: acceptance `tests/ui/game-config-lineup.acceptance.test.tsx::a fresh game config selects Mixed and lists TAG, Calling station, Maniac, Rock, TAG clockwise from the user`

### SPEC-02: Tough at 9 players has 8 rows with only the first bot clockwise a Maniac
- Verifies: AC#2, DoD#1
- Behaviour: Given a config from `configForLineUp(DEFAULT_SESSION_CONFIG, 9, 'Tough')`, When Game Config renders,
  Then `Tough` is checked, there are 8 bot rows, the first row is `Seat 6` and the only `Maniac`, and the other 7
  rows show `Tight-aggressive`.
- Verification: acceptance `tests/ui/game-config-lineup.acceptance.test.tsx::tough at 9 players lists 8 rows with only the first bot clockwise a Maniac`

### SPEC-03: Switching from 6 to 4 players with Soft gives Calling station, Rock, Calling station
- Verifies: AC#3, DoD#1
- Behaviour: Given a Soft 6-player config, When it is reseated with `configForLineUp(cfg, 4, 'Soft')`, Then
  `botsClockwise` gives 3 bots with styles `Calling station, Rock, Calling station` at seats 1, 2, 3.
- Verification: acceptance `tests/table/lineup-config.acceptance.test.ts::switching from 6 to 4 players with Soft gives Calling station, Rock, Calling station`

### SPEC-04: Heads-up Tough seats one TAG
- Verifies: AC#4, DoD#1
- Behaviour: Given a config from `configForLineUp(DEFAULT_SESSION_CONFIG, 2, 'Tough')`, When Game Config renders,
  Then there is exactly one bot row, `[Seat 1, Ava, Tight-aggressive]`.
- Verification: acceptance `tests/ui/game-config-lineup.acceptance.test.tsx::heads-up tough lists a single TAG bot`

### SPEC-05: No two rows share a name at 10 players for any preset
- Verifies: AC#5, DoD#1
- Behaviour: Given each preset in `LINE_UP_PRESETS` at 10 players, When Game Config renders the rows (and
  `configForLineUp` seats the table), Then there are 9 rows and 9 distinct names.
- Verification: acceptance `tests/ui/game-config-lineup.acceptance.test.tsx::every preset at 10 players lists 9 rows with distinct names`

### SPEC-06: Start game with Soft at 6 seats exactly the listed bots and names the line-up Soft
- Verifies: AC#6, DoD#1
- Behaviour: Given Soft at 6 players, When Start game's config `configForGameType(configForLineUp(DEFAULT_SESSION_CONFIG, 6, 'Soft'), 'cash', stake)`
  is seated with `seatSession`, Then the table's bot seats (seat, name, style) equal the rows Game Config lists
  (the SPEC-01-style worked example for Soft), and `config.lineUp === 'Soft'`. The same holds for a sit-and-go.
- Verification: acceptance `tests/table/lineup-config.acceptance.test.ts::start game with Soft at 6 seats the listed bots and records the line-up Soft`

### SPEC-07: Start game's button is a seat at every size and preset
- Verifies: AC#7, DoD#1
- Behaviour: Given `DEFAULT_SESSION_CONFIG` (button 6) and also a config with button 10, When
  `configForLineUp(config, n, p)` runs for every n in 2..10 and every preset, Then it does not throw, `button` is
  an integer in `1..n` and equals `(min(5, n) % n) + 1`, and `players === seats.length === n`.
- Verification: acceptance `tests/table/lineup-config.acceptance.test.ts::start game's button is a seat at every table size and preset`

### SPEC-08: configForLineUp keeps the other settings and rejects bad input
- Verifies: AC#7, DoD#1
- Behaviour: Given a sit-and-go config and a cash config at $10/$20, When `configForLineUp` runs, Then
  `gameType`, `stake` (cash) and `speed` are kept. Players 1, 11 and 2.5 throw
  `RangeError('Table size must be a whole number from 2 to 10')`. Preset `'Custom'` throws a `RangeError` whose
  message starts with `Unknown line-up preset`. `botsClockwise` on `DEFAULT_SESSION_CONFIG` gives seats
  `[6, 1, 2, 3, 4]`.
- Verification: unit `tests/table/lineup-config.test.ts::configForLineUp keeps game type, stake and speed and rejects bad sizes and presets`

### SPEC-09: In the browser, first use shows Mixed, and Start game seats the listed bots
- Verifies: AC#1, AC#6, DoD#1, DoD#7, DoD#8
- Behaviour: Given the app on first load with the clock paused, When the user opens New game, Then the `Mixed`
  radio is checked and the rows read Seat 6 Ava Tight-aggressive … Seat 4 Eli Tight-aggressive. axe reports no
  serious/critical violations. When the user picks `Soft` and chooses Start game, Then each table seat's name and
  `data-part="style"` text equal the Soft rows read from Game Config, and the header reads
  `Cash · 6 players · $4/$8 · Hand #1`. Every request goes to the app's own origin.
- Verification: acceptance `e2e/lineup-choice.spec.ts::first use selects Mixed and Start game with Soft seats exactly the listed bots`

### SPEC-10: In the browser, rows follow the preset and the players count
- Verifies: AC#2, AC#3, AC#4, DoD#1, DoD#7
- Behaviour: Given Game Config, When the user picks Soft and switches 6 → 4 players, Then 3 rows read Calling
  station, Rock, Calling station. When the user picks Tough at 9 players, Then 8 rows show, and only the first
  (Seat 6) is a Maniac. When the user picks 2 players with Tough, Then one row shows `Seat 1 Ava Tight-aggressive`.
  Run axe once with Tough selected. No hand is played. Any wait uses the bounded `runUntil` helpers.
- Verification: acceptance `e2e/lineup-choice.spec.ts::the rows follow the preset and the players count`

### SPEC-11: Earlier stories' tests pass with the D-3 amendments only
- Verifies: DoD#1, DoD#7
- Behaviour: Given the amendments listed in Q-2 (routine) and Q-3 (as answered), When the full unit and e2e suites
  run, Then they pass in Chromium and WebKit, including `npm run e2e:slow`. No locked assertion is removed. Each
  routine edit only replaces names, style labels or row order. Each result edit keeps the assertion and changes
  only its expected value or the test's pinned replay words, as Q-3 decides.
- Verification: integration `npm test && npm run e2e && npm run e2e:slow`

### SPEC-12: Lint, typecheck, tests, coverage and the headless boundary
- Verifies: DoD#2, DoD#4, DoD#5
- Behaviour: Given the change, When the checks run, Then lint, typecheck and tests pass with zero errors, the
  coverage thresholds hold, and `src/bots`, `src/engine`, `src/advice` import nothing new from `src/ui`.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-13: The playtest stays clean for each preset
- Verifies: DoD#6
- Behaviour: Given each preset at 6 players, When 10,000 hands are played, Then zero invariant violations are
  reported.
- Verification: command `npm run playtest -- --hands 10000 --seed 42 --lineup mixed && npm run playtest -- --hands 10000 --seed 42 --lineup tough && npm run playtest -- --hands 10000 --seed 42 --lineup soft`

### SPEC-14: CI green and story documentation published
- Verifies: DoD#10, DoD#11
- Behaviour: Given the branch is pushed, When CI runs, Then every job is green. A story doc describing the preset
  control, the clockwise rows and the default-line-up change is published with `backlog doc create`.
- Verification: manual CI run on branch `doit/TASK-2.5` and `backlog doc list --plain`

### SPEC-15: Not-applicable DoD items
- Verifies: DoD#3, DoD#9, DoD#12
- Behaviour: No golden-spot suite and no service worker exist yet, and this story adds no strategy content.
- Verification: manual Judge confirms no `tests/advice/*golden*` suite and no service worker exist, and the diff adds no strategy content

## 7. Edge cases
- Heads-up: Tough gives one TAG (SPEC-04, SPEC-10). Mixed gives one TAG. Soft gives one Calling station. The
  button is seat 1 (SPEC-07).
- 10 players: 9 names, all distinct (SPEC-05).
- Changing size after choosing a preset keeps the preset and re-derives the rows (SPEC-03, SPEC-10). Changing
  the preset keeps the size.
- A starting config whose button is not a seat at the new size (default button 6, heads-up): `configForPlayers`
  replaces the button before `lineUpSessionConfig` checks it (SPEC-07).
- A config passed in with `lineUp: 'Custom'` (the default) starts at Mixed (A-1, SPEC-01).
- Bad sizes and presets are unreachable from the UI and are rejected at the function (SPEC-08).
- Replacement bots in a cash session now draw from the preset's styles (REQ-007.8 via `config.lineUp`). That
  rule is already locked by TASK-6.8 tests. N/A for new tests.
- Concurrency, permissions, persistence: N/A (pure client-side state, nothing stored).

## 8. Security considerations
- No untrusted input. Radio values come from `LINE_UP_PRESETS`, and sizes from `TABLE_SIZES`.
- No new dependencies, no network (SPEC-09 checks the origin), no storage.
- Randomness: none added. Bot decisions still use the existing seeded generators.

## 9. Non-functional
- Accessibility: the preset group is a labelled `radiogroup` with native radios and 44 px tall labels (existing
  `.config-choice` rule). axe has zero serious/critical violations (SPEC-09, SPEC-10).
- No speed or scale checks are added to the every-push suites.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run build && npm run preview`, then open `http://localhost:4173` → New game (or `npm run dev`)
- New tests:
  - `tests/ui/game-config-lineup.acceptance.test.tsx` → SPEC-01, 02, 04, 05
  - `tests/table/lineup-config.acceptance.test.ts` → SPEC-03, 06, 07
  - `tests/table/lineup-config.test.ts` → SPEC-08
  - `e2e/lineup-choice.spec.ts` → SPEC-09, 10
- Builder order: run `npm run e2e:slow` on the change first, to finish the D-3 classification. Unlock each
  amended locked file with `doit.py unlock <OWNER> <file> --reason …`. The owners are: home/game-config-players
  unit tests TASK-2.1/TASK-2.2; `e2e/home.spec.ts` TASK-2.1; `e2e/table.spec.ts` TASK-3.1;
  `e2e/players-choice.spec.ts` TASK-2.2; `e2e/next-hand.spec.ts` TASK-3.4; `e2e/action-bar.spec.ts` TASK-3.2;
  `e2e/review.spec.ts` TASK-9.1; `e2e/rapid-pace.spec.ts` TASK-3.13/3.27; `e2e/responsive-table.spec.ts`
  TASK-3.6.
- Judge end-to-end scenario: fresh browser → New game. Check that Mixed is selected and the rows read Ava TAG
  (seat 6), Ben Calling station, Cal Maniac, Dee Rock, Eli TAG. Pick Tough, then 9 players: 8 rows, only seat 6
  is a Maniac. Pick 2 players: one TAG. Pick 4 players and Soft: Calling station, Rock, Calling station. Pick 6
  players and Soft → Start game: the table's names and styles match the rows.

## 11. Open questions
None. Resolved in `doit/TASK-2.5/qa.md`:
- Q-1 (auto-accepted, recommended): the preset control is a radio group in the Opponents panel, above the bot
  rows. Its visible label is "Line-up" and its options are "Mixed", "Tough", "Soft", in the Game type style.
  Mixed is selected on first use (D-2).
- Q-2 (auto-approved, routine locked-test edit). Only names, style labels or row order change, in:
  - `tests/ui/home.acceptance.test.tsx` (TASK-2.1)
  - `tests/ui/game-config-players.acceptance.test.tsx` (TASK-2.2)
  - `e2e/players-choice.spec.ts` (TASK-2.2)
  - `e2e/home.spec.ts` (TASK-2.1)
  - `e2e/table.spec.ts` (TASK-3.1)
  - `e2e/next-hand.spec.ts:250,265` (TASK-3.4: "Ava wins $8" → "Ben wins $8")

  An edit that turns out to change a seat, an amount or an action falls under Q-3's rule instead. If it is not
  in a file Q-3 names, it needs the user.
- Q-3 (user, approved as recommended):
  - `e2e/action-bar.spec.ts:130` and `:207` (TASK-3.2): re-pin the replay words to a code that recreates the
    Check / Bet $4 flop bar and the 2-button count with Mixed bots. Every assertion stays the same.
  - `e2e/next-hand.spec.ts:221` (TASK-3.4) and `e2e/review.spec.ts:332` onward (TASK-9.1): keep the pinned code.
    Update only the expected values (winner text, review entries and grades, badge colours, stacks) to the Mixed
    table's deterministic output. The number of assertions stays the same.
- Unlocks are recorded under TASK-2.1, 2.2, 3.1, 3.2, 3.4 and 9.1. If `npm run e2e:slow` fails on
  `e2e/rapid-pace.spec.ts` or `e2e/responsive-table.spec.ts`, that is not covered by these answers. It is
  escalated by the D-3 rule.

## 12. Clarifications log
See `doit/TASK-2.5/qa.md`.
