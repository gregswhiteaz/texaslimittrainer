# Spec: TASK-2.8 — Change the style of one bot seat

Status: READY (approved 2026-11-22)
Task: TASK-2.8 · Parent/epic: TASK-2 (Launch and set up a session) · Requirements: REQ-009 · Dream: limit-holdem-trainer

## 1. Summary
Each bot row in Game Config's Opponents panel gets a style selector offering exactly TAG ("Tight-aggressive"),
Calling station, Maniac and Rock. Changing one row changes only that bot. Start game hands over the edited seats
through the E06-S07 `lineUpSessionConfig`, so the session's line-up name is Custom when any bot differs from the
chosen preset and stays the preset name when every bot matches it. Bots already play their own style's policy
through `decideStyle`. This story proves that an edited seat reaches that policy.

## 2. Scope
- In scope:
  - `src/table/session.ts`: `BOT_STYLES` (option order) and a pure `configWithSeatStyle(config, preset, seat,
    style)` that changes one bot's style and re-resolves the line-up name.
  - `src/ui/config/GameConfigScreen.tsx`: per-row style `<select>`, per-seat edit state, Start game passes the
    edited config.
  - `src/ui/styles.css`: the row selector look (reuses the Session `select` look, 44 px tall).
  - New tests (unit, acceptance, Playwright). Routine amendments to the locked Game Config tests listed in Q-2.
- Not doing:
  - A "Random" style option or a per-seat randomiser (the storyboard shows one; not in REQ-009.2). Randomise
    line-up (REQ-009.5) is TASK-2.9.
  - Showing "Custom" anywhere on Game Config or the table. The preset radio stays on the chosen preset. The
    Custom name is only recorded in the session config.
  - Keeping edits across a preset or players change (A-2). Remembering edits between sessions (TASK-2.10).
  - Changing names, user seat, button, `DEFAULT_SESSION_CONFIG`, `seatLineUp`, `resolveLineUpName`,
    `lineUpSessionConfig` or any bot policy. Engine, bots and advice code are not touched.
  - Changing the table's style text (the table still shows raw style names, e.g. `TAG`; `Table.tsx:74`).
- Scope budget: files=15, lines=650

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | AC#2/AC#3's "seat 3" and "seats 1, 2, 4 and 5" mean the 1st–5th bot ROWS of the Opponents list (clockwise from the user), not table seat numbers. At 6 players with the user at table seat 5: row 1 = seat 6 Ava TAG, row 2 = seat 1 Ben Calling station, row 3 = **seat 2 Cal Maniac**, row 4 = seat 3 Dee Rock, row 5 = seat 4 Eli TAG. So the AC#2 change is Cal (table seat 2) Maniac → Rock, and rows 1, 2, 4, 5 keep TAG, Calling station, Rock, TAG. | yes | Read literally as table seats, the AC contradicts the code: table seat 3 is Dee (Rock, not Maniac) and seat 5 is the user (`seatLineUp`, `src/bots/lineup.ts:74-84`; `USER_SEAT = 5`, `src/table/session.ts:67`). The row reading matches every value in the AC. | Table seats (impossible as written) |
| A-2 | Changing the preset or the players count discards every per-seat edit; the rows are re-derived from the preset (as TASK-2.5 already does). Changing the game type or stake keeps the edits. Cancel discards them. | yes | TASK-2.5 locked "changing size or preset re-derives every row". Bots are named by clockwise position, so a size change moves names between table seats and an edit cannot be carried over unambiguously. | Keep edits by name across size changes |
| A-3 | AC#4 uses Tough at 6 players and row 2 (seat 1, Ben, TAG → Rock → TAG). The unit test also covers the Maniac row (seat 6, Ava, Maniac → Rock → Maniac). | yes | Any seat satisfies the AC; covering both a TAG and the Maniac row is cheap. | One seat only |
| A-4 | AC#5's "Game Config shows that style's label" means the edited row's selector shows the label (`Calling station`, `Maniac`, `Rock`). "Plays that style's own policy" is verified at model level: every decision of that seat in the advice worker's handler (`handleAdviceRequest`) equals the style's own decide function, and at least one differs from `decideTag` with the same view and seed. | yes | No DOM test environment exists (vitest renders with `renderToString` only), and bot decisions are not observable as a style in the browser. The model path is the same code the browser worker runs (`src/table/advice-service.ts:43,62`, `src/ui/table/useTableSession.ts:51,81`). | A browser test that infers style from actions (flaky) |
| A-5 | The Custom / preset line-up name is verified at model level through `configWithSeatStyle` (the same function the screen uses for rows and Start game) and is not shown in the browser. The browser test checks the table's styles after Start game. | yes | The line-up name has no visible output in M1 (it only steers replacement bots, REQ-007.8). | Add a hidden `data-line-up` attribute to the table (adds untested-by-design markup) |

