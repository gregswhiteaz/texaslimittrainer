# Spec: TASK-2.9 — Randomise the bot line-up

Status: READY (approved 2026-11-22)
Task: TASK-2.9 · Parent/epic: TASK-2 (Launch and set up a session) · Requirements: REQ-009 (009.5, 009.6) · Dream: limit-holdem-trainer

## 1. Summary
Game Config's Opponents panel gets a "Randomise line-up" button. One press gives every bot seat a style drawn
independently and uniformly from TAG, Calling station, Maniac and Rock. The drawn styles go into the TASK-2.8
per-seat edits, so the rows show them, Start game seats them, and the E06-S07 rule names the session's
line-up Custom (or the preset's name if the draw happens to equal the preset). The draw is a pure function
that takes any 32-bit word source. The browser passes `crypto.getRandomValues` and tests pass the seeded
`Xoshiro128`.

## 2. Scope
- In scope:
  - `src/table/session.ts`: pure `randomBotStyles(config, nextWord)` (one style per bot seat) and
    `configWithSeatStyles(config, preset, styles)` (applies a seat→style map with `configWithSeatStyle`).
  - `src/ui/config/GameConfigScreen.tsx`: the "Randomise line-up" button. Its draw replaces all edits. The
    `seated` fold uses `configWithSeatStyles`.
  - `src/ui/styles.css`: the Opponents header row (heading left, button right, wraps on narrow screens).
  - New tests (unit, model acceptance, render acceptance, Playwright). Routine amendments to the four locked
    button-list assertions listed in Q-3.
- Not doing:
  - A per-seat "Random" style option (the storyboard shows one; REQ-009.2 does not list it).
  - Randomising names, the user seat, the button or the players count. REQ-010 random seat/button is a
    different story.
  - Showing "Custom" on Game Config or the table. The preset radio stays on the chosen preset, as in TASK-2.8
    (A-5 there). The name is only recorded in the session config.
  - Remembering the randomised line-up between sessions (TASK-2.10). An undo for a randomise.
  - Changing `configWithSeatStyle`, `lineUpSessionConfig`, `resolveLineUpName`, `seatLineUp`, any bot policy,
    or engine/bots/advice code.
- Scope budget: files=11, lines=500

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | A randomise sets an edit for every bot seat and replaces all earlier edits. Later per-row edits apply on top. A preset or players change still discards everything (TASK-2.8 A-2). Pressing again draws a fresh line-up. | yes | Matches the existing edits model (`GameConfigScreen.tsx:94-99`, `:128`, `:212`). The draw covers every seat, so earlier edits have nothing left to change. | Keep earlier manual edits (contradicts "every bot seat", REQ-009.5) |
| A-2 | AC#1's "shows one of TAG, …" means the row's selected option label. TAG's label is `Tight-aggressive` (`STYLE_LABELS`, `GameConfigScreen.tsx:35-40`). The browser test accepts `Tight-aggressive`, `Calling station`, `Maniac`, `Rock`. | yes | The TASK-2.8 Q-1 wording shows TAG as Tight-aggressive on Game Config. | Rename the option to "TAG" (would undo TASK-2.8 Q-1) |
| A-3 | AC#2's "1,000 seeded randomisations" use one `Xoshiro128(20261122)` stream across all 1,000 draws at Mixed 6 players. The test also bounds each count to 180–320 (expected 250, about 5 standard deviations either side) as a uniformity check. The seed is fixed, so the bound is deterministic. | yes | One stream is how the function is used. The bound catches a mapping that silently drops or doubles a style. | A new seed per draw; only the ≥1 check |
| A-4 | AC#3's line-up name Custom is verified at model level through `configWithSeatStyles` (the same function the screen folds edits with) plus `configForGameType` and `seatSession`. The browser test checks the rows and the table's styles. | yes | The line-up name has no visible output in M1 (TASK-2.8 A-5). | Add hidden markup carrying the name |

## 3. Current system
- Game Config: `src/ui/config/GameConfigScreen.tsx`. `STYLE_LABELS` (:35-40); `isBotStyle` (:71-72); `preset`
  state (:91-93); `edits` state and the `seated` fold over `configWithSeatStyle` (:94-99); players change
  clears edits (:126-129); Opponents section `<h2 id="config-opponents">Opponents</h2>` (:195-196), Line-up
  radiogroup (:197-218), bot rows with `Style for <name>` selects (:219-242); Start game passes
  `configForGameType(seated, gameType, stake)` (:257). Buttons in DOM order today: `← Home` (:176),
  `Cancel` (:251), `Start game` (:254).
- Session: `src/table/session.ts`. `BOT_STYLES` (:178-183); `configWithSeatStyle` (:188-203, RangeErrors);
  `botsClockwise` (:207-213); `configForLineUp` (:168-175); `drawReplacementStyle` uses
  `nextIntUnbiased` (:300-309).
- Randomness: `newReplayCode` draws `crypto.getRandomValues(new Uint32Array(4))` (`src/engine/deck.ts:14-21`).
  Several e2e specs stub `getRandomValues`. `e2e/next-hand.spec.ts:26-33` counts only 4-word `Uint32Array`
  requests as replay draws. `Xoshiro128.nextUint32` (`src/engine/seeded-random.ts:68-80`).
- Storyboard `dreams/limit-holdem-trainer/storyboards/Config.dc.html:59-63`: the Opponents heading and a
  "Randomise line-up" outline button share a row (space-between, wraps), 44 px tall.
- CSS: `.screen button { min-height: 44px }` (`src/ui/styles.css:38-39`); `.button-outline` (:258-265).
- Tests: vitest (`npm test`, coverage) with `renderToString` (no DOM). Playwright in Chromium and WebKit;
  `e2e/support/axe.ts` `expectNoSeriousAxeViolations`; the `openGameConfig` / `axeWithPausedClock` /
  `rowTexts` / `tableStyles` / `bySeatFrom` patterns in `e2e/seat-style.spec.ts:8-95`.
- Locked assertions that list every button on Game Config as `['← Home', 'Cancel', 'Start game']`:
  `tests/ui/home.acceptance.test.tsx:80-81` (TASK-2.1), `tests/ui/game-config-game-type.acceptance.test.tsx:71-72`
  (TASK-2.4), `tests/ui/game-config-stake.acceptance.test.tsx:68-69` and `e2e/stake-choice.spec.ts:100-104`
  (TASK-2.3).
- Existing code to reuse:
  - `src/table/session.ts` → `BOT_STYLES`, `botsClockwise`, `configWithSeatStyle`, `configForLineUp`,
    `configForGameType`, `seatSession`.
  - `src/engine/seeded-random.ts` → `Xoshiro128` as the seeded source in tests.
  - `e2e/seat-style.spec.ts` → copy its `openGameConfig`, `axeWithPausedClock`, `rowTexts`, `tableStyles`,
    `bySeatFrom` helpers into the new spec. The locked file is not edited.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Distribution: each bot seat independently gets `BOT_STYLES[word % 4]`, one fresh 32-bit word per seat, in `botsClockwise` order. 2^32 is a multiple of 4, so this is exactly uniform (1/4 each) with no rejection. Browser word source: `globalThis.crypto.getRandomValues(new Uint32Array(1))[0]`, one 1-word call per bot seat, only when the button is pressed. | Weighted towards the preset; no two seats alike; `Math.random`; one `Uint32Array(n)` call | REQ-009.5 says "chosen at random" per seat. Uniform and independent is the simplest fair reading. 1-word arrays never match the 4-word replay-draw counter (`e2e/next-hand.spec.ts:29-31`), and nothing draws unless the button is pressed, so no existing count changes. Seeded tests inject `Xoshiro128`. | yes | Q-1 (auto-accepted, recommended) |
| D-2 | Control: `<button type="button" className="button-outline">Randomise line-up</button>` in a new `<div className="config-opponents-header">` that wraps the existing `<h2 id="config-opponents">Opponents</h2>` and the button. Button DOM order is `← Home`, `Randomise line-up`, `Cancel`, `Start game`. No confirmation, and no text announces the change (the rows' selects update in place). | Button below the rows; a "Random" preset radio | Matches the storyboard's wording and placement. A preset radio would claim a fourth preset, but REQ-009.1 has three. | yes | Q-2 (auto-accepted, recommended) |
| D-3 | `randomBotStyles` and `configWithSeatStyles` live in `src/table/session.ts`. The screen derives `seated = configWithSeatStyles(configForLineUp(config, players, preset), preset, edits)`. | Keep the reduce inline in the component | The model tests run the same fold the screen uses (A-4). Pure and DOM-free. | no | n/a |
| D-4 | Locked-test impact: the four button-list assertions gain `'Randomise line-up'` after `'← Home'`. No other expected value changes. | Put the button outside `<main>`/role tree (impossible); render it only after interaction | It is a new control, so lists of every control must name it. | yes | Q-3 (auto-accepted, routine) |

## 5. Design

### Files to create / modify
- `src/table/session.ts` — add `randomBotStyles`, `configWithSeatStyles`.
- `src/ui/config/GameConfigScreen.tsx` — Opponents header with the button; `seated` via `configWithSeatStyles`; crypto word source.
- `src/ui/styles.css` — `.config-opponents-header` (flex, space-between, wrap, gap 8px, align center; the h2 keeps its look).
- `tests/table/randomise-lineup.test.ts` — new (unit: mapping, order, errors).
- `tests/table/randomise-lineup.acceptance.test.ts` — new (model: AC#2 tabulation, AC#3 Custom/preset name and seated styles).
- `tests/ui/game-config-randomise.acceptance.test.tsx` — new (render: the button exists in the Opponents header).
- `e2e/randomise-lineup.spec.ts` — new (browser: AC#1 at 9 players, AC#3 stubbed draw to table, axe, network).
- Locked-test amendments (Q-3, routine):
  - `tests/ui/home.acceptance.test.tsx` (TASK-2.1)
  - `tests/ui/game-config-game-type.acceptance.test.tsx` (TASK-2.4)
  - `tests/ui/game-config-stake.acceptance.test.tsx` (TASK-2.3)
  - `e2e/stake-choice.spec.ts` (TASK-2.3)

### Components, interfaces and data
- `randomBotStyles(config: SessionConfig, nextWord: () => number): Readonly<Record<number, BotStyle>>`
  - For each bot in `botsClockwise(config)` order, calls `nextWord()` exactly once. The word must be an
    integer in 0..4294967295, otherwise `RangeError(\`Random word out of range: ${String(w)}\`)`. The seat gets
    `BOT_STYLES[w % 4]`.
  - Returns a frozen object with one key per bot seat number and no entry for the user. Pure apart from calling
    `nextWord`.
- `configWithSeatStyles(config: SessionConfig, preset: LineUpPreset, styles: Readonly<Record<number, BotStyle>>): SessionConfig`
  - Folds `Object.entries(styles)` with `configWithSeatStyle(c, preset, Number(seat), style)`, starting from
    `config`. An empty map returns `config` unchanged. It throws whatever `configWithSeatStyle` throws.
- GameConfigScreen:
  - `seated = configWithSeatStyles(configForLineUp(config, players, preset), preset, edits)`.
  - Module-level `const cryptoWord = (): number => globalThis.crypto.getRandomValues(new Uint32Array(1))[0] as number;`
  - Button `onClick={() => setEdits(randomBotStyles(seated, cryptoWord))}`.
  - Opponents markup:
    ```
    <section className="panel" aria-labelledby="config-opponents">
      <div className="config-opponents-header">
        <h2 id="config-opponents">Opponents</h2>
        <button type="button" className="button-outline">Randomise line-up</button>
      </div>
      …radiogroup, rows unchanged…
    ```

### Rules and algorithms
- Mapping: word 0 → TAG, 1 → Calling station, 2 → Maniac, 3 → Rock, 4 → TAG, 4294967295 → Rock.
- Worked example (6 players, Mixed, user seat 5, clockwise bots 6, 1, 2, 3, 4): words `3, 2, 1, 0, 3` →
  `{6: Rock, 1: Maniac, 2: Calling station, 3: TAG, 4: Rock}`. Mixed is `6 TAG, 1 Calling station,
  2 Maniac, 3 Rock, 4 TAG`, so the line-up is Custom.
- Equal-to-preset example: words `0, 1, 2, 3, 0` at Mixed 6 → exactly the Mixed styles, so the line-up stays
  `Mixed`.
- Heads-up (2 players): one bot, one word.

### Error handling and configuration
- `crypto.getRandomValues` always returns valid words, so the UI path never throws. Bad injected words throw
  the RangeError above. Nothing is persisted. No new configuration.

## 6. Behaviour specification

### SPEC-01: At 9 players, Randomise line-up gives all 8 bot rows one of the four styles
- Verifies: AC#1, DoD#1, DoD#7, DoD#8
- Behaviour: Given the app on first load with the clock paused and Game Config open, When the user picks 9 in
  "Players at the table" and chooses "Randomise line-up", Then there are 8 bot rows. Each row's `Style for
  <name>` select has a selected option whose text is one of `Tight-aggressive`, `Calling station`, `Maniac`,
  `Rock`, and the row's seat and name are unchanged from before the press. The user's row still reads `You`.
  `Randomise line-up` has a box at least 44 × 44 px. Axe reports no serious or critical violations. Every
  request goes to the app's own origin. Waits are bounded Playwright expectations.
- Verification: acceptance `e2e/randomise-lineup.spec.ts::at 9 players randomise line-up gives every bot row one of the four styles`

### SPEC-02: 1,000 seeded randomisations at 6 players give every seat every style
- Verifies: AC#2, DoD#1
- Behaviour: Given `c = configForLineUp(DEFAULT_SESSION_CONFIG, 6, 'Mixed')` and one `rng = new
  Xoshiro128(20261122)`, When `randomBotStyles(c, () => rng.nextUint32())` runs 1,000 times and the styles are
  tabulated per seat, Then the seats are exactly 1, 2, 3, 4, 6. Each seat's four counts sum to 1,000. Every
  seat has each of TAG, Calling station, Maniac, Rock at least once, and every count is between 180 and 320
  (A-3).
- Verification: acceptance `tests/table/randomise-lineup.acceptance.test.ts::1000 seeded randomisations at 6 players give every seat each of the four styles`

### SPEC-03: A randomised line-up that differs from the preset starts as Custom with those styles
- Verifies: AC#3, DoD#1
- Behaviour: Given `c = configForLineUp(DEFAULT_SESSION_CONFIG, 6, 'Mixed')` and a word source yielding
  `3, 2, 1, 0, 3`, When `styles = randomBotStyles(c, source)` and the Start game config
  `configForGameType(configWithSeatStyles(c, 'Mixed', styles), 'cash', {smallBet: 4, bigBet: 8})` is seated
  with `seatSession`, Then `styles` is `{6: Rock, 1: Maniac, 2: Calling station, 3: TAG, 4: Rock}`. The
  seated table's bot seats have exactly those styles, with names, user seat 5 and button unchanged from `c`,
  and its config `lineUp` is `Custom`. With a source yielding `0, 1, 2, 3, 0` (equal to Mixed), the started
  config's `lineUp` is `Mixed`. A `Xoshiro128(7)` draw at 9 players under Tough (the test first asserts this fixed draw differs
  from Tough's styles) gives `lineUp` `Custom` and seats the drawn styles.
- Verification: acceptance `tests/table/randomise-lineup.acceptance.test.ts::start game after a randomised line-up seats the drawn styles and records Custom unless it equals the preset`

### SPEC-04: In the browser, a randomised line-up reaches the table
- Verifies: AC#3, DoD#1, DoD#7
- Behaviour: Given an init script under which `crypto.getRandomValues` on a 1-element `Uint32Array` writes the
  next of `3, 2, 1, 0, 3` (cycling) and passes every other call to the real function, and Game Config open at the
  default 6 players with Mixed, When the user chooses "Randomise line-up", Then the rows read `Seat 6 Ava Rock`,
  `Seat 1 Ben Maniac`, `Seat 2 Cal Calling station`, `Seat 3 Dee Tight-aggressive`, `Seat 4 Eli Rock`, and
  the `Mixed` radio stays checked. When the user chooses Start game, Then the header reads
  `Cash · 6 players · $4/$8 · Hand #1` and the table's bot styles by seat, clockwise from the user, are
  `6 Rock, 1 Maniac, 2 Calling station, 3 TAG, 4 Rock`. No hand needs to be played.
- Verification: acceptance `e2e/randomise-lineup.spec.ts::a randomised line-up is seated at the table after start game`

### SPEC-05: Randomise replaces edits; later edits and preset changes behave as before
- Verifies: AC#1, AC#3, DoD#7
- Behaviour: Given the same stub as SPEC-04 and Game Config at 6 Mixed, When the user sets "Style for Ava" to
  `Maniac` and then chooses "Randomise line-up", Then Ava's row shows `Rock` (the draw replaced the edit). When
  the user then sets "Style for Dee" to `Maniac`, Then only Dee's row changes. When the user picks `Soft`, Then
  the rows read the Soft preset (`Calling station, Rock, Calling station, Rock, Calling station`). When the user
  chooses "Randomise line-up" again, Then the rows read the next five stubbed draws (`3, 2, 1, 0, 3` → the same
  labels as SPEC-04).
- Verification: acceptance `e2e/randomise-lineup.spec.ts::randomise replaces earlier edits and a preset change clears it`

### SPEC-06: Game Config renders the Randomise line-up button in the Opponents header
- Verifies: AC#1, DoD#1
- Behaviour: Given Game Config rendered with `renderToString` for `DEFAULT_SESSION_CONFIG` and for a 2-player
  config, When the markup is read, Then the Opponents section contains exactly one `<button type="button">`
  whose text is `Randomise line-up`. It comes after `<h2 id="config-opponents">Opponents</h2>` and before the
  `Line-up` radiogroup, inside an element with class `config-opponents-header`. The page's button texts in
  order are `← Home`, `Randomise line-up`, `Cancel`, `Start game`.
- Verification: acceptance `tests/ui/game-config-randomise.acceptance.test.tsx::game config shows a randomise line-up button beside the opponents heading`

### SPEC-07: randomBotStyles maps words exactly and rejects bad words
- Verifies: AC#2, DoD#1
- Behaviour: Given `configForLineUp(DEFAULT_SESSION_CONFIG, n, 'Mixed')`, When `randomBotStyles` runs with a
  recording source, Then: at n=6 it calls the source exactly 5 times and assigns words to seats in
  `botsClockwise` order (6, 1, 2, 3, 4); words `0, 1, 2, 3, 4294967295` give `TAG, Calling station, Maniac,
  Rock, Rock`; at n=2 it calls once and returns one key (the bot's seat); at n=10 it returns 9 keys and none
  is the user seat; the result is frozen. The words `-1`, `1.5`, `4294967296` and `NaN` each throw
  `RangeError('Random word out of range: <w>')`. `configWithSeatStyles(c, 'Mixed', {})` returns `c`, and
  `configWithSeatStyles(c, 'Mixed', {5: 'Rock'})` throws `RangeError('Seat 5 is not a bot seat')`.
- Verification: unit `tests/table/randomise-lineup.test.ts::randomBotStyles draws one word per bot in clockwise order and maps it modulo four`

### SPEC-08: Earlier stories' tests pass with the Q-3 amendments only
- Verifies: DoD#1, DoD#7
- Behaviour: Given the four routine amendments in Q-3 (each inserts `'Randomise line-up'` after `'← Home'` in a
  Game Config button list), When the full unit and e2e suites run, Then they pass in Chromium and WebKit. No
  other locked assertion changes. Replay-draw counts in `e2e/next-hand.spec.ts` are unchanged because no test
  there presses the button and the randomiser never requests a 4-word array.
- Verification: integration `npm test && npm run e2e`

### SPEC-09: Lint, typecheck, tests, coverage and the headless boundary
- Verifies: DoD#2, DoD#4, DoD#5
- Behaviour: Given the change, When the checks run, Then lint, typecheck and tests pass with zero errors and
  coverage thresholds hold. `src/engine`, `src/bots`, `src/advice` are not modified. `randomBotStyles` in
  `src/table/session.ts` uses no `crypto`, `Math.random` or DOM; only the screen touches `crypto`.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-10: CI green and story documentation published
- Verifies: DoD#10, DoD#11
- Behaviour: Given the branch is pushed, When CI runs, Then every job is green. A story doc describing the
  button, the uniform per-seat draw, the Custom/preset naming and the edit-replacement rule is published with
  `backlog doc create`.
- Verification: manual CI run on branch `doit/TASK-2.9` and `backlog doc list --plain`

### SPEC-11: Not-applicable DoD items
- Verifies: DoD#3, DoD#6, DoD#9, DoD#12
- Behaviour: No golden-spot suite and no service worker exist yet. The story adds no strategy content. Engine,
  bots and advice code are not changed, so the 10,000-hand playtest is unaffected.
- Verification: manual Judge confirms no `tests/advice/*golden*` suite, no service worker, no strategy content, and `git diff --stat main -- src/engine src/bots src/advice` is empty

## 7. Edge cases
- Heads-up: one bot, one word (SPEC-07).
- 10 players: nine bots, nine words; the user seat is never drawn (SPEC-07).
- Draw equals the preset: the name stays the preset (SPEC-03).
- Randomise after manual edits: they are replaced (SPEC-05). Manual edit after randomise: it applies on top (SPEC-05).
- Preset or players change after randomise: edits discarded (SPEC-05, TASK-2.8 A-2). Game type or stake change: kept (existing behaviour).
- Repeated presses: each press draws afresh (SPEC-05).
- Bad word from an injected source: RangeError (SPEC-07). Cannot occur from `crypto.getRandomValues`.
- Concurrency, permissions, persistence, network failure: N/A (client-side state only).

## 8. Security considerations
- Randomness: per-seat styles come from `crypto.getRandomValues` (a CSPRNG) and are mapped with exactly uniform
  `% 4`. Fairness here is low-stakes (practice opponents), but the draw is unbiased and unpredictable. Tests
  inject a seeded source; the production source is not seedable from user input.
- No new inputs, dependencies, storage or network (SPEC-01 checks the origin).

## 9. Non-functional
- Accessibility: native button, visible text as accessible name, ≥ 44 × 44 px (SPEC-01); axe zero
  serious/critical (SPEC-01).
- No speed or scale checks in every-push suites. SPEC-02's 1,000 draws take milliseconds.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run build && npm run preview`, then open `http://localhost:4173` → New game (or `npm run dev`)
- New tests:
  - `tests/table/randomise-lineup.acceptance.test.ts` → SPEC-02, SPEC-03
  - `tests/table/randomise-lineup.test.ts` → SPEC-07
  - `tests/ui/game-config-randomise.acceptance.test.tsx` → SPEC-06
  - `e2e/randomise-lineup.spec.ts` → SPEC-01, SPEC-04, SPEC-05
- Builder order: the four Q-3 files are already unlocked under their owners (TASK-2.1:
  `tests/ui/home.acceptance.test.tsx`; TASK-2.4: `tests/ui/game-config-game-type.acceptance.test.tsx`; TASK-2.3:
  `tests/ui/game-config-stake.acceptance.test.tsx`, `e2e/stake-choice.spec.ts`). Edit them as in Q-3 only; no
  unlock step is needed.
- Judge end-to-end scenario: fresh browser → New game. "Randomise line-up" sits beside the Opponents heading.
  Pick 9 players and press it a few times: all 8 rows change to a mix of Tight-aggressive, Calling station,
  Maniac and Rock, and names and seats stay put. Press until the rows differ from Mixed, then Start game: the
  table's styles match the rows. Back → New game → Soft → randomise → switch to Tough: the Tough rows return.

## 11. Open questions
None. Resolved in `doit/TASK-2.9/qa.md` (autopilot, 2026-11-22):
- Q-1 (auto-accepted, recommended): each bot seat independently gets a uniformly random style (1/4 each of TAG,
  Calling station, Maniac, Rock) via `word % 4`, words from `crypto.getRandomValues`, one 1-word call per seat,
  only when the button is pressed (D-1).
- Q-2 (auto-accepted, recommended): an outline button "Randomise line-up" beside the Opponents heading, no
  confirmation, preset radio unchanged, rows update in place (D-2).
- Q-3 (auto-accepted, routine): insert 'Randomise line-up' after '← Home' in the button lists of the four files
  in D-4 / section 5. No other expected value changes. Any other locked-test failure is escalated.

## 12. Clarifications log
See `doit/TASK-2.9/qa.md`.
