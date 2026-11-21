# Spec: TASK-2.4 — Choose Cash game or Sit-and-go

Status: READY (approved 2026-11-21)
Task: TASK-2.4 · Parent/epic: TASK-2 (Launch and set up a session) · Requirements: REQ-005, REQ-006, REQ-012 · Dream: limit-holdem-trainer

## 1. Summary
Game Config shows the game type as fixed text, "Cash game" (TASK-2.1 D-6). This story makes it a choice
between exactly Cash game and Sit-and-go, with Cash game selected on first use. Choosing Sit-and-go hides the
stake selector and the Buy-in row. Switching back to Cash game shows them again with the stake chosen before.
Start game hands over a session configuration with game type `sit-and-go` and no stake. For this to work,
`SessionConfig` becomes a cash | sit-and-go union. The table can open a sit-and-go at a fixed level-1
structure: 1,500 chips each, 20/40, blinds 10/20. The user's action bar labels amounts in chips ("Call 20",
"Raise to 40"). The real sit-and-go structure (rising levels, busting, results, chips without "$" everywhere)
stays in E05.

## 2. Scope
- In scope:
  - `src/table/session.ts`: widen `GameType` to `'cash' | 'sit-and-go'` and split `SessionConfig` into
    `CashSessionConfig | SitAndGoSessionConfig`, where only the cash variant has `stake` (D-3). Add the
    sit-and-go level-1 constants and the helpers `tableStake`, `startingStack` and `configForGameType`.
    `resolveSessionConfig` returns a sit-and-go config with no `stake` key. `seatSession` and the TEMPORARY
    top-up in `nextHand` use `tableStake` and `startingStack`.
  - `src/table/table-view.ts`: `headerText` handles sit-and-go (D-2).
  - `src/table/action-bar.ts`: `userActionBar` passes `'chips'` for a sit-and-go and `'dollars'` for cash
    (AC#6).
  - `src/ui/config/GameConfigScreen.tsx`: the Game type row becomes a two-option radio group (D-4), held in
    local state. The Stakes and Buy-in rows are rendered only for Cash game. Start game calls
    `onStart(configForGameType(config, gameType, stake))`.
  - `src/ui/styles.css`: style the game-type radio options (44 px targets, selected border).
  - `tests/support/table-scenarios.ts` (support file, not locked): type `STORYBOARD_CONFIG` as
    `CashSessionConfig` so `STORYBOARD_CONFIG.stake` still typechecks.
  - New tests (unit, acceptance, Playwright), plus extraction-only amendments to two locked tests (D-5).
- Not doing:
  - Level schedule and rising limits (TASK-5.4), level in the header (TASK-5.5), busting or empty seats
    (TASK-5.2), finishing position or results (TASK-5.7+), session record (E03-S11).
  - Showing every other sit-and-go amount without "$". Stacks, "This street", pot, action lines and the review
    keep "$" until TASK-5.3. Only the action bar changes here (AC#6).
  - Removing the TEMPORARY top-up (TASK-1.16 / TASK-3.11). For a sit-and-go it refills to 1,500 (A-3).
  - Adding game type or sit-and-go level to the engine's `HandConfig` / `PlayerView`. The task's
    Implementation Notes ask for this, but no AC needs it, and TASK-5.1 carries the same note together with
    the level it needs (A-5, scope concern).
  - Remembering the last game type, or any storage (TASK-2.10). Nothing is written to `localStorage` or
    `sessionStorage`.
  - Players, line-up, bot style and speed selectors (TASK-2.2, TASK-2.5, TASK-2.11).
  - Any change to the engine, bots, advice or the playtest CLI (`src/playtest/runner.ts` keeps its own
    `SNG_STAKES` / `SNG_STARTING_CHIPS`, A-4).
- Scope budget: files=12, lines=520

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Nothing is stored. Every opening of Game Config shows Cash game and $4/$8, including after Cancel or ← Home, until TASK-2.10. | yes | Same as TASK-2.3 A-1. The app stores nothing (locked `e2e/home.spec.ts`). | Keep the last game type in `App` memory |
| A-2 | The stake chosen before switching to Sit-and-go is kept in `GameConfigScreen` state while the screen stays open. It is not kept across Cancel. | yes | AC#4 needs only a round trip within the screen. A-1 covers reopening. | Lift the state to `App` |
| A-3 | In a sit-and-go the TEMPORARY top-up refills a seat below `minimumStack` to 1,500 (`startingStack(config)`). | yes | The top-up is temporary code that exists because the engine has no all-in yet (`src/table/session.ts:175-177`), and TASK-1.16 / TASK-3.11 remove it. Refilling to the game's starting stack keeps the existing behaviour. Busting in a sit-and-go is TASK-5.2. | Refill to the cash buy-in (meaningless without a stake) |
| A-4 | The sit-and-go level-1 constants live in `src/table/session.ts` (`SIT_AND_GO_STARTING_CHIPS = 1500`, `SIT_AND_GO_LEVEL_1: Stake = { smallBet: 20, bigBet: 40 }`, both frozen). The playtest runner's own `SNG_STAKES` / `SNG_STARTING_CHIPS` (`src/playtest/runner.ts:31-32`) are left alone. | yes | The values match REQ-008.1/008.2 L1 and the runner. TASK-5.1 says to model the sit-and-go as a table definition with a level schedule, so merging the two belongs there. The table should not import from the playtest module. | Import the runner constants into `session.ts` |
| A-5 | Game type and level are not added to `HandConfig` / `PlayerView` in this story. | yes | No AC needs it. Bots and advice would see the same view either way. TASK-5.1 has the same follow-up note and owns the level. Doing it here touches the engine for no observable gain. | Add `gameType` now and the level later |
| A-6 | Helper names: `tableStake(config)` returns the cash stake or `SIT_AND_GO_LEVEL_1`; `startingStack(config)` returns `buyIn(stake)` for cash or 1,500 for a sit-and-go; `configForGameType(config, gameType, stake)` builds the config Start game hands over. | yes | These are internal names, kept close to the existing `stakesFor` / `buyIn`. | Inline the logic in `GameConfigScreen` |
| A-7 | When Game Config is opened with a sit-and-go config (only possible once TASK-2.10 pre-fills), the hidden stake state starts at `DEFAULT_SESSION_CONFIG.stake` ($4/$8). | yes | A sit-and-go config carries no stake to start from. | Remember a separate last cash stake (TASK-2.10) |
| A-8 | The radio values are `cash` and `sit-and-go`, the group name is `game-type`, and the label span id is `config-game-type`. | yes | These are not user-visible. They match the `GameType` values. | — |

## 3. Current system
- Stack: React 19 + Vite + strict TypeScript. Vitest runs in the `node` environment, and UI unit tests render
  with `renderToString` and regex the markup (`tests/ui/game-config-stake.acceptance.test.tsx:11-25`). There is
  no jsdom, so interaction is tested in Playwright (Chromium + WebKit, 1280×720, `playwright.config.ts`).
  Coverage: 90% for `src/{engine,bots,advice,stats,playtest,table}`, 70% overall (`vite.config.ts`).
- `GameType` is `'cash'` with the comment "TASK-2.4 widens: 'sit-and-go' (no stake)"
  (`src/table/session.ts:68-69`). That settles the value name `'sit-and-go'`. `SessionConfig` has a required
  `stake: Stake` (`:75-88`), and `DEFAULT_SESSION_CONFIG` is cash $4/$8 (`:89-98`).
  `resolveSessionConfig(input: Partial<SessionConfig>)` spreads the input over the default (`:101-103`).
- `config.stake` is read in only four places: `seatSession` (`src/table/session.ts:128,131`), the TEMPORARY
  top-up in `nextHand` (`:177`), `headerText` (`src/table/table-view.ts:57-60`, `GAME_LABEL` at `:55`), and
  `GameConfigScreen` (`src/ui/config/GameConfigScreen.tsx:47`). In tests, only
  `tests/support/table-scenarios.ts:31,37` reads `.stake` from a value typed `SessionConfig`. Other tests pass
  `{ stake }` partials (`tests/table/session.acceptance.test.ts:101`, `tests/ui/table.acceptance.test.tsx:42`,
  `e2e/support/table-harness.tsx:18`), and those stay valid because `Partial` distributes over the union.
- `actionBar(view, unit = 'dollars')` already supports `'chips'` (`src/table/action-bar.ts:16,31-35,66`).
  `userActionBar` always uses dollars, with a TASK-2.4 note (`:77-81`). The table renders `userActionBar(table)`
  (`src/ui/table/Table.tsx:156`).
- Engine legal actions are ordered fold, call, raise (or check, bet/raise) with raise "to" `fullBetTarget`
  (`src/engine/hand.ts:331-353`).
- Game Config renders `<dl className="config-fields">` rows of `[key, label, value]`
  (`GameConfigScreen.tsx:65-71,87-94`). The Game type row is the text `GAME_TYPE_LABELS[config.gameType]`
  ("Cash game"). Row CSS is at `src/ui/styles.css:123-160`.
- Storyboard: `dreams/limit-holdem-trainer/storyboards/Config.dc.html:27-33` shows a `<fieldset>` "Game type"
  with two radio labels, "Cash game" (checked, 2px #D7262E border) and "Sit-and-go" (1px #343A43 border), each
  `min-height: 44px; padding: 0 16px; border-radius: 8px; font-size: 15px`.
- Sit-and-go numbers: REQ-008.1 gives 1,500 chips and REQ-008.2 gives L1 20/40 with blinds 10/20
  (`dreams/limit-holdem-trainer/requirements.md:173-174`). The playtest uses the same values
  (`src/playtest/runner.ts:31-32`). `stakesFor({20,40})` gives blinds 10/20 (`src/table/session.ts:30-37`).
- Locked tests touched or at risk (from `doit/*/state.json` `locked_tests`):
  - `tests/ui/home.acceptance.test.tsx` (owner TASK-2.1). It breaks: the radio `<dd>` is extracted as raw
    markup, and `html.match(/<(input|select|textarea)[\s>]/g)` must equal `['<select ']` (lines 44-58, 74). See D-5.
  - `tests/ui/game-config-stake.acceptance.test.tsx` (owner TASK-2.3). Its test
    `no stake or buy-in text or control offers deposit, payment or real money` asserts
    `not.toMatch(/<(a|input|form)[\s>]/)` (line 67), so it breaks. Its other two tests are unaffected
    because there is still exactly one `<select>`. See D-5.
  - Unaffected because radios are not buttons, comboboxes, textboxes or links, and the cash default is
    unchanged: `e2e/stake-choice.spec.ts` (TASK-2.3, combobox count 1, button list, `textbox` 0),
    `tests/table/stakes.acceptance.test.ts` (TASK-2.3), `e2e/home.spec.ts`,
    `tests/table/session-config.acceptance.test.ts` (TASK-2.1), `tests/table/session.acceptance.test.ts`,
    `tests/ui/table.acceptance.test.tsx`, `e2e/table.spec.ts` (TASK-3.1), `tests/table/action-bar*.acceptance`,
    `e2e/action-bar*.spec.ts` (TASK-3.2, TASK-3.7), `tests/table/session-stacks.acceptance.test.ts`,
    `e2e/home-first-load.spec.ts` (TASK-2.18), `tests/table/next-hand.acceptance.test.ts` (TASK-3.4),
    `e2e/table-display.spec.ts`, `tests/ui/table-display.acceptance.test.tsx` (TASK-3.3),
    `e2e/responsive-table.spec.ts` (TASK-3.6), `tests/table/review.acceptance.test.ts` (TASK-9.1),
    `tests/table/hand-result-*.acceptance.test.ts` (TASK-1.9, TASK-3.22).
- Existing code to reuse:
  - `src/table/session.ts` → `Stake`, `stakesFor`, `buyIn`, `seatSession`, `dealHand`, `stepBot`, `nextHand`,
    `DEFAULT_SESSION_CONFIG`, `USER_SEAT`.
  - `src/table/action-bar.ts` → `actionBar(view, unit)`, `AmountUnit`.
  - `src/engine/deck.ts` → `replayCodeFromWords`. `tests/support/table-scenarios.ts` → `SCENARIO_CODE`.
  - `e2e/support/table-harness-bundle.ts` → `stubReplayWords`. `e2e/support/axe.ts` →
    `expectNoSeriousAxeViolations`. `e2e/support/table-locators.ts` → `expectToAct`.
  - Paused-clock first-deal pattern: `e2e/home.spec.ts:212-249`, and the stake e2e helpers in
    `e2e/stake-choice.spec.ts:10-29` (copy them, do not import from a locked spec).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Start game with Sit-and-go opens the table with every seat (user and bots) at 1,500 chips and fixed level-1 limits 20/40 (blinds 10/20). No levels rise, nobody busts out (TEMPORARY top-up to 1,500, A-3) and no results are shown; that is E05. The action bar shows chip labels (AC#6). Stacks, pot and action lines still show "$" until TASK-5.3. | (b) Keep the user on Game Config with Start game disabled for Sit-and-go (contradicts AC#5, where Start game produces the config). (c) Open a cash $4/$8 table labelled sit-and-go (wrong chips; AC#6 labels would be meaningless). | The smallest playable result that matches REQ-008.1/008.2 L1 and the playtest's sng table. TASK-5.1 later swaps in a table definition with a level schedule without changing what the user sees at level 1. | yes | user (Q-1, auto-accepted) |
| D-2 | Table header for a sit-and-go: `Sit-and-go · <n> players · <smallBet>/<bigBet> · Hand #<k>`, e.g. `Sit-and-go · 6 players · 20/40 · Hand #1` (no "$", REQ-008.7). The cash header is unchanged: `Cash · 6 players · $4/$8 · Hand #1`. | `Sit-and-go · 6 players · Level 1 · 20/40 · Hand #1` (the level belongs to TASK-5.5); `$20/$40` (contradicts REQ-008.7) | `headerText` must change anyway because a sit-and-go config has no stake. This is the cash format with the game label swapped and no "$". Only the e2e prefix `Sit-and-go · 6 players · ` is locked, so TASK-5.5 can add the level without amending a locked test. | yes | user (Q-2, auto-accepted) |
| D-3 | `SessionConfig` becomes a discriminated union: `CashSessionConfig { gameType: 'cash'; stake: Stake; …common }` and `SitAndGoSessionConfig { gameType: 'sit-and-go'; …common }`, with no `stake` property on the sit-and-go variant. `DEFAULT_SESSION_CONFIG: CashSessionConfig`. `resolveSessionConfig(input: Partial<SessionConfig>)` keeps its signature and drops `stake` when the merged game type is `sit-and-go`. | `stake?: Stake` (optional on one interface; every reader must handle `undefined` with no type link to the game type); keep `stake` and ignore it for a sit-and-go (contradicts AC#5 "carries no stake") | The type system enforces "no stake in a sit-and-go" and forces each of the four `stake` readers to decide per game type. Locked tests that pass `{ stake }` partials or spread `DEFAULT_SESSION_CONFIG` still typecheck. Only one non-locked support file needs its annotation changed. TASK-2.10 will persist this shape. | yes | user (Q-3, auto-accepted) |
| D-4 | The game-type control is a radio group inside the existing Game type row. Markup: `<dt><span id="config-game-type">Game type</span></dt><dd><div role="radiogroup" aria-labelledby="config-game-type" class="config-choice"><label><input type="radio" name="game-type" value="cash">Cash game</label><label><input type="radio" name="game-type" value="sit-and-go">Sit-and-go</label></div></dd>`. Cash game is checked on first use. No other text is added. When Sit-and-go is checked, the Stakes and Buy-in rows are not rendered at all, and the rows read Game type, Players at the table, Speed. Each option label is at least 44 px tall. The checked option has a 2px #D7262E border and the other a 1px #343A43 border, as in the storyboard. | A native `<select>` like TASK-2.3's stake select (it would also break both `e2e/stake-choice.spec.ts` tests, which require exactly one combobox, and all three `game-config-stake` unit tests); toggle buttons with `aria-pressed` (break every locked button-list assertion) | Matches the storyboard (`Config.dc.html:27-33`) and the option text in AC#1. Two always-visible options read better than a dropdown. It breaks the fewest locked tests (two unit tests, no e2e). | yes | user (Q-4, auto-accepted) |
| D-5 | Amend two locked tests in extraction only, keeping every expected value byte-identical. (1) `tests/ui/home.acceptance.test.tsx::game config shows the first-use cash session with five TAG bots` (owner TASK-2.1): when a `<dd>` contains `type="radio"`, its value is the tag-stripped text of the `<label>` whose input has `checked=""`. The control assertion becomes `expect(html.match(/<(input|select|textarea)[\s>]/g)).toEqual(['<input ', '<input ', '<select '])`. (2) `tests/ui/game-config-stake.acceptance.test.tsx::no stake or buy-in text or control offers deposit, payment or real money` (owner TASK-2.3): replace `expect(html).not.toMatch(/<(a|input|form)[\s>]/)` with `expect(html).not.toMatch(/<(a|form)[\s>]/)` plus `expect((html.match(/<input[^>]*>/g) ?? []).map((i) => /type="radio"/.test(i))).toEqual([true, true])`. Nothing is deleted. The expected fields (`['Game type', 'Cash game']` …), rows, buttons and select checks are unchanged. | Leave the tests untouched (impossible: AC#1 requires a control, so the "no inputs" clauses and the text-only Game type extraction must change); delete the no-input assertions | Keeps every behavioural expectation. The "no form controls" clauses narrow to exactly the two radio inputs this story adds, and text inputs stay banned. | yes | user (Q-5, auto-accepted) |
| D-6 | `GameType` value is `'sit-and-go'`. | `'sng'` (playtest CLI's own type) | Settled by the comment at `src/table/session.ts:68`. The playtest's `GameType` is a separate type in `src/playtest/runner.ts:34`. | no | n/a |

## 5. Design

### Files to create / modify
- `src/table/session.ts` — `GameType` union, `CashSessionConfig` / `SitAndGoSessionConfig` / `SessionConfig`,
  `SIT_AND_GO_STARTING_CHIPS`, `SIT_AND_GO_LEVEL_1`, `tableStake`, `startingStack`, `configForGameType`;
  `resolveSessionConfig`, `seatSession` and `nextHand` use them.
- `src/table/table-view.ts` — `GAME_LABEL` gains `'sit-and-go': 'Sit-and-go'`; `headerText` per D-2.
- `src/table/action-bar.ts` — `userActionBar` passes the unit for the game type; update its doc comment.
- `src/ui/config/GameConfigScreen.tsx` — game-type radio state and row; conditional Stakes/Buy-in rows; Start
  game via `configForGameType`; stake state seeded per A-7; update the header comment.
- `src/ui/styles.css` — `.config-choice` radio option styling.
- `tests/support/table-scenarios.ts` — `STORYBOARD_CONFIG: CashSessionConfig` (type annotation only).
- `tests/ui/home.acceptance.test.tsx` — LOCKED (TASK-2.1); D-5 (1).
- `tests/ui/game-config-stake.acceptance.test.tsx` — LOCKED (TASK-2.3); D-5 (2).
- `tests/table/game-type.acceptance.test.ts` — new: SPEC-04, SPEC-05, SPEC-06.
- `tests/table/game-type.test.ts` — new: SPEC-07, SPEC-08.
- `tests/ui/game-config-game-type.acceptance.test.tsx` — new: SPEC-01, SPEC-02, SPEC-03.
- `e2e/game-type-choice.spec.ts` — new: SPEC-09, SPEC-10.

### Components, interfaces and data
- `src/table/session.ts`:
  ```ts
  export type GameType = 'cash' | 'sit-and-go';
  interface SessionConfigBase { players; lineUp; seats; speed; userSeat; button }   // as today, minus gameType/stake
  export interface CashSessionConfig extends SessionConfigBase { readonly gameType: 'cash'; readonly stake: Stake }
  export interface SitAndGoSessionConfig extends SessionConfigBase { readonly gameType: 'sit-and-go' }
  export type SessionConfig = CashSessionConfig | SitAndGoSessionConfig;
  export const DEFAULT_SESSION_CONFIG: CashSessionConfig;            // value unchanged
  /** REQ-008.1 */ export const SIT_AND_GO_STARTING_CHIPS = 1500;
  /** REQ-008.2 L1; fixed until TASK-5.4 */ export const SIT_AND_GO_LEVEL_1: Stake;   // frozen { 20, 40 }
  export function tableStake(config: SessionConfig): Stake;          // cash → config.stake; sit-and-go → SIT_AND_GO_LEVEL_1
  export function startingStack(config: SessionConfig): number;      // cash → buyIn(config.stake); sit-and-go → 1500
  export function configForGameType(config: SessionConfig, gameType: GameType, stake: Stake): SessionConfig;
  ```
  - `configForGameType`: copies every common field from `config`. For `'cash'` the result is
    `{ …common, gameType: 'cash', stake }`. For `'sit-and-go'` it is `{ …common, gameType: 'sit-and-go' }` with
    no `stake` key (`'stake' in result === false`). It never mutates `config`.
  - `resolveSessionConfig(input = {})`: merges as today. If the merged `gameType` is `'sit-and-go'`, the
    result has no `stake` key. Cash results are unchanged, so `seatSession(DEFAULT_SESSION_CONFIG).config`
    stays `toStrictEqual` the default (locked session-config test).
  - `seatSession`: `stakes: stakesFor(tableStake(config))`, every stack `startingStack(config)`.
  - `nextHand` TEMPORARY top-up: `stack < minimum ? startingStack(table.config) : stack`.
- `src/table/action-bar.ts`: `userActionBar(table)` returns
  `actionBar(playerView(hand, userSeat), table.config.gameType === 'sit-and-go' ? 'chips' : 'dollars')`, and
  null before the deal as today.
- `GameConfigScreen`: props are unchanged.
  `const [gameType, setGameType] = useState<GameType>(config.gameType)`.
  `const [stake, setStake] = useState<Stake>(config.gameType === 'cash' ? config.stake : DEFAULT_SESSION_CONFIG.stake)`.
  The radios are controlled (`checked={gameType === value}`, `onChange` sets the value). The fields list
  includes `stake` and `buy-in` only when `gameType === 'cash'`. Start game calls
  `onStart(configForGameType(config, gameType, stake))`. With no change, this equals `DEFAULT_SESSION_CONFIG`
  by value.
- No persisted data. `App`, `TableScreen`, `useTableSession` and the engine are unchanged.

### Rules and algorithms
Hand-worked, one per AC:
- AC#1: on first open, the Game type row shows two radios with label texts exactly `Cash game` and
  `Sit-and-go`, in that order.
- AC#2: on first open, the `cash` radio has `checked=""` and the `sit-and-go` radio does not. Five rows show:
  Game type, Players at the table, Stakes, Buy-in, Speed.
- AC#3: choose `$6 / $12` (Buy-in `$240 (20 big bets)`), then check Sit-and-go. There is no combobox and no
  `Stakes (small bet / big bet)` or `Buy-in` text in the Session panel. The rows are Game type, Players at the
  table, Speed.
- AC#4: then check Cash game. The combobox `Stakes (small bet / big bet)` is back with `$6 / $12` selected, and
  Buy-in reads `$240 (20 big bets)`.
- AC#5: `configForGameType(DEFAULT_SESSION_CONFIG, 'sit-and-go', { smallBet: 6, bigBet: 12 })` gives
  `{ gameType: 'sit-and-go', players: 6, lineUp: 'Custom', seats: DEFAULT_SEATS, speed: 'rapid', userSeat: 5, button: 6 }`
  with no `stake` key. `seatSession` of it gives stakes `{ smallBlind: 10, bigBlind: 20, smallBet: 20, bigBet: 40 }`
  and six stacks of 1500. The header is `Sit-and-go · 6 players · 20/40 · Hand #1`.
  `configForGameType(DEFAULT_SESSION_CONFIG, 'cash', { smallBet: 6, bigBet: 12 })` gives the default with
  `stake: { smallBet: 6, bigBet: 12 }`.
- AC#6: deal a sit-and-go with `SCENARIO_CODE` (button 6). Seat 1 posts 10 and seat 2 posts 20.
  - Scenario A: seats 3 and 4 call 20. The user (seat 5) owes 20, the full raise target is 40, and the bar is
    `['Fold', 'Call 20', 'Raise to 40']`.
  - Scenario B: seat 3 raises to 40 and seat 4 folds. The user owes 40, the target is 60, and the bar is
    `['Fold', 'Call 40', 'Raise to 60']`.
  - The same scenario A at the cash default gives `['Fold', 'Call $4', 'Raise to $8']`.

### Error handling and configuration
- No free-form input exists. The radio `onChange` only sets one of the two `GameType` values. An unknown
  `gameType` cannot be produced (TASK-2.10's loader must validate stored config).
- Defaults: Cash game and $4/$8 on every opening of Game Config (A-1).

## 6. Behaviour specification

### SPEC-01: Game type offers exactly Cash game and Sit-and-go, Cash game checked on first use
- Verifies: AC#1, AC#2, DoD#1
- Behaviour: Given `GameConfigScreen` rendered (`renderToString`) with `DEFAULT_SESSION_CONFIG`, When the markup
  is read, Then it has exactly one `role="radiogroup"`, with `aria-labelledby="config-game-type"`, and the
  element with `id="config-game-type"` has text `Game type`. The group holds exactly two
  `<input type="radio" name="game-type">`, with values `cash` and `sit-and-go`, whose label texts are
  `['Cash game', 'Sit-and-go']` in that order. Only the `cash` input carries `checked=""`. The rows (tag-stripped
  `<dt>`) are `['Game type', 'Players at the table', 'Stakes (small bet / big bet)', 'Buy-in', 'Speed']`.
- Verification: acceptance `tests/ui/game-config-game-type.acceptance.test.tsx::game type offers exactly Cash game and Sit-and-go with Cash game checked`

### SPEC-02: A sit-and-go config renders no stake selector and no buy-in
- Verifies: AC#3, DoD#1
- Behaviour: Given `GameConfigScreen` rendered with
  `configForGameType(DEFAULT_SESSION_CONFIG, 'sit-and-go', DEFAULT_SESSION_CONFIG.stake)`, When the markup is
  read, Then only the `sit-and-go` radio carries `checked=""`. There is no `<select`, no `config-stake`, and no
  text `Stakes (small bet / big bet)` or `Buy-in`. The rows are `['Game type', 'Players at the table', 'Speed']`,
  and the buttons are `['← Home', 'Cancel', 'Start game']`.
- Verification: acceptance `tests/ui/game-config-game-type.acceptance.test.tsx::a sit-and-go config shows no stake selector or buy-in`

### SPEC-03: No game-type text or control offers real money
- Verifies: AC#1, DoD#1
- Behaviour: Given `GameConfigScreen` rendered with the cash default and with the sit-and-go config, When the
  tag-stripped text is read, Then nothing matches the TASK-2.3 REAL_MONEY pattern
  `/deposit|payment|\bpay\b|purchase|buy chips|cash[- ]?out|withdraw|real[- ]?money|convert|currency|credit card/i`.
  The only `<input>` elements are the two radios, and there is no `<a`, `<form` or `<textarea`.
- Verification: acceptance `tests/ui/game-config-game-type.acceptance.test.tsx::game type choice offers no real-money text or other inputs`

### SPEC-04: Start game's sit-and-go config carries game type sit-and-go and no stake
- Verifies: AC#5, DoD#1
- Behaviour: Given `DEFAULT_SESSION_CONFIG`, When `configForGameType(DEFAULT_SESSION_CONFIG, 'sit-and-go', { smallBet: 6, bigBet: 12 })`
  is called, Then the result `toStrictEqual`s
  `{ gameType: 'sit-and-go', players: 6, lineUp: 'Custom', seats: DEFAULT_SESSION_CONFIG.seats, speed: 'rapid', userSeat: 5, button: 6 }`,
  `'stake' in result` is false, and `DEFAULT_SESSION_CONFIG` is unchanged. When it is called with `'cash'` and
  `{ smallBet: 6, bigBet: 12 }`, Then the result `toStrictEqual`s
  `{ ...DEFAULT_SESSION_CONFIG, stake: { smallBet: 6, bigBet: 12 } }`. With `'cash'` and the default stake it
  `toStrictEqual`s `DEFAULT_SESSION_CONFIG`.
- Verification: acceptance `tests/table/game-type.acceptance.test.ts::a sit-and-go config has game type sit-and-go and carries no stake`

### SPEC-05: A sit-and-go table seats 1,500 chips at 20/40 with blinds 10/20 and keeps no stake
- Verifies: AC#5, DoD#1
- Behaviour: Given `seatSession({ gameType: 'sit-and-go' })`, When read and the first hand is dealt with
  `replayCodeFromWords([0x9e3779b9, 1, 2, 3])`, Then `table.config.gameType` is `'sit-and-go'`,
  `'stake' in table.config` is false, `table.stakes` equals `{ smallBlind: 10, bigBlind: 20, smallBet: 20, bigBet: 40 }`,
  every `table.stacks` entry is 1500 for seats 1–6, and the first two action records are
  `[1, 'small-blind', 10]` and `[2, 'big-blind', 20]`.
- Verification: acceptance `tests/table/game-type.acceptance.test.ts::a sit-and-go table seats 1500 chips at 20/40 with blinds 10 and 20`

### SPEC-06: The user's action bar labels sit-and-go amounts in chips and cash in dollars
- Verifies: AC#6, DoD#1
- Behaviour: Given `seatSession({ gameType: 'sit-and-go' })` dealt with `replayCodeFromWords([0x9e3779b9, 1, 2, 3])`,
  When seats 3 and 4 each `call` (via `stepBot` with a policy returning the legal call) and `userActionBar` is
  built on the user's turn, Then its button labels are exactly `['Fold', 'Call 20', 'Raise to 40']`, `enabled`
  is true, and no label contains `$`. When instead seat 3 raises to 40 and seat 4 folds, Then the labels are
  `['Fold', 'Call 40', 'Raise to 60']`. When the same call-call scenario runs on `seatSession()` (cash $4/$8),
  Then the labels are `['Fold', 'Call $4', 'Raise to $8']`.
- Verification: acceptance `tests/table/game-type.acceptance.test.ts::a sit-and-go action bar labels amounts in chips without a dollar sign`

### SPEC-07: Header text per game type
- Verifies: AC#5, DoD#1
- Behaviour: Given `headerText`, When called with `seatSession({ gameType: 'sit-and-go' }).config` and hand 1,
  Then it returns `Sit-and-go · 6 players · 20/40 · Hand #1`. With `DEFAULT_SESSION_CONFIG` and hand 3 it
  returns `Cash · 6 players · $4/$8 · Hand #3`.
- Verification: unit `tests/table/game-type.test.ts::header names the game type and shows sit-and-go limits without a dollar sign`

### SPEC-08: Config resolution, starting stack and the TEMPORARY top-up per game type
- Verifies: AC#5, DoD#1
- Behaviour: Given `resolveSessionConfig({ gameType: 'sit-and-go' })`, Then it has no `stake` key, and
  `resolveSessionConfig({})` `toStrictEqual`s `DEFAULT_SESSION_CONFIG`. `tableStake` returns
  `{ smallBet: 20, bigBet: 40 }` for a sit-and-go and the config's stake for cash. `startingStack` returns 1500
  and 160 respectively. `SIT_AND_GO_LEVEL_1` is frozen. Given a sit-and-go table whose finished hand left seat 1
  below `minimumStack(table.stakes)`, When `nextHand` runs, Then seat 1's stack is 1500 (A-3).
- Verification: unit `tests/table/game-type.test.ts::sit-and-go resolves without a stake and tops up to its 1500 starting stack`

### SPEC-09: In the browser, Sit-and-go hides the stake selector and Cash game restores $6/$12
- Verifies: AC#1, AC#2, AC#3, AC#4, DoD#1, DoD#7
- Behaviour: Given Home → New game in Chromium and WebKit, When the radio group named `Game type` is read, Then
  its radios are exactly `Cash game` and `Sit-and-go` (`getByRole('radio')` names) and `Cash game` is checked.
  `expectNoSeriousAxeViolations` passes, each radio's label box is at least 44 px high, and there is no
  horizontal overflow at 1280×720. When `$6 / $12` is selected and then `Sit-and-go` is checked, Then
  `getByRole('combobox')` has count 0, the `.config-fields` text contains neither `Stakes (small bet / big bet)`
  nor `Buy-in`, `Sit-and-go` is checked, and axe passes. When `Cash game` is checked, Then the combobox labelled
  `Stakes (small bet / big bet)` is visible with selected option `$6 / $12`, and the Buy-in value reads
  `$240 (20 big bets)`. When Sit-and-go is checked, then Cancel and New game are pressed, Then `Cash game` is
  checked and `$4 / $8` is selected (A-1). `localStorage.length` and `sessionStorage.length` are unchanged
  throughout.
- Verification: acceptance `e2e/game-type-choice.spec.ts::sit-and-go hides the stake selector and cash game brings back the chosen stake`

### SPEC-10: Starting a sit-and-go opens the table with chip labels on the action bar
- Verifies: AC#5, AC#6, DoD#1, DoD#7, DoD#8
- Behaviour: Given the clock installed at 0 and paused at 1000, `stubReplayWords` with `[0x9e3779b9, 1, 2, 3]`,
  Home → New game, and `Sit-and-go` checked, When Start game is pressed, Then `.table-header-line` text starts
  with `Sit-and-go · 6 players · ` and, before the clock is advanced, every seat's `[data-part="stack"]` text
  contains `1500` (the "$" format is TASK-5.3's, so it is not asserted). When the clock is
  advanced in 50 ms slices (at most 5,000 ms) until `expectToAct(page, '5')` holds, Then the enabled buttons in
  the `Your actions` group have texts each matching `/^(Fold|Check|Call \d+|Bet \d+|Raise to \d+)$/`, at least
  one starts with `Call ` or `Raise to `, and none contains `$`. Every request the page made has origin
  `http://localhost:4173`.
- Verification: acceptance `e2e/game-type-choice.spec.ts::starting a sit-and-go opens the table with chip labels on the action bar`

### SPEC-11: Earlier stories' tests still pass, with the cash default unchanged
- Verifies: DoD#1, DoD#7
- Behaviour: Given the change, When the full unit and browser suites run, Then all pass. This includes the
  D-5-amended `tests/ui/home.acceptance.test.tsx` and `tests/ui/game-config-stake.acceptance.test.tsx` with
  their expected values unchanged, and the untouched locked `e2e/stake-choice.spec.ts`, `e2e/home.spec.ts`,
  `tests/table/session-config.acceptance.test.ts` and `tests/table/stakes.acceptance.test.ts`.
- Verification: integration `npm test && npm run e2e`

### SPEC-12: Lint, typecheck, tests, coverage and headless boundary
- Verifies: DoD#2, DoD#4, DoD#5
- Behaviour: Given the change, When the checks run, Then lint (incl. the headless-boundary rule and
  prettier), typecheck and the tests pass with zero errors, and coverage meets ≥90% for
  `src/{engine,bots,advice,stats,playtest,table}` and ≥70% overall.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-13: Playtest stays clean
- Verifies: DoD#6
- Behaviour: Given the engine, bots and advice are untouched, When the 10,000-hand playtest runs for cash and
  sng, Then each reports zero invariant violations and exits 0.
- Verification: command `npm run playtest -- --hands 10000 --seed 42 && npm run playtest -- --hands 10000 --seed 42 --game sng`

### SPEC-14: CI green and story documentation published
- Verifies: DoD#10, DoD#11
- Behaviour: Given the branch `doit/TASK-2.4` is pushed, When CI runs, Then every job is green. The story
  document for TASK-2.4 is published to Backlog.md.
- Verification: manual CI run on branch `doit/TASK-2.4` and `backlog doc list --plain`

### SPEC-15: Not-applicable DoD items
- Verifies: DoD#3, DoD#9, DoD#12
- Behaviour: Given the golden-spot suite (E07-S14) and the offline service worker (E13-S07) are not yet Done,
  and this story adds no strategy content, When judged, Then these items are N/A.
- Verification: manual Judge confirms the diff adds no strategy text and that E07-S14 and E13-S07 are not Done

## 7. Edge cases
- Round trip with a non-default stake (AC#4): the stake survives Sit-and-go → Cash game because it lives in
  screen state, not in the unmounted select (SPEC-09).
- Re-checking the already-checked radio: native, no change, no test needed.
- Reopening Game Config after Cancel resets to Cash game, $4/$8 (A-1, SPEC-09).
- Opening Game Config with a sit-and-go config (future TASK-2.10): Sit-and-go checked, stake rows hidden, hidden
  stake $4/$8 (A-7, SPEC-02).
- Short stacks in a sit-and-go: the TEMPORARY top-up refills to 1,500 (A-3, SPEC-08). The all-in label path for
  chips is already covered by TASK-3.7's locked tests (`actionBar(view, 'chips')`).
- Invalid game type, persistence, concurrency, network failure: N/A, since the input is limited to two radios
  and nothing is stored or fetched.

## 8. Security considerations
- Trust boundaries: the only new input is two native radios with fixed values. The handler sets one of the two
  `GameType` literals, so no free-form value reaches the session.
- No authn/authz, secrets, injection surface, logging, new dependencies, randomness or network requests
  (SPEC-10 asserts same-origin only).
- Play money only: SPEC-03 asserts no real-money wording or extra inputs (REQ-006.3).

## 9. Non-functional
- Accessibility: the radio group has a programmatic name (`Game type`), the options are at least 44 px tall,
  there is no horizontal overflow at 1280×720, and axe shows zero serious/critical violations in both
  game-type states (SPEC-09).
- Offline/network: no new requests (SPEC-10).
- No performance-sensitive code. No slow-group tests added.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run build && npm run preview` then open `http://localhost:4173` (or `npm run dev`)
- New tests: `tests/ui/game-config-game-type.acceptance.test.tsx` → SPEC-01..03;
  `tests/table/game-type.acceptance.test.ts` → SPEC-04..06; `tests/table/game-type.test.ts` → SPEC-07, SPEC-08;
  `e2e/game-type-choice.spec.ts` → SPEC-09, SPEC-10. Amended (locked, D-5): `tests/ui/home.acceptance.test.tsx`,
  `tests/ui/game-config-stake.acceptance.test.tsx`. Browser e2e: `npm run e2e`.
- Builder notes:
  - SSR renders a controlled checked radio as `checked=""`.
  - For SPEC-06, drive bots with `stepBot(table, policy)`, using a policy that picks the legal `call` (or
    `raise` / `fold`) from `view.legalActions`, and loop while `nextStep(table) === 'bot'` until seat 5 is to act.
    Only seats 3 and 4 act before seat 5 preflop with button 6.
  - In e2e, use `page.getByRole('radiogroup', { name: 'Game type' })` and
    `page.getByRole('radio', { name: 'Sit-and-go' }).check()`. Copy the stake helpers from
    `e2e/stake-choice.spec.ts:10-29` rather than importing from it. Install the clock and `stubReplayWords`
    before `page.goto`.
- Judge scenario: `npm run build && npm run preview`, open `http://localhost:4173` at 1280×720 in Chrome and
  Safari. New game → Game type shows `Cash game` (checked) and `Sit-and-go`. Pick `$6 / $12` → Buy-in
  `$240 (20 big bets)`. Check Sit-and-go → the Stakes and Buy-in rows disappear. Check Cash game → Stakes is back
  at `$6 / $12`. Check Sit-and-go → Start game → header `Sit-and-go · 6 players · 20/40 · Hand #1`, each seat
  holds 1,500, the blinds are 10 and 20, and on your turn the buttons read e.g. `Fold`, `Call 20`, `Raise to 40`
  with no `$`. Leave → New game → Cash game and $4/$8 are selected again.

## 11. Open questions
- None. Q-1..Q-5 answered (auto-accepted, recommended options) in `doit/TASK-2.4/qa.md`. Scope concern on A-5 agreed: HandConfig/PlayerView game type and level stay on TASK-5.1.

## 12. Clarifications log
See `doit/TASK-2.4/qa.md`.