## 3. Current system
- Game Config: `src/ui/config/GameConfigScreen.tsx`. `STYLE_LABELS` (:33-38) maps `TAG` → `Tight-aggressive`.
  `preset` state (:86-88); `seated = configForLineUp(config, players, preset)` (:89); players select validates
  the value against `TABLE_SIZES` (:114-117); bot rows are `<li>` with three spans `Seat n`, name, style label
  (:203-210), then the `You` row (:211-214); Start game passes `configForGameType(seated, gameType, stake)` (:225).
  The players and stake selects carry ids (`config-players`, `config-stake`).
- Session: `src/table/session.ts`. `BotStyle` (:60), `configForLineUp` (:167-174), `botsClockwise` (:177-183),
  `botTurn` reads the seat's style (:339-347).
- Line-up module: `src/bots/lineup.ts`. `LineUpSeat` (:39-47), `seatLineUp` (:60-85), `resolveLineUpName`
  (:103-108, compares only the chosen preset; names ignored), `lineUpSessionConfig(base, preset, seats)`
  (:113-129, throws `RangeError`s; keeps `base.button`, gameType, stake, speed). `MIXED_CYCLE` (:49) is private.
- Bots play their style: `decideStyle` (`src/bots/decide.ts:10-15`) dispatches to `decideRock`, `decideManiac`,
  `decideCallingStation`, `decideTag`. The advice worker's `handleAdviceRequest` uses it by default
  (`src/table/advice-service.ts:43,58-62`) with `botRandom(seed)`. The browser sends `botTurn(table)`'s
  view/style/seed (`src/ui/table/useTableSession.ts:49-51,81-82`). So the doc-24 follow-up ("all play
  tagPolicy") is already fixed in code; this story adds the proof for edited seats.
- CSS: `.config-fields select` (`src/ui/styles.css:138-150`) is the select look; `.config-seats li` is a flex
  row (:219-225).
- Storyboard `dreams/limit-holdem-trainer/storyboards/Config.dc.html`: each row is `Seat n`, name, then
  `<label>Style <select>` with options Tight-aggressive, Calling station, Maniac, Rock, Random.
- Tests: vitest (`npm test`, coverage) with `renderToString` (no DOM environment). Playwright in Chromium and
  WebKit; `e2e/support/axe.ts` (`expectNoSeriousAxeViolations`), `e2e/support/paused-clock.ts`
  (`installPausedClock`, bounded `runUntil` / `runUntilMyTurn`). Model hands: `seatSession`, `dealHand`,
  `nextStep`, `botTurn`, `applyBotDecision`, `userActions`, `applyUserAction`, `nextHand`
  (`src/table/session.ts`), codes from `replayCodeFromWords` (`src/engine/deck.ts:24`).
- Existing code to reuse:
  - `src/bots/lineup.ts` → `lineUpSessionConfig` and `resolveLineUpName` for the Custom/preset name (do not
    re-implement the comparison).
  - `src/table/session.ts` → `configForLineUp`, `botsClockwise`, `configForGameType`.
  - `GameConfigScreen.tsx` → `STYLE_LABELS` for option text; the players select's value validation pattern.
  - `src/table/advice-service.ts` → `handleAdviceRequest` as the decision path in the AC#3/AC#5 model test.
  - `e2e/lineup-choice.spec.ts` → `openGameConfig`, `axeWithPausedClock`, `opponents` locator patterns.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Per-row control is a native `<select>` inside `<label className="config-style">Style …</label>` after the name span, with `aria-label="Style for <name>"`, no `id`. Options in order: value `TAG` "Tight-aggressive", `Calling station`, `Maniac`, `Rock`. No "Random". Wording per Q-1. | Radio group per row (20 radios); a button opening a menu | Matches the storyboard and the Session panel selects. A unique accessible name per row (bot names are unique, REQ-009.4) lets tests and screen readers pick a row. No `id` keeps the locked `<select id=…>` assertions in `tests/ui/game-config-game-type.acceptance.test.tsx:66` valid. | yes | Q-1 (auto-accepted, recommended) |
| D-2 | `configWithSeatStyle` lives in `src/table/session.ts` next to `configForLineUp`, and the screen derives `seated` by folding the edits over `configForLineUp(...)` with it. Rows and Start game use the same `seated`. | Keep edits only in the component and rebuild `LineUpSeat[]` there | Pure, unit-testable without a DOM; one source for both rows and Start game; no import cycle (session.ts already imports runtime values from lineup.ts, `src/table/session.ts:28`). | no | n/a |
| D-3 | Locked-test impact: the new `<select>` in each row changes how earlier Game Config tests read rows and count controls. Each edit only changes how the third row cell is read (selected option text instead of a third `<span>`) or scopes a control count/list to the Session panel's selects. No expected seat, name, style, amount or action changes. | Keep a duplicate visible style `<span>` next to the select so old parsers pass (shows the style twice) | Routine markup edits under the autopilot rule. | yes | Q-2 (auto-accepted, routine) |

## 5. Design

### Files to create / modify
- `src/table/session.ts` — add `BOT_STYLES` and `configWithSeatStyle`.
- `src/ui/config/GameConfigScreen.tsx` — per-seat edit state, per-row style select, Start game uses the edited config.
- `src/ui/styles.css` — `.config-style` label and `.config-seats select` (same look as `.config-fields select`).
- `tests/table/seat-style.test.ts` — new (unit: `configWithSeatStyle` errors and kept fields).
- `tests/table/seat-style.acceptance.test.ts` — new (model: AC#2 rows, AC#3, AC#4, AC#5).
- `tests/ui/game-config-seat-style.acceptance.test.tsx` — new (render: AC#1 options, AC#5 label).
- `e2e/seat-style.spec.ts` — new (browser: AC#1, AC#2, AC#3, AC#4, axe, network).
- Locked-test amendments (Q-2, routine):
  - `tests/ui/home.acceptance.test.tsx` (TASK-2.1)
  - `tests/ui/game-config-players.acceptance.test.tsx` (TASK-2.2)
  - `tests/ui/game-config-stake.acceptance.test.tsx` (TASK-2.3)
  - `tests/ui/game-config-lineup.acceptance.test.tsx` (TASK-2.5)
  - `e2e/game-type-choice.spec.ts` (TASK-2.4)
  - `e2e/stake-choice.spec.ts` (TASK-2.3)
  - `e2e/lineup-choice.spec.ts` (TASK-2.5)

### Components, interfaces and data
- `export const BOT_STYLES: readonly BotStyle[]` = frozen `['TAG', 'Calling station', 'Maniac', 'Rock']`.
- `configWithSeatStyle(config: SessionConfig, preset: LineUpPreset, seat: number, style: BotStyle): SessionConfig`:
  - Throws `RangeError(\`Unknown bot style: ${style}\`)` when `style ∉ BOT_STYLES`.
  - Throws `RangeError(\`Seat ${seat} is not a bot seat\`)` when no seat in `config.seats` has that number and
    `kind === 'bot'`.
  - Maps `config.seats` to `LineUpSeat[]` (user → `{kind:'user', style:null, name:null}`; bot → its name and
    style, with `style` replacing the style at `seat`) and returns `lineUpSessionConfig(config, preset, seats)`.
  - Result: only that seat's style changes; names, seats, user seat, button, game type, stake, speed kept;
    `lineUp` = `preset` if every bot matches `seatLineUp(preset, …)`, else `'Custom'`.
- GameConfigScreen:
  - `const [edits, setEdits] = useState<Readonly<Record<number, BotStyle>>>({})`.
  - Preset `onChange`: `setPreset(value); setEdits({})`. Players `onChange` (valid size): `setPlayers(chosen);
    setEdits({})` (A-2).
  - `seated = Object.entries(edits).reduce((c, [seat, style]) => configWithSeatStyle(c, preset, Number(seat),
    style), configForLineUp(config, players, preset))`.
  - Each bot row (markup of the first two spans unchanged):
    ```
    <li>
      <span className="seat-label">Seat {s.seat}</span>
      <span className="seat-name">{s.name}</span>
      <label className="config-style">
        Style
        <select aria-label={`Style for ${s.name}`} value={s.style} onChange=…>
          {BOT_STYLES.map((v) => <option key={v} value={v}>{STYLE_LABELS[v]}</option>)}
        </select>
      </label>
    </li>
    ```
    `onChange` accepts the value only if it is in `BOT_STYLES`, then `setEdits({ ...edits, [s.seat]: value })`.
  - Start game: `onStart(configForGameType(seated, gameType, stake))` (unchanged expression; `seated` now edited).

### Rules and algorithms
Worked examples (6 players, user at seat 5, rows listed clockwise as on screen):
- Mixed, no edit: `6:Ava TAG, 1:Ben Calling station, 2:Cal Maniac, 3:Dee Rock, 4:Eli TAG`; lineUp `Mixed`.
- Mixed, seat 2 → Rock (AC#2/AC#3): `6:Ava TAG, 1:Ben Calling station, 2:Cal Rock, 3:Dee Rock, 4:Eli TAG`;
  lineUp `Custom`.
- Mixed, seat 2 → Rock → Maniac: back to the Mixed rows; lineUp `Mixed`.
- Tough, seat 1 → Rock → TAG (AC#4): `6:Ava Maniac, 1..4 TAG`; lineUp `Tough`.
- Mixed, seat 6 → Calling station / Maniac / Rock (AC#5): only seat 6 changes; lineUp `Custom`.
- Mixed with seat 2 → Rock, then preset → Soft: Soft rows, no edits; lineUp `Soft` (A-2).

### Error handling and configuration
- The screen only offers `BOT_STYLES` values for existing bot rows, so `configWithSeatStyle` never throws from
  the UI. Bad direct inputs throw the `RangeError`s above (plus any `lineUpSessionConfig` throws).
- Defaults: no edits. Nothing is persisted.

## 6. Behaviour specification

### SPEC-01: Every bot row offers exactly TAG, Calling station, Maniac and Rock with the row's style selected
- Verifies: AC#1, DoD#1
- Behaviour: Given Game Config rendered for each of `configForLineUp(DEFAULT_SESSION_CONFIG, n, p)` with n in
  {2, 6, 10} and p in Mixed/Tough/Soft, When the bot rows are read, Then each bot row contains exactly one
  `<select>` with `aria-label="Style for <row name>"`, its option values are exactly
  `['TAG', 'Calling station', 'Maniac', 'Rock']`, its option texts are exactly
  `['Tight-aggressive', 'Calling station', 'Maniac', 'Rock']`, exactly one option is selected and it equals that
  bot's style in the config. No option reads `Random`. The row's visible label text is `Style`.
- Verification: acceptance `tests/ui/game-config-seat-style.acceptance.test.tsx::every bot row offers exactly TAG, Calling station, Maniac and Rock with its own style selected`

### SPEC-02: Changing the third bot row from Maniac to Rock changes no other row
- Verifies: AC#2, DoD#1
- Behaviour: Given `m = configForLineUp(DEFAULT_SESSION_CONFIG, 6, 'Mixed')`, When
  `configWithSeatStyle(m, 'Mixed', 2, 'Rock')` runs (row 3 = table seat 2, A-1), Then `botsClockwise` of the
  result gives (seat, name, style) `6 Ava TAG, 1 Ben Calling station, 2 Cal Rock, 3 Dee Rock, 4 Eli TAG`, and the
  user seat, button, game type, stake and speed equal `m`'s.
- Verification: acceptance `tests/table/seat-style.acceptance.test.ts::changing the third bot row from Maniac to Rock keeps TAG, Calling station, Rock and TAG on the other rows`

### SPEC-03: An edited row renders its new style and the others keep theirs
- Verifies: AC#2, AC#5, DoD#1
- Behaviour: (Browser-only, because Game Config always rebuilds rows from the preset, TASK-2.5 A-2, and
  `renderToString` cannot interact.) Given Mixed at 6 on Game Config, When the
  user selects `Rock` in "Style for Cal", Then the five rows read (seat, name, selected label)
  `Seat 6 Ava Tight-aggressive`, `Seat 1 Ben Calling station`, `Seat 2 Cal Rock`, `Seat 3 Dee Rock`,
  `Seat 4 Eli Tight-aggressive`, and the `Mixed` radio stays checked. When the user then selects
  `Calling station`, `Maniac` and `Rock` in turn for "Style for Ava", Then Ava's row shows that label each time
  and the other rows are unchanged.
- Verification: acceptance `e2e/seat-style.spec.ts::changing one row's style changes only that row`

### SPEC-04: Start game with one edited seat seats that bot as a Rock and names the line-up Custom
- Verifies: AC#3, DoD#1
- Behaviour: Given the Start game config `configForGameType(configWithSeatStyle(configForLineUp(DEFAULT_SESSION_CONFIG,
  6, 'Mixed'), 'Mixed', 2, 'Rock'), 'cash', $4/$8)`, When it is seated with `seatSession` and hands are dealt from
  `replayCodeFromWords([k, 1, 2, 3])` for k = 1.. (at most 200 hands; the user always takes the first of
  `userActions`), Then `config.lineUp === 'Custom'`; seat 2's table seat has style `Rock`; every `botTurn` for
  seat 2 has style `Rock`; every action `handleAdviceRequest({ kind: 'bot', view, style, seed })` returns for
  seat 2 equals `decideRock(view)`; and at least one of those differs from `decideTag(view, { random:
  botRandom(seed) })`. The loop stops as soon as such a differing decision has been seen.
- Verification: acceptance `tests/table/seat-style.acceptance.test.ts::start game with seat 2 changed to Rock seats a Rock that plays the Rock policy and records the line-up Custom`

### SPEC-05: Changing a seat back to its preset style keeps the preset name
- Verifies: AC#4, DoD#1
- Behaviour: Given `t = configForLineUp(DEFAULT_SESSION_CONFIG, 6, 'Tough')`, When seat 1 is set to `Rock` and
  then back to `TAG` with `configWithSeatStyle`, Then the intermediate config's `lineUp` is `Custom`, the final
  config's `lineUp` is `Tough` and its seats equal `t.seats`. The same holds for seat 6 (`Maniac` → `Rock` →
  `Maniac`). `configForGameType(final, 'cash', stake).lineUp` and `seatSession(...)`'s config `lineUp` are
  `Tough`.
- Verification: acceptance `tests/table/seat-style.acceptance.test.ts::a seat changed to Rock and back to its tough style keeps the line-up name Tough`

### SPEC-06: Calling station, Maniac and Rock seats each play their own policy
- Verifies: AC#5, DoD#1
- Behaviour: For each style S in Calling station, Maniac, Rock: Given Mixed at 6 with seat 6 (Ava, TAG) changed
  to S via `configWithSeatStyle`, When the config is seated and played as in SPEC-04 (at most 200 hands), Then
  `lineUp === 'Custom'`, every seat-6 `botTurn` has style S, every seat-6 decision from `handleAdviceRequest`
  equals `decideStyle(view, S, botRandom(seed))`, and at least one differs from `decideTag(view, { random:
  botRandom(seed) })`.
- Verification: acceptance `tests/table/seat-style.acceptance.test.ts::seats changed to calling station, maniac or rock play their own policy rather than TAG`

### SPEC-07: Game Config renders each style's label on a bot row
- Verifies: AC#5, AC#1, DoD#1
- Behaviour: Given Game Config rendered for Soft at 6 (Calling station / Rock rows) and Tough at 6 (a Maniac
  row), When the rows are read with the third cell taken from the selected option text, Then the Soft rows read
  `Calling station, Rock, Calling station, Rock, Calling station` and the Tough first row reads `Maniac`.
- Verification: acceptance `tests/ui/game-config-seat-style.acceptance.test.tsx::bot rows show the calling station, maniac and rock labels as the selected option`

### SPEC-08: configWithSeatStyle keeps everything else and rejects bad input
- Verifies: AC#2, DoD#1
- Behaviour: Given a sit-and-go Mixed config at 9 players, When `configWithSeatStyle(c, 'Mixed', 7, 'Rock')`
  runs, Then only seat 7's style changes; `gameType`, `speed`, `players`, `userSeat`, `button` and every name are
  unchanged. Seat 5 (the user) throws `RangeError('Seat 5 is not a bot seat')`; seat 11 throws
  `RangeError('Seat 11 is not a bot seat')`; style `'Random'` throws `RangeError('Unknown bot style: Random')`.
  Setting a seat to its current style returns a config whose `lineUp` equals the preset. `BOT_STYLES` equals
  `['TAG', 'Calling station', 'Maniac', 'Rock']`.
- Verification: unit `tests/table/seat-style.test.ts::configWithSeatStyle changes one seat only and rejects user seats, missing seats and unknown styles`

### SPEC-09: In the browser, every row offers four styles and an edited seat reaches the table
- Verifies: AC#1, AC#2, AC#3, DoD#1, DoD#7, DoD#8
- Behaviour: Given the app on first load with the clock paused, When the user opens New game, Then there are
  five comboboxes named `Style for Ava` … `Style for Eli`, each with option texts exactly `Tight-aggressive,
  Calling station, Maniac, Rock`. When the user selects `Rock` in "Style for Cal", Then axe reports no serious or
  critical violations. When the user chooses Start game, Then the header reads
  `Cash · 6 players · $4/$8 · Hand #1` and the table's `data-part="style"` texts by seat are
  `6 TAG, 1 Calling station, 2 Rock, 3 Rock, 4 TAG`. Every request goes to the app's own origin. No hand needs to
  be played; any wait uses the bounded `runUntil` helpers.
- Verification: acceptance `e2e/seat-style.spec.ts::every row offers four styles and start game seats the edited bot as a Rock`

### SPEC-10: In the browser, changing a Tough seat and back leaves the Tough table
- Verifies: AC#4, DoD#1, DoD#7
- Behaviour: Given Game Config, When the user picks `Tough`, selects `Rock` in "Style for Ben" and then
  `Tight-aggressive` in "Style for Ben", Then the rows read Seat 6 Ava Maniac and four Tight-aggressive rows. When
  the user picks `Mixed` after editing a row, Then the Mixed rows return unedited (A-2). When the user chooses
  Start game with Tough and Ben back at Tight-aggressive, Then the table's styles by seat are
  `6 Maniac, 1 TAG, 2 TAG, 3 TAG, 4 TAG`.
- Verification: acceptance `e2e/seat-style.spec.ts::changing a tough seat to rock and back starts the tough table`

### SPEC-11: Earlier stories' tests pass with the Q-2 amendments only
- Verifies: DoD#1, DoD#7
- Behaviour: Given the routine amendments in Q-2, When the full unit and e2e suites run, Then they pass in
  Chromium and WebKit. No locked assertion is removed and no expected seat, name, style, amount, action or grade
  changes. Each edit only reads the third row cell from the selected option, or scopes a select/combobox list or
  count to the Session panel (selects with an `id`, or `section[aria-labelledby="config-session"]`).
- Verification: integration `npm test && npm run e2e`

### SPEC-12: Lint, typecheck, tests, coverage and the headless boundary
- Verifies: DoD#2, DoD#4, DoD#5
- Behaviour: Given the change, When the checks run, Then lint, typecheck and tests pass with zero errors, coverage
  thresholds hold, and `src/bots`, `src/engine`, `src/advice` import nothing new (they are not modified).
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-13: CI green and story documentation published
- Verifies: DoD#10, DoD#11
- Behaviour: Given the branch is pushed, When CI runs, Then every job is green. A story doc describing the
  per-row style control, the Custom/preset naming and the reset-on-preset/size rule is published with
  `backlog doc create`.
- Verification: manual CI run on branch `doit/TASK-2.8` and `backlog doc list --plain`

### SPEC-14: Not-applicable DoD items
- Verifies: DoD#3, DoD#6, DoD#9, DoD#12
- Behaviour: No golden-spot suite and no service worker exist yet; the story adds no strategy content; engine,
  bots and advice code are not changed, so the 10,000-hand playtest is unaffected.
- Verification: manual Judge confirms no `tests/advice/*golden*` suite, no service worker, no strategy content, and `git diff --stat main -- src/engine src/bots src/advice` is empty

## 7. Edge cases
- Heads-up: one bot row with a selector (SPEC-01 at n=2). Editing it works like any row.
- 10 players: nine selectors, each with a unique accessible name because names are unique (SPEC-01).
- Selecting the style a row already has: no change; the name stays the preset (SPEC-08).
- Change then revert: preset name restored (SPEC-05, SPEC-10).
- Preset or players change after edits: edits discarded (A-2, SPEC-10).
- Game type or stake change after edits: edits kept (A-2); Start game uses them (`configForGameType` keeps
  `seats` and `lineUp`, `src/table/session.ts:138-139`).
- A select value outside `BOT_STYLES` (tampered DOM): ignored by `onChange`; `configWithSeatStyle` rejects it
  anyway (SPEC-08).
- Replacement bots in a Custom cash session draw from all four styles (REQ-007.7, already locked by TASK-6.8).
  N/A for new tests.
- Concurrency, permissions, persistence: N/A (client-side state only, nothing stored).

## 8. Security considerations
- The only new input is a select value; it is checked against `BOT_STYLES` before use.
- No new dependencies, no network (SPEC-09 checks the origin), no storage, no randomness added.

## 9. Non-functional
- Accessibility: native selects, 44 px tall, each with a unique accessible name; axe zero serious/critical
  (SPEC-09).
- No speed or scale checks added to the every-push suites. The SPEC-04/06 loops stop at the first differing
  decision and are capped at 200 hands each.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run build && npm run preview`, then open `http://localhost:4173` → New game (or `npm run dev`)
- New tests:
  - `tests/ui/game-config-seat-style.acceptance.test.tsx` → SPEC-01, SPEC-07
  - `tests/table/seat-style.acceptance.test.ts` → SPEC-02, SPEC-04, SPEC-05, SPEC-06
  - `tests/table/seat-style.test.ts` → SPEC-08
  - `e2e/seat-style.spec.ts` → SPEC-03, SPEC-09, SPEC-10
- Builder order: implement, run the suites, then unlock each Q-2 file with
  `doit.py unlock <OWNER> <file> --reason "TASK-2.8 per-row style select: routine row/control read"`. Owners:
  `tests/ui/home.acceptance.test.tsx` TASK-2.1; `tests/ui/game-config-players.acceptance.test.tsx` TASK-2.2;
  `tests/ui/game-config-stake.acceptance.test.tsx` and `e2e/stake-choice.spec.ts` TASK-2.3;
  `e2e/game-type-choice.spec.ts` TASK-2.4; `tests/ui/game-config-lineup.acceptance.test.tsx` and
  `e2e/lineup-choice.spec.ts` TASK-2.5.
- Judge end-to-end scenario: fresh browser → New game. Every bot row shows "Style" with a selector of
  Tight-aggressive, Calling station, Maniac, Rock. Set Cal (Seat 2, third row) to Rock: only that row changes.
  Start game: seat 2 shows Rock. Back on Home → New game → Tough, set Ben to Rock then Tight-aggressive, switch
  to Mixed and back to Tough (edits gone), Start game: seat 6 Maniac, others TAG.

## 11. Open questions
None. Resolved in `doit/TASK-2.8/qa.md` (autopilot, 2026-11-22):
- Q-1 (auto-accepted, recommended): each bot row ends with a visible label "Style" wrapping a native select whose
  accessible name is "Style for <bot name>". Option texts are "Tight-aggressive", "Calling station", "Maniac",
  "Rock" (values TAG, Calling station, Maniac, Rock). There is no "Random" option (D-1).
- Q-2 (auto-accepted, routine): the seven locked-test edits listed in D-3 and section 5 are approved and
  unlocked under their owners (TASK-2.1, 2.2, 2.3, 2.4, 2.5). Each edit only reads the third row cell from the
  selected option, or scopes a select/combobox list or count to the Session panel. No expected result changes.
  Any other locked-test failure is not covered and is escalated.

## 12. Clarifications log
See `doit/TASK-2.8/qa.md`.
